import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function hashAdminSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function requireAdminSession(
  ctx: MutationCtx | QueryCtx,
  sessionToken: string,
) {
  const tokenHash = await hashAdminSessionToken(sessionToken);
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.expiresAt <= Date.now()) {
    throw new Error("Admin session expired");
  }

  return session;
}
