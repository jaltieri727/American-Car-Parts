import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  aiSecrets: defineTable({ ciphertext: v.string(), iv: v.string(), updatedAt: v.number() }),
  aiLimits: defineTable({ key: v.string(), minute: v.number(), count: v.number() }).index("by_key", ["key"]),
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("consumer"), v.literal("provider"), v.literal("admin"), v.null()),
    avatar: v.optional(v.string()),
    hasPaid: v.boolean(), // Legacy stored flag; current access is derived from settings + subscription state.
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionCurrentPeriodEnd: v.optional(v.number()),
    subscriptionCancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  providers: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    storeName: v.string(),
    storeSlug: v.string(),
    stripeConnected: v.boolean(),
    stripeAccountId: v.optional(v.string()),
    isPublished: v.boolean(),
    logoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    specialties: v.optional(v.array(v.object({
      name: v.string(),
      years: v.string(),
      imageUrl: v.string(),
      photoPageUrl: v.optional(v.string()),
    }))),
    showcaseItems: v.optional(v.array(v.object({
      title: v.string(),
      vehicle: v.string(),
      years: v.string(),
      category: v.string(),
      description: v.string(),
      priceNote: v.optional(v.string()),
      conditionNote: v.optional(v.string()),
      imageUrl: v.string(),
      photoPageUrl: v.optional(v.string()),
    }))),
    location: v.optional(v.string()),
    joinedAt: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_clerkId", ["clerkId"])
    .index("by_storeSlug", ["storeSlug"])
    .index("by_stripeAccountId", ["stripeAccountId"]),

  products: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    condition: v.optional(v.string()),
    oldPrice: v.optional(v.number()),
    rating: v.number(),
    reviewsCount: v.number(), // Total number of reviews
    images: v.array(v.string()), // Storage IDs or URLs
    imageIsIllustrative: v.optional(v.boolean()),
    isNew: v.optional(v.boolean()),
    discount: v.optional(v.number()),
    inStock: v.boolean(),
    providerId: v.string(), // Clerk ID
    providerName: v.string(),
    providerSlug: v.string(),
    partNumber: v.optional(v.string()),
    castingNumber: v.optional(v.string()),
    vinCompatibility: v.optional(v.string()),
    searchContent: v.string(), // Aggregated field for search index
  })
    .index("by_providerId", ["providerId"])
    .index("by_category", ["category"])
    .index("by_providerSlug", ["providerSlug"])
    .searchIndex("search_by_name_partNumber", {
      searchField: "searchContent",
      filterFields: ["category", "providerSlug"],
    }),

  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatar: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.string(),
  }).index("by_productId", ["productId"]),

  posts: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.string(),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    likes: v.number(),
    commentsCount: v.number(),
    createdAt: v.string(),
  }).index("by_authorId", ["authorId"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.string(),
    content: v.string(),
    createdAt: v.string(),
  }).index("by_postId", ["postId"]),

  testimonials: defineTable({
    text: v.string(),
    name: v.string(),
    role: v.string(),
    image: v.string(),
  }),

  blogs: defineTable({
    title: v.string(),
    excerpt: v.string(),
    content: v.optional(v.string()), // Made optional to prevent schema validation errors on existing data
    author: v.string(),
    date: v.string(),
    image: v.string(),
    category: v.string(),
  }),

  platformSettings: defineTable({
    proPlanPrice: v.number(),
    proPlanPriceId: v.optional(v.string()),
    transactionFee: v.number(),
    platformName: v.string(),
    logoUrl: v.optional(v.string()),
  }),

  orders: defineTable({
    amount: v.number(),
    consumerId: v.string(), // Clerk ID
    providerId: v.string(), // Clerk ID or "system"
    items: v.array(
      v.object({
        partId: v.string(), // Product ID
        quantity: v.number(),
        priceAtPurchase: v.number(),
        name: v.string(),
        image: v.optional(v.string()),
      })
    ),
    shippingDetails: v.optional(v.any()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    transactionFeePercent: v.optional(v.number()),
    platformFeeAmount: v.optional(v.number()),
    sellerAmount: v.optional(v.number()),
    date: v.string(),
    status: v.string(), // Processing, Shipped, Delivered, Cancelled
  })
    .index("by_consumerId", ["consumerId"])
    .index("by_providerId", ["providerId"])
    .index("by_stripeSessionId", ["stripeSessionId"]),

  // Server-priced checkout snapshots avoid Stripe's 500-character metadata limit.
  checkoutDrafts: defineTable({
    consumerId: v.string(),
    providerId: v.string(),
    stripeAccountId: v.string(),
    totalCents: v.number(),
    transactionFeePercent: v.number(),
    items: v.array(v.object({
      partId: v.string(), quantity: v.number(), priceAtPurchase: v.number(),
      name: v.string(), image: v.optional(v.string()),
    })),
  }),

  newsletter: defineTable({
    email: v.string(),
    subscribedAt: v.string(),
  }).index("by_email", ["email"]),

  contactInquiries: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.string(), // New, Read, Replied
    createdAt: v.string(),
  }),

  adminCredentials: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    iterations: v.number(),
    failedAttempts: v.optional(v.number()),
    lockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_username", ["username"]),

  adminSessions: defineTable({
    credentialId: v.id("adminCredentials"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_credentialId", ["credentialId"]),
});
