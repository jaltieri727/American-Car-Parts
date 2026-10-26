import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";
import { destinationPayment, monthlyLineItem } from "./lib/billing";

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
};

// Identify this site's payments in Joseph's Stripe account.
const SITE_ID = process.env.SITE_ID || "default";

export const createConnectAccount = action({
  args: { frontendUrl: v.string() },
  returns: v.object({ url: v.string(), accountId: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 1. Create the Express account - metadata used by webhook to link back to provider
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: "express",
      email: identity.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        clerkId: identity.subject,
        site_id: SITE_ID // Critical for webhook routing
      },
    });

    // 2. Save the account ID immediately to the provider record
    await ctx.runMutation(internal.providers.internalUpdateStripeStatus, {
      clerkId: identity.subject,
      stripeAccountId: account.id,
      stripeConnected: false,
    });

    // 3. Create the Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${args.frontendUrl}/dashboard`,
      return_url: `${args.frontendUrl}/dashboard?stripe_connect_success=true`,
      type: "account_onboarding",
    });

    return {
      url: accountLink.url,
      accountId: account.id,
    };
  },
});

export const verifyStripeOnboarding = action({
  args: {},
  returns: v.object({ success: v.boolean(), message: v.optional(v.string()) }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const stripe = getStripe();
    const user = await ctx.runQuery(api.users.getMe);
    if (!user) throw new Error("User protocol missing");

    let stripeAccountId = user.stripeAccountId;

    // Auto-repair: If ID is missing, search Stripe for an account with this clerkId
    if (!stripeAccountId) {
      const accounts = await stripe.accounts.list({ limit: 10 });
      const matchingAccount = accounts.data.find(acc => acc.metadata?.clerkId === identity.subject);
      if (matchingAccount) {
        stripeAccountId = matchingAccount.id;
        console.log(`Auto-repair: Found existing Stripe account ${stripeAccountId} for consumer.`);
      }
    }

    if (!stripeAccountId) {
      return { success: false, message: "No account protocol initialized on Stripe side." };
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    if (account.details_submitted && account.charges_enabled) {
      await ctx.runMutation(internal.providers.internalUpdateStripeStatus, {
        clerkId: identity.subject,
        stripeAccountId: stripeAccountId,
        stripeConnected: true,
      });
      return { success: true };
    }

    return { success: false, message: "Onboarding details not yet submitted to Stripe." };
  }
});

export const createStripeLoginLink = action({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.runQuery(api.users.getMe);
    if (!user || !user.stripeAccountId || !user.stripeConnected) {
      throw new Error("Stripe account not linked or protocol not initialized.");
    }

    const loginLink = await getStripe().accounts.createLoginLink(user.stripeAccountId);
    return { url: loginLink.url };
  },
});

export const createCheckoutSession = action({
  args: {
    items: v.optional(v.array(v.object({ partId: v.id("products"), quantity: v.number() }))),
    // Accepted only for compatibility with old browser tabs; never used for pricing/payouts.
    amount: v.optional(v.number()),
    successUrl: v.string(),
    cancelUrl: v.string(),
    mode: v.optional(v.union(v.literal("payment"), v.literal("subscription"))),
    priceId: v.optional(v.string()),
    providerId: v.optional(v.string()),
  },
  returns: v.object({ url: v.union(v.string(), v.null()) }),
  handler: async (ctx, args): Promise<{ url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const stripe = getStripe();
    const mode = args.mode ?? "payment";
    const common: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode,
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      customer_email: identity.email,
    };
    if (mode === "subscription") {
      const settings = await ctx.runQuery(api.platformSettings.get, {});
      const user = await ctx.runQuery(api.users.getMe, {});
      if (user?.role !== "provider") throw new Error("Only sellers need a subscription.");
      if (!settings) throw new Error("Payment settings are not configured.");
      if (user.stripeSubscriptionId) {
        const current = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (!["canceled", "incomplete_expired"].includes(current.status)) throw new Error("You already have a subscription. Manage it from your dashboard.");
      }
      const session = await stripe.checkout.sessions.create({
        ...common,
        line_items: [monthlyLineItem(settings.proPlanPrice)],
        metadata: { clerkId: identity.subject, site_id: SITE_ID },
        subscription_data: { metadata: { clerkId: identity.subject, site_id: SITE_ID } },
      }, { idempotencyKey: `subscription-${identity.subject}-${settings.proPlanPrice}-${Math.floor(Date.now() / 1800000)}` });
      return { url: session.url };
    }
    const draft = await ctx.runMutation(internal.checkout.prepare, { consumerId: identity.subject, items: args.items ?? [] });
    try {
      const session = await stripe.checkout.sessions.create({
        ...common,
        line_items: [{ price_data: {
          currency: "usd", unit_amount: draft.totalCents,
          product_data: { name: "CrankOver parts order", description: "Parts and $25 shipping. No additional processing surcharge." },
        }, quantity: 1 }],
        shipping_address_collection: { allowed_countries: ["US"] },
        metadata: { clerkId: identity.subject, site_id: SITE_ID, checkoutDraftId: draft.draftId, providerId: draft.providerId },
        payment_intent_data: {
          ...destinationPayment(draft.totalCents, draft.transactionFeePercent, draft.stripeAccountId),
          metadata: { site_id: SITE_ID, transactionFeePercent: String(draft.transactionFeePercent) },
        },
      }, { idempotencyKey: draft.draftId });
      return { url: session.url };
    } catch (error) {
      if (error instanceof Error && "type" in error && error.type === "StripeInvalidRequestError") {
        await ctx.runMutation(internal.checkout.discard, { draftId: draft.draftId });
      }
      // Keep the snapshot if Stripe's response was lost: payment may still complete.
      throw error;
    }
  },
});

export const handlePaymentSuccess = internalMutation({
  args: { clerkId: v.string(), subscriptionId: v.string(), status: v.string(), currentPeriodEnd: v.number(), cancelAtPeriodEnd: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) {
      if (user.stripeSubscriptionId && user.stripeSubscriptionId !== args.subscriptionId && ["canceled", "incomplete_expired"].includes(args.status)) return null;
      await ctx.db.patch(user._id, {
        hasPaid: ["active", "trialing"].includes(args.status),
        stripeSubscriptionId: args.subscriptionId, subscriptionStatus: args.status,
        subscriptionCurrentPeriodEnd: args.currentPeriodEnd,
        subscriptionCancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
    return null;
  },
});

export const cancelSubscription = action({
  args: {}, returns: v.null(),
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.getMe, {});
    if (!user?.stripeSubscriptionId) throw new Error("No subscription found.");
    const subscription = await getStripe().subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
    await ctx.runMutation(internal.stripe.handlePaymentSuccess, {
      clerkId: user.clerkId, subscriptionId: subscription.id, status: subscription.status,
      currentPeriodEnd: Math.max(0, ...subscription.items.data.map(item => item.current_period_end)) * 1000,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
    return null;
  },
});
