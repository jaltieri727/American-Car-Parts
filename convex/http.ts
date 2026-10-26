import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      const payload = await request.text();
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey || !STRIPE_WEBHOOK_SECRET || !signature) {
        return new Response("Stripe webhook is not configured", { status: 503 });
      }

      const stripe = new Stripe(stripeSecretKey);
      event = await stripe.webhooks.constructEventAsync(payload, signature, STRIPE_WEBHOOK_SECRET);
      // Live Connect endpoints can also receive test events. Never mix environments.
      if (event.livemode !== stripeSecretKey.startsWith("sk_live_")) {
        return new Response(null, { status: 200 });
      }

      const syncSubscription = async (subscriptionId: string, fallbackClerkId?: string) => {
        // Retrieve current state so retried or out-of-order events cannot restore canceled access.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clerkId = subscription.metadata.clerkId || fallbackClerkId;
        if (!clerkId) return;
        await ctx.runMutation(internal.stripe.handlePaymentSuccess, {
          clerkId, subscriptionId, status: subscription.status,
          currentPeriodEnd: Math.max(0, ...subscription.items.data.map(item => item.current_period_end)) * 1000,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      };

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.mode === "subscription") {
            if (typeof session.subscription === "string") await syncSubscription(session.subscription, session.metadata?.clerkId);
            break;
          }
          if (session.payment_status !== "paid") break;
          if (session.metadata?.clerkId && session.amount_total && typeof session.payment_intent === "string") {
            if (session.metadata.checkoutDraftId) {
              const result = await ctx.runMutation(internal.checkout.complete, {
                draftId: session.metadata.checkoutDraftId as Id<"checkoutDrafts">,
                sessionId: session.id, paymentIntentId: session.payment_intent,
                totalCents: session.amount_total, consumerId: session.metadata.clerkId,
                shippingDetails: session.collected_information?.shipping_details ?? (session as any).shipping_details ?? undefined,
              });
              if (result.created && session.customer_details?.email) {
                await ctx.scheduler.runAfter(0, internal.emails.sendTransactionalEmail, {
                  to: session.customer_details.email, subject: "Order Confirmation - CrankOver",
                  html: `<h1>Your order #CO-${result.orderId.slice(-6)} has been received.</h1><p>Thank you for choosing CrankOver.</p>`,
                });
              }
              break;
            }
            // Compatibility for sessions opened before the fee-setting deployment.
            const orderId = await ctx.runMutation(internal.orders.internalCreateOrderFromWebhook, {
              amount: session.amount_total / 100,
              consumerId: session.metadata.clerkId,
              providerId: session.metadata.providerId || "system",
              items: JSON.parse(session.metadata.items || "[]"),
              stripePaymentIntentId: session.payment_intent as string,
              stripeSessionId: session.id,
              shippingDetails: (session as any).shipping_details || undefined,
            });

            if (session.customer_details?.email) {
              const email = session.customer_details.email;
              await ctx.runAction(internal.emails.sendTransactionalEmail, {
                to: email,
                subject: "Order Confirmation - CrankOver Protocol",
                html: `<h1>Your order #CO-${orderId.slice(-6)} has been received.</h1><p>Thank you for choosing CrankOver. Your classic parts are now in the restoration queue.</p>`,
              });
            }

          }
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.checkoutDraftId) await ctx.runMutation(internal.checkout.discard, { draftId: session.metadata.checkoutDraftId as Id<"checkoutDrafts"> });
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          await syncSubscription((event.data.object as Stripe.Subscription).id);
          break;
        }
        case "invoice.paid":
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscription = invoice.parent?.subscription_details?.subscription ?? (invoice as any).subscription;
          if (typeof subscription === "string") await syncSubscription(subscription);
          break;
        }
      }

      return new Response(null, { status: 200 });
    } catch (err: any) {
      console.error(err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  }),
});

http.route({
  path: "/stripe/connect-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!stripeSecretKey || !webhookSecret || !signature) {
      return new Response("Stripe Connect webhook is not configured", { status: 503 });
    }

    try {
      const payload = await request.text();
      const stripe = new Stripe(stripeSecretKey);
      const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
      if (event.livemode !== stripeSecretKey.startsWith("sk_live_")) {
        return new Response(null, { status: 200 });
      }

      if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        const clerkId = account.metadata?.clerkId;
        if (clerkId) {
          await ctx.runMutation(internal.providers.internalUpdateStripeStatus, {
            clerkId,
            stripeAccountId: account.id,
            stripeConnected: Boolean(account.details_submitted && account.charges_enabled),
          });
        }
      }

      return new Response(null, { status: 200 });
    } catch (err: any) {
      console.error(err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  }),
});

export default http;
