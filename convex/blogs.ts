import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";

export const list = query({
  handler: async (ctx) => {
    const blogs = await ctx.db.query("blogs").order("desc").collect();
    return Promise.all(blogs.map(async (b) => ({
      ...b,
      image: (b.image && !b.image.startsWith('http'))
        ? (await ctx.storage.getUrl(b.image)) || b.image
        : b.image
    })));
  },
});

export const create = mutation({
  args: {
    adminSessionToken: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    author: v.string(),
    image: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const { adminSessionToken, ...blog } = args;
    return await ctx.db.insert("blogs", {
      ...blog,
      date: new Date().toLocaleDateString(),
    });
  },
});

export const remove = mutation({
  args: { adminSessionToken: v.string(), id: v.id("blogs") },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    adminSessionToken: v.string(),
    id: v.id("blogs"),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    category: v.string(),
    image: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const { adminSessionToken, id, ...data } = args;
    await ctx.db.patch(id, data);
  }
});
