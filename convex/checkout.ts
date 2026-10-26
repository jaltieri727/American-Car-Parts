import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { marketplaceAmounts } from "./lib/billing";
import { requireSellerAccess } from "./lib/sellerAccess";

export const prepare = internalMutation({
  args: {
    consumerId: v.string(),
    items: v.array(v.object({ partId: v.id("products"), quantity: v.number() })),
  },
  returns: v.object({
    draftId: v.id("checkoutDrafts"), totalCents: v.number(),
    transactionFeePercent: v.number(), stripeAccountId: v.string(), providerId: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!args.items.length || args.items.length > 50) throw new Error("Checkout requires 1–50 items.");
    const settings = await ctx.db.query("platformSettings").first();
    if (!settings) throw new Error("Payment settings are not configured.");
    let totalCents = 2500; // Existing $25 shipping; the fee applies to the entire payment.
    let providerId = "";
    const items = [];
    for (const item of args.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        throw new Error("Quantity must be a whole number between 1 and 99.");
      }
      const product = await ctx.db.get(item.partId);
      if (!product || !product.inStock) throw new Error("An item is no longer available.");
      if (providerId && providerId !== product.providerId) throw new Error("Please check out items from one seller at a time.");
      providerId = product.providerId;
      if (!Number.isFinite(product.price) || product.price < 0) throw new Error("Invalid product price.");
      totalCents += Math.round(product.price * 100) * item.quantity;
      const image = product.images[0];
      items.push({
        partId: item.partId, quantity: item.quantity, priceAtPurchase: Math.round(product.price * 100) / 100, name: product.name,
        ...(image ? { image: image.startsWith("http") ? image : (await ctx.storage.getUrl(image)) ?? undefined } : {}),
      });
    }
    marketplaceAmounts(totalCents, settings.transactionFee);
    const provider = await ctx.db.query("providers").withIndex("by_clerkId", q => q.eq("clerkId", providerId)).unique();
    if (!provider?.stripeConnected || !provider.stripeAccountId) throw new Error("This seller has not finished setting up Stripe payouts.");
    await requireSellerAccess(ctx, providerId);
    const draft = { consumerId: args.consumerId, providerId, stripeAccountId: provider.stripeAccountId, totalCents, transactionFeePercent: settings.transactionFee, items };
    const draftId = await ctx.db.insert("checkoutDrafts", draft);
    return { draftId, totalCents, transactionFeePercent: settings.transactionFee, stripeAccountId: provider.stripeAccountId, providerId };
  },
});

export const complete = internalMutation({
  args: {
    draftId: v.id("checkoutDrafts"), sessionId: v.string(), paymentIntentId: v.string(),
    totalCents: v.number(), consumerId: v.string(), shippingDetails: v.optional(v.any()),
  },
  returns: v.object({ orderId: v.id("orders"), created: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("orders").withIndex("by_stripeSessionId", q => q.eq("stripeSessionId", args.sessionId)).unique();
    if (existing) return { orderId: existing._id, created: false };
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.totalCents !== args.totalCents || draft.consumerId !== args.consumerId) throw new Error("Checkout does not match its saved order.");
    const amounts = marketplaceAmounts(draft.totalCents, draft.transactionFeePercent);
    const orderId = await ctx.db.insert("orders", {
      amount: draft.totalCents / 100, consumerId: draft.consumerId, providerId: draft.providerId,
      items: draft.items, stripeSessionId: args.sessionId, stripePaymentIntentId: args.paymentIntentId,
      transactionFeePercent: draft.transactionFeePercent, platformFeeAmount: amounts.feeCents / 100,
      sellerAmount: amounts.sellerCents / 100, shippingDetails: args.shippingDetails,
      date: new Date().toISOString(), status: "Processing",
    });
    await ctx.db.delete(draft._id);
    return { orderId, created: true };
  },
});

export const discard = internalMutation({
  args: { draftId: v.id("checkoutDrafts") }, returns: v.null(),
  handler: async (ctx, args) => { await ctx.db.delete(args.draftId); return null; },
});
