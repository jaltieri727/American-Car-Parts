import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";

const specialty = v.object({ name: v.string(), years: v.string(), imageUrl: v.string(), photoPageUrl: v.optional(v.string()) });
const showcaseItem = v.object({ title: v.string(), vehicle: v.string(), years: v.string(), category: v.string(), description: v.string(), priceNote: v.optional(v.string()), conditionNote: v.optional(v.string()), imageUrl: v.string(), photoPageUrl: v.optional(v.string()) });
const unsplashImageUrl = /^https:\/\/images\.unsplash\.com\/photo-[\w-]+(?:\?.*)?$/;
const unsplashPageUrl = /^https:\/\/unsplash\.com\/photos\/[\w-]+$/;

function validateStorefrontProfile(profile: { storeName?: string; bio?: string; coverImageUrl?: string; specialties?: Array<{ name: string; years: string; imageUrl: string; photoPageUrl?: string }>; showcaseItems?: Array<{ title: string; vehicle: string; years: string; category: string; description: string; priceNote?: string; conditionNote?: string; imageUrl: string; photoPageUrl?: string }> }) {
  if (profile.storeName !== undefined && (!profile.storeName.trim() || profile.storeName.trim().length > 100)) throw new Error("Enter a store name under 100 characters.");
  if (profile.bio !== undefined && profile.bio.trim().length > 500) throw new Error("Store specialty must be 500 characters or fewer.");
  if (profile.coverImageUrl && !unsplashImageUrl.test(profile.coverImageUrl)) throw new Error("Use a valid Unsplash cover photo URL.");
  if (profile.specialties) {
    if (profile.specialties.length > 6) throw new Error("Add at most six vehicle specialties.");
    for (const item of profile.specialties) {
      if (!item.name.trim() || item.name.length > 80 || !item.years.trim() || item.years.length > 40) throw new Error("Each specialty needs a model and year range.");
      if (!unsplashImageUrl.test(item.imageUrl)) throw new Error("Use a valid Unsplash specialty photo URL.");
      if (item.photoPageUrl && !unsplashPageUrl.test(item.photoPageUrl)) throw new Error("Use a valid Unsplash photo page URL.");
    }
  }
  if (profile.showcaseItems) {
    if (profile.showcaseItems.length > 8) throw new Error("Add at most eight part requests.");
    for (const item of profile.showcaseItems) {
      if (!item.title.trim() || item.title.length > 100 || !item.vehicle.trim() || item.vehicle.length > 100 || !item.years.trim() || item.years.length > 40 || !item.category.trim() || item.category.length > 80 || !item.description.trim() || item.description.length > 240) throw new Error("Each part request needs a short title, vehicle, year range, category, and description.");
      if ((item.priceNote?.length ?? 0) > 60 || (item.conditionNote?.length ?? 0) > 80) throw new Error("Part price and condition notes are too long.");
      if (!unsplashImageUrl.test(item.imageUrl)) throw new Error("Use a valid Unsplash part photo URL.");
      if (item.photoPageUrl && !unsplashPageUrl.test(item.photoPageUrl)) throw new Error("Use a valid Unsplash photo page URL.");
    }
  }
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_storeSlug", (q) => q.eq("storeSlug", args.slug))
      .unique();
    if (!provider) return null;
    const user = await ctx.db.get(provider.userId);

    return {
      ...provider,
      email: user?.email,
      logoUrl: provider.logoUrl ? await ctx.storage.getUrl(provider.logoUrl) : null,
    };
  },
});

