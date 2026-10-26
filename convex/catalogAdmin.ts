import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdminSession } from "./lib/adminAuth";

export const list = query({
  args: { adminSessionToken: v.string() },
  returns: v.object({
    stores: v.array(v.object({ id: v.id("providers"), name: v.string(), clerkId: v.string(), demo: v.boolean(), listingCount: v.number() })),
    products: v.array(v.object({ id: v.id("products"), name: v.string(), store: v.string(), price: v.number() })),
  }),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const stores = await ctx.db.query("providers").take(1000);
    const products = await ctx.db.query("products").take(5000);
    return {
      stores: stores.map(s => ({ id: s._id, name: s.storeName, clerkId: s.clerkId, demo: /^seed_provider_\d+$/.test(s.clerkId), listingCount: products.filter(p => p.providerId === s.clerkId).length })),
      products: products.map(p => ({ id: p._id, name: p.name, store: p.providerName, price: p.price })),
    };
  },
});

export const publishStoreCatalog = mutation({
  args: {
    adminSessionToken: v.string(),
    storeId: v.id("providers"),
    listings: v.array(v.object({
      name: v.string(), category: v.string(), description: v.string(),
      price: v.number(), condition: v.string(), imageUrl: v.string(),
      partNumber: v.string(), vinCompatibility: v.string(),
    })),
  },
  returns: v.array(v.id("products")),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const store = await ctx.db.get(args.storeId);
    if (!store || !store.isPublished || !store.stripeConnected || !store.stripeAccountId) throw new Error("Storefront must be published with Stripe payouts connected.");
    if (!args.listings.length || args.listings.length > 12) throw new Error("Publish between one and twelve listings at a time.");
    const existing = await ctx.db.query("products").withIndex("by_providerId", q => q.eq("providerId", store.clerkId)).collect();
    if (existing.length) throw new Error("This store already has catalog listings; edit those instead of publishing duplicates.");
    const seen = new Set<string>();
    for (const listing of args.listings) {
      if (!listing.name.trim() || listing.name.length > 120 || !listing.category.trim() || !listing.description.trim() || listing.description.length > 800 || !listing.vinCompatibility.trim()) throw new Error("Complete each listing's name, category, description, and vehicle compatibility.");
      if (!Number.isFinite(listing.price) || listing.price <= 0 || listing.price > 100000) throw new Error("Enter a valid listing price.");
      if (!["New", "Used", "Restored", "For parts"].includes(listing.condition)) throw new Error("Select a valid listing condition.");
      if (!/^https:\/\/images\.unsplash\.com\/photo-[\w-]+(?:\?.*)?$/.test(listing.imageUrl)) throw new Error("Use a licensed Unsplash photo URL.");
      if (!listing.partNumber.trim() || seen.has(listing.partNumber)) throw new Error("Each listing needs a unique part reference.");
      seen.add(listing.partNumber);
    }
    const ids: Id<"products">[] = [];
    for (const listing of args.listings) {
      const name = listing.name.trim();
      const description = listing.description.trim();
      const partNumber = listing.partNumber.trim();
      const vinCompatibility = listing.vinCompatibility.trim();
      ids.push(await ctx.db.insert("products", {
        name, category: listing.category.trim(), description,
        price: listing.price, condition: listing.condition, images: [listing.imageUrl], imageIsIllustrative: true,
        inStock: true, isNew: listing.condition === "New", rating: 0, reviewsCount: 0,
        providerId: store.clerkId, providerName: store.storeName, providerSlug: store.storeSlug,
        partNumber, vinCompatibility,
        searchContent: [name, description, partNumber, vinCompatibility].join(" ").toLowerCase(),
      }));
    }
    await ctx.db.patch(store._id, { showcaseItems: [] });
    return ids;
  },
});

async function deleteListing(ctx: MutationCtx, id: Id<"products">) {
  const reviews = await ctx.db.query("reviews").withIndex("by_productId", q => q.eq("productId", id)).take(5001);
  if (reviews.length > 5000) throw new Error("Too many reviews for one deletion. Contact support.");
  for (const review of reviews) await ctx.db.delete(review._id);
  // Keep file storage: order snapshots and the production backup may reference these files.
  await ctx.db.delete(id);
}

export const deleteProduct = mutation({
  args: { adminSessionToken: v.string(), id: v.id("products") }, returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const product = await ctx.db.get(args.id);
    if (product) await deleteListing(ctx, args.id);
    return null;
  },
});

export const deleteStore = mutation({
  args: { adminSessionToken: v.string(), id: v.id("providers"), confirmName: v.string() },
  returns: v.object({ deletedListings: v.number() }),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const store = await ctx.db.get(args.id);
    if (!store) throw new Error("Store not found.");
    if (args.confirmName !== store.storeName) throw new Error("Store name confirmation does not match.");
    const orders = await ctx.db.query("orders").withIndex("by_providerId", q => q.eq("providerId", store.clerkId)).take(1001);
    if (orders.length > 1000 || orders.some(o => !["Delivered", "Cancelled"].includes(o.status))) throw new Error("Resolve this store's open orders before deleting it.");
    const user = await ctx.db.get(store.userId);
    if (user?.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(user.subscriptionStatus ?? "")) throw new Error("Cancel the seller subscription before deleting this store.");
    const products = await ctx.db.query("products").withIndex("by_providerId", q => q.eq("providerId", store.clerkId)).take(501);
    if (products.length > 500) throw new Error("Delete some listings first; at most 500 can be removed with a store.");
    for (const product of products) await deleteListing(ctx, product._id);
    await ctx.db.delete(store._id);
    // Preserve the person's login, order history, and their external Stripe account.
    return { deletedListings: products.length };
  },
});
