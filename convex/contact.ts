import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";

export const listInquiries = query({
    args: { adminSessionToken: v.string() },
    handler: async (ctx, args) => {
        await requireAdminSession(ctx, args.adminSessionToken);
        return await ctx.db.query("contactInquiries").order("desc").collect();
    },
});

export const submitInquiry = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        subject: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("contactInquiries", {
            ...args,
            status: "New",
            createdAt: new Date().toISOString(),
        });
    },
});

export const updateStatus = mutation({
    args: { adminSessionToken: v.string(), id: v.id("contactInquiries"), status: v.string() },
    handler: async (ctx, args) => {
        await requireAdminSession(ctx, args.adminSessionToken);
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const removeInquiry = mutation({
    args: { adminSessionToken: v.string(), id: v.id("contactInquiries") },
    handler: async (ctx, args) => {
        await requireAdminSession(ctx, args.adminSessionToken);
        await ctx.db.delete(args.id);
    },
});
