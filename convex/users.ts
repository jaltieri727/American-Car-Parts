import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";
import { hasSellerAccess } from "./lib/billing";

export const getMe = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("users"), _creationTime: v.number(), userId: v.id("users"),
    clerkId: v.string(), name: v.string(), email: v.string(),
    role: v.union(v.literal("consumer"), v.literal("provider"), v.literal("admin"), v.null()),
    avatar: v.optional(v.string()), hasPaid: v.boolean(),
    stripeSubscriptionId: v.optional(v.string()), subscriptionStatus: v.optional(v.string()),
    subscriptionCurrentPeriodEnd: v.optional(v.number()), subscriptionCancelAtPeriodEnd: v.optional(v.boolean()),
    storeName: v.optional(v.string()), storeSlug: v.optional(v.string()), stripeConnected: v.optional(v.boolean()),
    stripeAccountId: v.optional(v.string()), isPublished: v.optional(v.boolean()),
    logoUrl: v.union(v.string(), v.null()), bio: v.optional(v.string()), coverImageUrl: v.optional(v.string()),
    specialties: v.optional(v.array(v.object({ name: v.string(), years: v.string(), imageUrl: v.string(), photoPageUrl: v.optional(v.string()) }))),
    location: v.optional(v.string()), joinedAt: v.optional(v.string()),
    address: v.optional(v.string()), phone: v.optional(v.string()), ownerName: v.optional(v.string()), contactEmail: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const provider = await ctx.db
      .query("providers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const { _id, userId: pUserId, ...providerData } = provider || {};
    const settings = await ctx.db.query("platformSettings").first();
    return {
      ...user,
      ...providerData,
      // Free access is determined by today's setting, not a lifetime paid flag.
      hasPaid: settings ? hasSellerAccess(settings.proPlanPrice, user) : false,
      logoUrl: provider?.logoUrl ? await ctx.storage.getUrl(provider.logoUrl) : null,
      userId: user._id
    };
  },
});

export const getEmailByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user?.email || null;
  },
});

export const syncUser = mutation({
  args: { name: v.string(), email: v.string(), avatar: v.optional(v.string()) },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const verifiedEmail = identity.email ?? args.email;
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isAdmin = Boolean(adminEmail && identity.email?.toLowerCase() === adminEmail);

    if (!existing && isAdmin) {
      const legacyAdmin = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", verifiedEmail))
        .unique();
      if (legacyAdmin) {
        await ctx.db.patch(legacyAdmin._id, {
          clerkId: identity.subject,
          role: "admin",
          avatar: args.avatar,
        });
        const provider = await ctx.db
          .query("providers")
          .withIndex("by_userId", (q) => q.eq("userId", legacyAdmin._id))
          .unique();
        if (provider) {
          await ctx.db.patch(provider._id, {
            clerkId: identity.subject,
            stripeConnected: false,
          });
        }
        return legacyAdmin._id;
      }
    }

    if (!existing) {

      return await ctx.db.insert("users", {
        clerkId: identity.subject,
        name: args.name,
        email: verifiedEmail,
        avatar: args.avatar,
        role: isAdmin ? "admin" : null,
        hasPaid: false,
      });
    } else {
      await ctx.db.patch(existing._id, { avatar: args.avatar, ...(isAdmin ? { role: "admin" as const } : {}) });
    }
    return existing._id;
  },
});

export const updateUser = mutation({
  args: {
    role: v.union(v.literal("consumer"), v.literal("provider")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    return await ctx.db.patch(user._id, { role: args.role });
  },
});

export const activateFreePlan = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const settings = await ctx.db.query("platformSettings").first();
    if (!settings || settings.proPlanPrice !== 0) throw new Error("A paid subscription is required");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { hasPaid: true });
  },
});

export const editUser = mutation({
  args: {
    adminSessionToken: v.string(),
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("consumer"), v.literal("provider"), v.literal("admin"), v.null())),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const { adminSessionToken, id, ...updates } = args;
    const userToEdit = await ctx.db.get(id);
    if (!userToEdit) throw new Error("User not found");

    await ctx.db.patch(id, updates);
  },
});

export const listAllUsers = query({
  args: { adminSessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const users = await ctx.db.query("users").collect();
    return Promise.all(users.map(async u => {
      const provider = await ctx.db
        .query("providers")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .unique();
      if (!provider) return { ...u, isPublished: false, storeSlug: null };
      const { _id, userId, ...providerData } = provider;
      return { ...u, ...providerData, storeSlug: provider.storeSlug };
    }));
  }
});

export const deleteUser = mutation({
  args: { adminSessionToken: v.string(), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const user = await ctx.db.get(args.id);
    if (!user) return;

    // Delete associated products and their storage
    const products = await ctx.db
      .query("products")
      .withIndex("by_providerId", (q) => q.eq("providerId", user.clerkId))
      .collect();

    for (const product of products) {
      if (product.images) {
        for (const img of product.images) {
          if (!img.startsWith("http")) {
            await ctx.storage.delete(img);
          }
        }
      }
      await ctx.db.delete(product._id);
    }

    // Delete provider record
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_userId", (q) => q.eq("userId", args.id))
      .unique();
    if (provider) await ctx.db.delete(provider._id);

    // Delete user
    await ctx.db.delete(args.id);
  }
});
