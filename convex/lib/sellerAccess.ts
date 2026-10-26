import type { MutationCtx } from "../_generated/server";
import { hasSellerAccess } from "./billing";

export async function requireSellerAccess(ctx: MutationCtx, clerkId: string) {
  const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", clerkId)).unique();
  if (!user || !["provider", "admin"].includes(user.role ?? "")) throw new Error("A seller account is required.");
  const settings = await ctx.db.query("platformSettings").first();
  if (!settings || !hasSellerAccess(settings.proPlanPrice, user)) throw new Error("An active seller subscription is required.");
}
