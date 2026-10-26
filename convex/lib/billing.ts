import type Stripe from "stripe";

export function hasSellerAccess(monthlyPrice: number, user: { subscriptionStatus?: string; subscriptionCurrentPeriodEnd?: number } | null) {
  return monthlyPrice === 0 || Boolean(user && ["active", "trialing"].includes(user.subscriptionStatus ?? "") && (user.subscriptionCurrentPeriodEnd ?? 0) > Date.now());
}

export function validateBillingSettings(monthlyPrice: number, feePercent: number) {
  for (const [label, value] of [["Monthly price", monthlyPrice], ["Transaction fee", feePercent]] as const) {
    if (!Number.isFinite(value) || value < 0 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      throw new Error(`${label} must be a non-negative number with at most two decimal places.`);
    }
  }
  if (feePercent > 100) throw new Error("Transaction fee cannot exceed 100%.");
  if (monthlyPrice > 0 && monthlyPrice < 0.5) throw new Error("Monthly subscriptions must be at least $0.50, or $0 to disable them.");
  if (monthlyPrice > 999999.99) throw new Error("Monthly price is too large.");
}

export function marketplaceAmounts(totalCents: number, feePercent: number) {
  validateBillingSettings(0, feePercent);
  if (!Number.isSafeInteger(totalCents) || totalCents < 50 || totalCents > 99999999) {
    throw new Error("Order total must be between $0.50 and $999,999.99.");
  }
  const feeCents = Math.round(totalCents * Math.round(feePercent * 100) / 10000);
  return { totalCents, feeCents, sellerCents: totalCents - feeCents };
}

// Destination charges debit Stripe processing fees from the PLATFORM, not the seller.
export function destinationPayment(totalCents: number, feePercent: number, destination: string): Stripe.Checkout.SessionCreateParams.PaymentIntentData {
  if (!destination.startsWith("acct_")) throw new Error("Seller payout account is missing.");
  return {
    application_fee_amount: marketplaceAmounts(totalCents, feePercent).feeCents,
    transfer_data: { destination },
  };
}

export function monthlyLineItem(monthlyPrice: number): Stripe.Checkout.SessionCreateParams.LineItem {
  validateBillingSettings(monthlyPrice, 0);
  if (monthlyPrice === 0) throw new Error("Monthly subscriptions are currently disabled.");
  return {
    price_data: {
      currency: "usd",
      product_data: { name: "CrankOver Pro Storefront" },
      unit_amount: Math.round(monthlyPrice * 100),
      recurring: { interval: "month" },
    },
    quantity: 1,
  };
}
