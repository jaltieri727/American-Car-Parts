import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminSession } from "./lib/adminAuth";
import { requireSellerAccess } from "./lib/sellerAccess";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateAdminUploadUrl = mutation({
  args: { adminSessionToken: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    return await ctx.storage.generateUploadUrl();
  },
});

const resolveImages = async (ctx: any, images: string[]) => {
  return Promise.all(
    (images || []).map(async (imgId) => {
      if (imgId.startsWith("http")) return { url: imgId, storageId: imgId };
      const url = await ctx.storage.getUrl(imgId);
      return { url: url || null, storageId: imgId };
    })
  );
};

const generateSearchContent = (args: {
  name: string;
  description: string;
  partNumber?: string;
  castingNumber?: string;
  vinCompatibility?: string;
}) => {
  return [
    args.name,
    args.description,
    args.partNumber ?? "",
    args.castingNumber ?? "",
    args.vinCompatibility ?? "",
  ]
    .join(" ")
    .toLowerCase();
};

export const list = query({
  args: { category: v.optional(v.string()), providerSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let products;
    if (args.category && args.category !== "All") {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else if (args.providerSlug) {
      products = await ctx.db
        .query("products")
        .withIndex("by_providerSlug", (q) => q.eq("providerSlug", args.providerSlug!))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }

    return Promise.all(
      products.map(async (p) => ({
        ...p,
        id: p._id,
        images: await resolveImages(ctx, p.images),
      }))
    );
  },
});

export const search = query({
  args: { query: v.string(), category: v.optional(v.string()), providerSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.query.trim() === "") {
      const products = args.category && args.category !== 'All'
        ? await ctx.db.query('products').withIndex('by_category', q => q.eq('category', args.category!)).collect()
        : args.providerSlug
          ? await ctx.db.query('products').withIndex('by_providerSlug', q => q.eq('providerSlug', args.providerSlug!)).collect()
          : await ctx.db.query('products').collect();
      return Promise.all(
        products.filter(p => !args.providerSlug || p.providerSlug === args.providerSlug).map(async (p) => ({
          ...p,
          id: p._id,
          images: await resolveImages(ctx, p.images),
        }))
      );
    }

    let q = ctx.db.query("products")
      .withSearchIndex("search_by_name_partNumber", (q) => {
        let search = q.search("searchContent", args.query);
        if (args.category && args.category !== "All") {
          search = search.eq("category", args.category);
        }
        if (args.providerSlug) {
          search = search.eq("providerSlug", args.providerSlug);
        }
        return search;
      });

    const products = await q.collect();
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        id: p._id,
        images: await resolveImages(ctx, p.images),
      }))
    );
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) return null;
    return {
      ...p,
      id: p._id,
      images: await resolveImages(ctx, p.images),
    };
  },
});

export const addProduct = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    condition: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
    images: v.array(v.string()), // Storage IDs
    partNumber: v.optional(v.string()),
    castingNumber: v.optional(v.string()),
    vinCompatibility: v.optional(v.string()),
    providerName: v.string(),
    providerSlug: v.string(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (!args.name.trim() || !args.category.trim() || !args.description.trim()) throw new Error("Complete the part name, category, and description.");
    if (!Number.isFinite(args.price) || args.price <= 0) throw new Error("Enter a price greater than zero.");
    if (!args.images.length) throw new Error("Upload at least one photo of the actual part.");
    if (!['New', 'Used', 'Restored', 'For parts'].includes(args.condition ?? '')) throw new Error("Select the actual condition of the part.");
    if (!args.vinCompatibility?.trim()) throw new Error("Enter confirmed vehicle compatibility, or Universal if applicable.");

    const searchContent = generateSearchContent(args);
    await requireSellerAccess(ctx, identity.subject);

    return await ctx.db.insert("products", {
      ...args,
      providerId: identity.subject,
      rating: 0,
      reviewsCount: 0,
      inStock: args.inStock ?? true,
      isNew: true,
      searchContent,
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    condition: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    partNumber: v.optional(v.string()),
    castingNumber: v.optional(v.string()),
    vinCompatibility: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...updates } = args;
    await requireSellerAccess(ctx, identity.subject);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Product not found");

    // Authorization: Only the owner can update the product
    if (existing.providerId !== identity.subject) {
      throw new Error("Unauthorized: You do not have permission to modify this part.");
    }
    if (updates.price !== undefined && (!Number.isFinite(updates.price) || updates.price <= 0)) throw new Error("Enter a price greater than zero.");
    if (updates.condition !== undefined && !['New', 'Used', 'Restored', 'For parts'].includes(updates.condition)) throw new Error("Select the actual condition of the part.");
    if (updates.images !== undefined && updates.images.length === 0) throw new Error("Keep at least one photo of the actual part.");
    if (updates.vinCompatibility !== undefined && !updates.vinCompatibility.trim()) throw new Error("Enter confirmed vehicle compatibility, or Universal if applicable.");

    const newSearchContent = generateSearchContent({
      name: updates.name ?? existing.name,
      description: updates.description ?? existing.description,
      partNumber: updates.partNumber ?? existing.partNumber,
      castingNumber: updates.castingNumber ?? existing.castingNumber,
      vinCompatibility: updates.vinCompatibility ?? existing.vinCompatibility,
    });

    await ctx.db.patch(id, { ...updates, ...(updates.images ? { imageIsIllustrative: false } : {}), searchContent: newSearchContent });
    return null;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const product = await ctx.db.get(args.id);
    if (!product) return;

    // Authorization: Only the owner can delete the product
    if (product.providerId !== identity.subject) {
      throw new Error("Unauthorized: You do not have permission to delete this part.");
    }

    if (product.images) {
      for (const img of product.images) {
        if (!img.startsWith("http")) {
          await ctx.storage.delete(img);
        }
      }
    }
    await ctx.db.delete(args.id);
  },
});

import { GoogleGenAI } from "@google/genai";
import { action } from "./_generated/server";

export const generateDescription = action({
  args: { contents: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is not configured in the environment.");
    }

    // Initialize GoogleGenAI client (using the v1beta API surface if needed implicitly by the SDK)
    const client = new GoogleGenAI({ apiKey });

    // Use the cheap flash model
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: args.contents,
    });

    // Extract text from the standard Gemini response structure
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text };
  },
});
