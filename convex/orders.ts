import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, action } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const getById = internalQuery({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    return { ...order, id: order._id };
  },
});

export const updateStatusAndNotify = action({
  args: { orderId: v.id("orders"), status: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const order = await ctx.runQuery(internal.orders.getById, { id: args.orderId });
    if (!order) return;

    const user = await ctx.runQuery(api.users.getMe);
    if (order.providerId !== identity.subject && user?.role !== "admin") {
      throw new Error("Unauthorized: Access denied for order status modification.");
    }

    await ctx.runMutation(internal.orders.internalUpdateOrderStatus, {
      orderId: args.orderId,
      status: args.status,
    });

    // 3. If shipped, notify the actual consumer
    if (args.status === "Shipped") {
      const consumerEmail = await ctx.runQuery(internal.users.getEmailByClerkId, {
        clerkId: order.consumerId,
      });

      if (consumerEmail) {
        await ctx.runAction(internal.emails.sendTransactionalEmail, {
          to: consumerEmail,
          subject: "Shipping Protocol Initiated",
          html: `<h1>Your parts are on the move!</h1><p>Order #CO-${args.orderId.slice(-6)} has been marked as SHIPPED. Tracking details will be available soon.</p>`,
        });
      }
    }
  },
});

export const createOrder = mutation({
  args: {
    amount: v.number(),
    providerId: v.string(),
    items: v.array(
      v.object({
        partId: v.string(),
        quantity: v.number(),
        priceAtPurchase: v.number(),
        name: v.string(),
        image: v.optional(v.string()),
      })
    ),
    shippingDetails: v.optional(v.any()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Server-side validation of the total amount
    let calculatedTotal = 0;
    for (const item of args.items) {
      const product = await ctx.db.get(item.partId as any);
      if (!product) throw new Error(`Product ${item.partId} not found`);
      if ("price" in product) {
        calculatedTotal += (product as any).price * item.quantity;
      }
    }
    const shipping = args.items.length > 0 ? 25 : 0;
    const finalVerifiedTotal = calculatedTotal + shipping;

    // Tolerance check for floating point if necessary, or strict equality
    if (Math.abs(args.amount - finalVerifiedTotal) > 0.01) {
      throw new Error("Order value integrity check failed. Protocol mismatch.");
    }

    return await ctx.db.insert("orders", {
      ...args,
      consumerId: identity.subject,
      date: new Date().toLocaleDateString(),
      status: "Processing",
    });
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    const isAdmin = user?.role === "admin";
    const isProvider = (order as any).providerId === identity.subject;

    // Authorization: Only the provider who received the order or an admin can update its status
    if (!isProvider && !isAdmin) {
      throw new Error("Unauthorized: Access denied for order status modification.");
    }

    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const internalUpdateOrderStatus = internalMutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const listMyOrders = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let orders;
    if (args.role === "provider") {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_providerId", (q) => q.eq("providerId", identity.subject))
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_consumerId", (q) => q.eq("consumerId", identity.subject))
        .collect();
    }
    return orders.map(o => ({ ...o, id: o._id }));
  },
});

// Internal mutation for secure creation from webhook without user identity
export const internalCreateOrderFromWebhook = internalMutation({
  args: {
    amount: v.number(),
    consumerId: v.string(),
    providerId: v.string(),
    items: v.array(
      v.object({
        partId: v.string(),
        quantity: v.number(),
        priceAtPurchase: v.number(),
        name: v.string(),
        image: v.optional(v.string()),
      })
    ),
    shippingDetails: v.optional(v.any()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if order already exists for this session to avoid duplicates
    if (args.stripeSessionId) {
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId!))
        .unique();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("orders", {
      ...args,
      date: new Date().toLocaleDateString(),
      status: "Processing",
    });
  },
});
