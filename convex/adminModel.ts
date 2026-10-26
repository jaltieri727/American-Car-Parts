import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const credentialValidator = v.object({
  _id: v.id("adminCredentials"),
  username: v.string(),
  passwordHash: v.string(),
  salt: v.string(),
  iterations: v.number(),
  failedAttempts: v.optional(v.number()),
  lockedUntil: v.optional(v.number()),
});

export const getCredentialByUsername = internalQuery({
  args: { username: v.string() },
  returns: v.union(credentialValidator, v.null()),
  handler: async (ctx, args) => {
    const credential = await ctx.db
      .query("adminCredentials")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (!credential) return null;
    return {
      _id: credential._id,
      username: credential.username,
      passwordHash: credential.passwordHash,
      salt: credential.salt,
      iterations: credential.iterations,
      failedAttempts: credential.failedAttempts,
      lockedUntil: credential.lockedUntil,
    };
  },
});

export const getCredentialBySessionHash = internalQuery({
  args: { tokenHash: v.string() },
  returns: v.union(credentialValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!session || session.expiresAt <= Date.now()) return null;
    const credential = await ctx.db.get(session.credentialId);
    if (!credential) return null;
    return {
      _id: credential._id,
      username: credential.username,
      passwordHash: credential.passwordHash,
      salt: credential.salt,
      iterations: credential.iterations,
      failedAttempts: credential.failedAttempts,
      lockedUntil: credential.lockedUntil,
    };
  },
});

export const bootstrapCredential = internalMutation({
  args: {
    username: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    iterations: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminCredentials").first();
    if (existing) return false;
    await ctx.db.insert("adminCredentials", { ...args, updatedAt: Date.now() });
    return true;
  },
});

export const createSession = internalMutation({
  args: {
    credentialId: v.id("adminCredentials"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", args.credentialId))
      .collect();
    for (const session of existingSessions) await ctx.db.delete(session._id);
    await ctx.db.insert("adminSessions", { ...args, createdAt: Date.now() });
    return null;
  },
});

export const recordLoginFailure = internalMutation({
  args: { credentialId: v.id("adminCredentials") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credential = await ctx.db.get(args.credentialId);
    if (!credential) return null;
    const failedAttempts = (credential.failedAttempts ?? 0) + 1;
    await ctx.db.patch(args.credentialId, {
      failedAttempts: failedAttempts >= 5 ? 0 : failedAttempts,
      lockedUntil: failedAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : undefined,
    });
    return null;
  },
});

export const clearLoginFailures = internalMutation({
  args: { credentialId: v.id("adminCredentials") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.credentialId, { failedAttempts: 0, lockedUntil: undefined });
    return null;
  },
});

export const rotateCredential = internalMutation({
  args: {
    credentialId: v.id("adminCredentials"),
    username: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    iterations: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { credentialId, ...updates } = args;
    const duplicate = await ctx.db
      .query("adminCredentials")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (duplicate && duplicate._id !== credentialId) throw new Error("Username already exists");
    await ctx.db.patch(credentialId, { ...updates, updatedAt: Date.now() });
    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", credentialId))
      .collect();
    for (const session of sessions) await ctx.db.delete(session._id);
    return null;
  },
});

export const deleteSessionByTokenHash = internalMutation({
  args: { tokenHash: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});
