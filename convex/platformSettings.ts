import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";
import { validateBillingSettings } from "./lib/billing";

export const get = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("platformSettings"), _creationTime: v.number(),
    proPlanPrice: v.number(), proPlanPriceId: v.optional(v.string()), transactionFee: v.number(),
    platformName: v.string(), logoUrl: v.union(v.string(), v.null()),
  })),
  handler: async (ctx) => {
    const settings = await ctx.db.query("platformSettings").first();
    if (!settings) return null;
    return {
      ...settings,
      logoUrl: settings.logoUrl ? await ctx.storage.getUrl(settings.logoUrl) : null,
    };
  },
});

export const update = mutation({
  args: {
    adminSessionToken: v.string(),
    proPlanPrice: v.optional(v.number()),
    proPlanPriceId: v.optional(v.string()),
    platformName: v.string(),
    logoUrl: v.optional(v.string()), // storage ID
    transactionFee: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const { adminSessionToken, ...updates } = args;

    const existing = await ctx.db.query("platformSettings").first();
    validateBillingSettings(updates.proPlanPrice ?? existing?.proPlanPrice ?? 0, updates.transactionFee ?? existing?.transactionFee ?? 10);
    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("platformSettings", {
        proPlanPrice: updates.proPlanPrice ?? 0,
        proPlanPriceId: updates.proPlanPriceId,
        platformName: updates.platformName,
        logoUrl: updates.logoUrl,
        transactionFee: updates.transactionFee ?? 10,
      });
    }
    return null;
  },
});
