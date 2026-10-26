import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_placeholder";

export const sendTransactionalEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    if (!RESEND_API_KEY || RESEND_API_KEY === "re_placeholder") {
      console.warn("Email delivery is not configured; no email was sent.");
      return { success: false, error: "Email delivery is not configured" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "CrankOver <notifications@crankover.com>",
          to: args.to,
          subject: args.subject,
          html: args.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API Error: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return { success: false, error: String(error) };
    }
  },
});
