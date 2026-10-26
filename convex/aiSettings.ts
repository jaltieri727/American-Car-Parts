import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdminSession } from "./lib/adminAuth";

async function encryptionKey() {
  const value = process.env.AI_SETTINGS_ENCRYPTION_KEY;
  if (!value) throw new ConvexError("API-key storage is not configured. Contact support.");
  return crypto.subtle.importKey("raw", Uint8Array.from(atob(value), c => c.charCodeAt(0)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0));

export const status = query({
  args: { adminSessionToken: v.string() },
  returns: v.object({ configured: v.boolean(), source: v.string(), updatedAt: v.union(v.number(), v.null()) }),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const row = await ctx.db.query("aiSecrets").first();
    return { configured: Boolean(row || process.env.GEMINI_API_KEY), source: row ? "Admin key" : process.env.GEMINI_API_KEY ? "Server key" : "Not configured", updatedAt: row?.updatedAt ?? null };
  },
});

export const authorize = internalQuery({
  args: { adminSessionToken: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await requireAdminSession(ctx, args.adminSessionToken); return null; },
});

export const getKey = internalQuery({
  args: {}, returns: v.union(v.string(), v.null()),
  handler: async ctx => {
    const row = await ctx.db.query("aiSecrets").first();
    if (!row) return process.env.GEMINI_API_KEY ?? null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(row.iv) }, await encryptionKey(), decode(row.ciphertext));
    return new TextDecoder().decode(plain);
  },
});

export const store = internalMutation({
  args: { adminSessionToken: v.string(), apiKey: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.adminSessionToken);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(args.apiKey));
    const value = { ciphertext: encode(new Uint8Array(ciphertext)), iv: encode(iv), updatedAt: Date.now() };
    const row = await ctx.db.query("aiSecrets").first();
    if (row) await ctx.db.patch(row._id, value); else await ctx.db.insert("aiSecrets", value);
    return null;
  },
});

export const save = action({
  args: { adminSessionToken: v.string(), apiKey: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.aiSettings.authorize, { adminSessionToken: args.adminSessionToken });
    const apiKey = args.apiKey.trim();
    if (!/^AIza[\w-]{25,100}$/.test(apiKey)) throw new ConvexError("Enter a valid Gemini API key.");
    const models = (process.env.GEMINI_MODELS ?? "gemini-3.1-flash-lite,gemini-3.5-flash-lite").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);
    let valid = false;
    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Reply OK." }] }], generationConfig: { maxOutputTokens: 20 } }), signal: AbortSignal.timeout(12000),
        });
        if (response.ok && (await response.json()).candidates?.length) { valid = true; break; }
      } catch { /* Keep the existing key if validation fails. Never log secrets. */ }
    }
    if (!valid) throw new ConvexError("Couldn't verify this key. Check its API access and quota, then try again. Your existing key is unchanged.");
    await ctx.runMutation(internal.aiSettings.store, { adminSessionToken: args.adminSessionToken, apiKey });
    return null;
  },
});
