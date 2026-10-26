import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";

export const subscribe = mutation({
    args: { email: v.string() },
    returns: v.object({ success: v.boolean(), message: v.string() }),
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ConvexError("Enter a valid email address.");
        // Check if already subscribed
        const existing = await ctx.db
            .query("newsletter")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) {
            return { success: true, message: "You're on the list for future CrankOver updates." };
        }

        await ctx.db.insert("newsletter", {
            email,
            subscribedAt: new Date().toISOString(),
        });

        return { success: true, message: "You're on the list for future CrankOver updates." };
    },
});

export const listSubscribers = query({
    args: { adminSessionToken: v.string() },
    returns: v.array(v.object({ _id: v.id("newsletter"), _creationTime: v.number(), email: v.string(), subscribedAt: v.string() })),
    handler: async (ctx, args) => {
        await requireAdminSession(ctx, args.adminSessionToken);
        return await ctx.db.query("newsletter").order("desc").take(5000);
    },
});

export const removeSubscriber = mutation({
    args: { adminSessionToken: v.string(), id: v.id("newsletter") }, returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdminSession(ctx, args.adminSessionToken);
        await ctx.db.delete(args.id);
        return null;
    },
});
