"use node";

import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const ITERATIONS = 210_000;
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const hashPassword = (password: string, salt: string, iterations: number) =>
  pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64");
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const verifyPassword = (password: string, expectedHash: string, salt: string, iterations: number) => {
  const actual = Buffer.from(hashPassword(password, salt, iterations), "base64");
  const expected = Buffer.from(expectedHash, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const bootstrap = action({
  args: { bootstrapSecret: v.string(), username: v.string(), password: v.string() },
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx, args): Promise<{ created: boolean }> => {
    if (!process.env.ADMIN_BOOTSTRAP_SECRET || args.bootstrapSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      throw new Error("Invalid bootstrap secret");
    }
    const username = normalizeUsername(args.username);
    if (username.length < 3 || args.password.length < 8) throw new Error("Credential is too short");
    const salt = randomBytes(24).toString("base64");
    const created: boolean = await ctx.runMutation(internal.adminModel.bootstrapCredential, {
      username,
      salt,
      iterations: ITERATIONS,
      passwordHash: hashPassword(args.password, salt, ITERATIONS),
    });
    return { created };
  },
});

export const login = action({
  args: { username: v.string(), password: v.string() },
  returns: v.object({ sessionToken: v.string(), username: v.string() }),
  handler: async (ctx, args): Promise<{ sessionToken: string; username: string }> => {
    const username = normalizeUsername(args.username);
    const credential = await ctx.runQuery(internal.adminModel.getCredentialByUsername, { username });
    if (credential?.lockedUntil && credential.lockedUntil > Date.now()) {
      throw new Error("Admin login is temporarily locked. Try again later.");
    }
    if (!credential || !verifyPassword(args.password, credential.passwordHash, credential.salt, credential.iterations)) {
      if (credential) {
        await ctx.runMutation(internal.adminModel.recordLoginFailure, { credentialId: credential._id });
      }
      throw new Error("Invalid admin credentials");
    }
    await ctx.runMutation(internal.adminModel.clearLoginFailures, { credentialId: credential._id });
    const sessionToken = randomBytes(32).toString("base64url");
    await ctx.runMutation(internal.adminModel.createSession, {
      credentialId: credential._id,
      tokenHash: hashToken(sessionToken),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return { sessionToken, username: credential.username };
  },
});

export const validateSession = action({
  args: { sessionToken: v.string() },
  returns: v.union(v.object({ username: v.string() }), v.null()),
  handler: async (ctx, args): Promise<{ username: string } | null> => {
    const credential = await ctx.runQuery(internal.adminModel.getCredentialBySessionHash, {
      tokenHash: hashToken(args.sessionToken),
    });
    return credential ? { username: credential.username } : null;
  },
});

export const logout = action({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runMutation(internal.adminModel.deleteSessionByTokenHash, {
      tokenHash: hashToken(args.sessionToken),
    });
    return null;
  },
});

export const changeCredentials = action({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newUsername: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const credential = await ctx.runQuery(internal.adminModel.getCredentialBySessionHash, {
      tokenHash: hashToken(args.sessionToken),
    });
    if (!credential || !verifyPassword(args.currentPassword, credential.passwordHash, credential.salt, credential.iterations)) {
      throw new Error("Current password is incorrect");
    }
    const username = normalizeUsername(args.newUsername);
    if (username.length < 3 || args.newPassword.length < 8) throw new Error("New credential is too short");
    const salt = randomBytes(24).toString("base64");
    await ctx.runMutation(internal.adminModel.rotateCredential, {
      credentialId: credential._id,
      username,
      salt,
      iterations: ITERATIONS,
      passwordHash: hashPassword(args.newPassword, salt, ITERATIONS),
    });
    return null;
  },
});