export const updateProvider = mutation({
  args: {
    storeName: v.optional(v.string()),
    storeSlug: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    logoUrl: v.optional(v.string()), // Storage ID
    bio: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    specialties: v.optional(v.array(specialty)),
    showcaseItems: v.optional(v.array(showcaseItem)),
    location: v.optional(v.string()),
    joinedAt: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");
    validateStorefrontProfile(args);

    for (const [field, max] of [["address", 200], ["phone", 30], ["ownerName", 100], ["contactEmail", 254]] as const) {
      if (args[field] && args[field].trim().length > max) throw new Error(`${field} is too long`);
    }
    if (args.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.contactEmail.trim())) {
      throw new Error("Enter a valid storefront contact email.");
    }
    const contact = {
      ...(args.address !== undefined ? { address: args.address.trim() } : {}),
      ...(args.phone !== undefined ? { phone: args.phone.trim() } : {}),
      ...(args.ownerName !== undefined ? { ownerName: args.ownerName.trim() } : {}),
      ...(args.contactEmail !== undefined ? { contactEmail: args.contactEmail.trim() } : {}),
    };

    if (args.storeSlug) {
      const existing = await ctx.db
        .query("providers")
        .withIndex("by_storeSlug", (q) => q.eq("storeSlug", args.storeSlug!))
        .unique();
      if (existing && existing.clerkId !== identity.subject) {
        throw new Error("Slug already taken. Please choose another one.");
      }
    }

    const provider = await ctx.db
      .query("providers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (provider) {
      await ctx.db.patch(provider._id, { ...args, ...contact });

      // Denormalization update: propagate store changes to all products
      if (args.storeName || args.storeSlug) {
        const products = await ctx.db
          .query("products")
          .withIndex("by_providerId", (q) => q.eq("providerId", identity.subject))
          .collect();

        for (const product of products) {
          await ctx.db.patch(product._id, {
            providerName: args.storeName ?? product.providerName,
            providerSlug: args.storeSlug ?? product.providerSlug,
          });
        }
      }
    } else {
      await ctx.db.insert("providers", {
        userId: user._id,
        clerkId: identity.subject,
        storeName: args.storeName || "New Garage",
        storeSlug: args.storeSlug || `garage-${Date.now()}`,
        stripeConnected: false,
        isPublished: args.isPublished || false,
        logoUrl: args.logoUrl,
        bio: args.bio?.trim(),
        coverImageUrl: args.coverImageUrl,
        specialties: args.specialties,
        showcaseItems: args.showcaseItems,
        location: args.location || "USA",
        joinedAt: args.joinedAt || new Date().getFullYear().toString(),
        ...contact,
      });
    }
  },
});

export const internalUpdateStripeStatus = internalMutation({
  args: {
    clerkId: v.string(),
    stripeAccountId: v.string(),
    stripeConnected: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Find the provider record
    let provider = await ctx.db
      .query("providers")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // 2. If no provider record exists, we MUST create one linked to the user
    if (!provider) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();

      if (!user) {
        console.error(`User protocol error: ClerkId ${args.clerkId} not found during Stripe sync.`);
        return;
      }

      const newId = await ctx.db.insert("providers", {
        userId: user._id,
        clerkId: args.clerkId,
        storeName: user.name + "'s Garage",
        storeSlug: user.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
        stripeConnected: args.stripeConnected,
        stripeAccountId: args.stripeAccountId,
        isPublished: false,
      });
      provider = await ctx.db.get(newId);
    } else {
      // 3. Update existing record
      await ctx.db.patch(provider._id, {
        stripeAccountId: args.stripeAccountId,
        stripeConnected: args.stripeConnected
      });
    }
  },
});

export const internalGetStripeIdByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return provider?.stripeAccountId || null;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    return Promise.all(providers.map(async (p) => ({
      ...p,
      logoUrl: p.logoUrl ? await ctx.storage.getUrl(p.logoUrl) : null,
      listingCount: (await ctx.db.query("products").withIndex("by_providerSlug", q => q.eq("providerSlug", p.storeSlug)).collect()).length,
    })));
  },
});

export const configureStorefrontAsAdmin = mutation({
  args: {
    adminSessionToken: v.string(),
    id: v.id("providers"),
    storeName: v.string(),
    bio: v.string(),
    coverImageUrl: v.string(),
    specialties: v.array(specialty),
    showcaseItems: v.optional(v.array(showcaseItem)),
    location: v.string(),
    address: v.string(),
    ownerName: v.string(),
    contactEmail: v.string(),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const provider = await ctx.db.get(args.id);
    if (!provider) throw new Error("Storefront not found.");
    validateStorefrontProfile(args);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.contactEmail.trim())) throw new Error("Enter a valid storefront contact email.");
    if (args.address.length > 200 || args.ownerName.length > 100 || args.location.length > 100) throw new Error("Storefront contact details are too long.");
    if (args.isPublished && !provider.stripeConnected) throw new Error("Connect Stripe before publishing the storefront.");
    const { adminSessionToken, id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      storeName: args.storeName.trim(),
      bio: args.bio.trim(),
      address: args.address.trim(),
      ownerName: args.ownerName.trim(),
      contactEmail: args.contactEmail.trim(),
      location: args.location.trim(),
    });
    const products = await ctx.db.query("products").withIndex("by_providerId", q => q.eq("providerId", provider.clerkId)).collect();
    for (const product of products) await ctx.db.patch(product._id, { providerName: args.storeName.trim() });
    return null;
  },
});
