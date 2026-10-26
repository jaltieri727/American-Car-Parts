import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { getFunctionName } from 'convex/server';
import { destinationPayment, hasSellerAccess, marketplaceAmounts, monthlyLineItem, validateBillingSettings } from '../convex/lib/billing.ts';

// Use Vite's existing esbuild dependency, without installing a test framework.
const require = createRequire(import.meta.url);
const { build } = require(createRequire(require.resolve('vite')).resolve('esbuild'));
async function loadBackend(entry, mockStripe = false) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: mockStripe ? [{ name: 'stripe-stub', setup(builder) {
      builder.onResolve({ filter: /^stripe$/ }, () => ({ path: 'stripe', namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export default class Stripe { constructor() { return globalThis.billingStripeMock; } }' }));
    } }] : [],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const checkout = await loadBackend('convex/checkout.ts');
const settingsFunctions = await loadBackend('convex/platformSettings.ts');
const stripeFunctions = await loadBackend('convex/stripe.ts', true);
const webhookRouter = (await loadBackend('convex/http.ts', true)).default;

test('live webhook endpoints ignore signed sandbox events before any database operation', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_live_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_mock';
  for (const [path, type] of [['/stripe/webhook', 'checkout.session.completed'], ['/stripe/connect-webhook', 'account.updated']]) {
    globalThis.billingStripeMock = { webhooks: { constructEventAsync: async () => ({ livemode: false, type, data: { object: {} } }) } };
    const ctx = { runMutation: () => { throw new Error('Test event must not modify production'); } };
    const response = await webhookRouter.lookup(path, 'POST')[0]._handler(ctx, new Request(`https://example.com${path}`, { method: 'POST', headers: { 'stripe-signature': 'mock' }, body: '{}' }));
    assert.equal(response.status, 200);
  }
});

test('matching live Connect event still synchronizes seller status', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_live_mock';
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_mock';
  globalThis.billingStripeMock = { webhooks: { constructEventAsync: async () => ({ livemode: true, type: 'account.updated', data: { object: { id: 'acct_live_seller', details_submitted: true, charges_enabled: true, metadata: { clerkId: 'seller' } } } }) } };
  let updated;
  const response = await webhookRouter.lookup('/stripe/connect-webhook', 'POST')[0]._handler({ runMutation: async (_ref, args) => { updated = args; } }, new Request('https://example.com/stripe/connect-webhook', { method: 'POST', headers: { 'stripe-signature': 'mock' }, body: '{}' }));
  assert.equal(response.status, 200);
  assert.deepEqual(updated, { clerkId: 'seller', stripeAccountId: 'acct_live_seller', stripeConnected: true });
});

function fixture() {
  const data = new Map([
    ['settings', { _id: 'settings', proPlanPrice: 0, transactionFee: 10, platformName: 'CrankOver' }],
    ['p1', { _id: 'p1', providerId: 'seller', price: 75, inStock: true, name: 'Part', images: ['https://example.com/part.jpg'] }],
    ['p2', { _id: 'p2', providerId: 'other-seller', price: 10, inStock: true, name: 'Other part', images: [] }],
    ['seller', { _id: 'seller', clerkId: 'seller', stripeConnected: true, stripeAccountId: 'acct_seller' }],
    ['seller-user', { _id: 'seller-user', clerkId: 'seller', role: 'provider' }],
  ]);
  const tables = { platformSettings: ['settings'], providers: ['seller'], users: ['seller-user'], orders: [], checkoutDrafts: [], adminSessions: [] };
  const ctx = { storage: { getUrl: async id => `https://storage.example/${id}` }, db: {
    get: async id => data.get(id) ?? null,
    insert: async (table, doc) => { const id = `${table}-${data.size}`; data.set(id, { ...doc, _id: id }); tables[table].push(id); return id; },
    patch: async (id, updates) => { data.set(id, { ...data.get(id), ...updates }); },
    delete: async id => { data.delete(id); },
    query(table) {
      let predicate = () => true;
      const query = {
        withIndex(_name, fn) { fn({ eq(field, value) { predicate = row => row[field] === value; } }); return query; },
        async first() { return tables[table].map(id => data.get(id)).find(row => row && predicate(row)) ?? null; },
        async unique() { return query.first(); },
      };
      return query;
    },
  } };
  return { ctx, data, tables };
}

test('10% all-in fee: buyer $100, seller $90, platform $10 before processing', () => {
  assert.deepEqual(marketplaceAmounts(10000, 10), { totalCents: 10000, feeCents: 1000, sellerCents: 9000 });
  assert.deepEqual(destinationPayment(10000, 10, 'acct_seller'), { application_fee_amount: 1000, transfer_data: { destination: 'acct_seller' } });
});
test('rounds once to cents and supports future fee changes, including zero', () => {
  assert.equal(marketplaceAmounts(9999, 12.5).feeCents, 1250);
  assert.equal(marketplaceAmounts(10000, 0).sellerCents, 10000);
  assert.equal(marketplaceAmounts(10000, 100).sellerCents, 0);
});
test('rejects negative, non-finite, oversized and over-precision settings', () => {
  for (const fee of [-1, 101, NaN, Infinity, 10.001]) assert.throws(() => validateBillingSettings(0, fee));
  for (const price of [-1, 0.1, 9.999, Infinity, 1000000]) assert.throws(() => validateBillingSettings(price, 10));
  assert.throws(() => marketplaceAmounts(50.5, 10));
});
test('monthly amount alone enables subscriptions; no pre-created Stripe price ID', () => {
  assert.throws(() => monthlyLineItem(0), /disabled/);
  assert.equal(monthlyLineItem(14.95).price_data.unit_amount, 1495);
  assert.equal(monthlyLineItem(14.95).price_data.recurring.interval, 'month');
});
test('turning on subscriptions requires opt-in, not a legacy free/paid flag', () => {
  assert.equal(hasSellerAccess(0, { hasPaid: false }), true);
  assert.equal(hasSellerAccess(10, { hasPaid: true }), false);
  assert.equal(hasSellerAccess(10, { subscriptionStatus: 'active', subscriptionCurrentPeriodEnd: Date.now() + 60000 }), true);
  assert.equal(hasSellerAccess(10, { subscriptionStatus: 'past_due', subscriptionCurrentPeriodEnd: Date.now() + 60000 }), false);
  assert.equal(hasSellerAccess(10, { subscriptionStatus: 'active', subscriptionCurrentPeriodEnd: 1 }), false);
});
test('server prices parts + shipping, derives seller and snapshots fee', async () => {
  const { ctx, data } = fixture();
  const draft = await checkout.prepare._handler(ctx, { consumerId: 'buyer', items: [{ partId: 'p1', quantity: 1 }] });
  assert.equal(draft.totalCents, 10000);
  assert.equal(draft.providerId, 'seller');
  assert.equal(draft.transactionFeePercent, 10);
  assert.equal(data.get(draft.draftId).items[0].image, 'https://example.com/part.jpg');
});
test('rejects mixed sellers, missing payouts, missing products and invalid quantities', async () => {
  for (const quantity of [0, -1, 1.5, 100, NaN]) {
    await assert.rejects(checkout.prepare._handler(fixture().ctx, { consumerId: 'buyer', items: [{ partId: 'p1', quantity }] }), /Quantity/);
  }
  await assert.rejects(checkout.prepare._handler(fixture().ctx, { consumerId: 'buyer', items: [] }), /1–50/);
  await assert.rejects(checkout.prepare._handler(fixture().ctx, { consumerId: 'buyer', items: [{ partId: 'missing', quantity: 1 }] }), /available/);
  await assert.rejects(checkout.prepare._handler(fixture().ctx, { consumerId: 'buyer', items: [{ partId: 'p1', quantity: 1 }, { partId: 'p2', quantity: 1 }] }), /one seller/);
  const { ctx, data } = fixture(); data.get('seller').stripeConnected = false;
  await assert.rejects(checkout.prepare._handler(ctx, { consumerId: 'buyer', items: [{ partId: 'p1', quantity: 1 }] }), /payouts/);
});
test('paid order keeps original fee despite admin change; duplicate webhook creates one order', async () => {
  const { ctx, data, tables } = fixture();
  const draft = await checkout.prepare._handler(ctx, { consumerId: 'buyer', items: [{ partId: 'p1', quantity: 1 }] });
  data.get('settings').transactionFee = 20;
  const args = { draftId: draft.draftId, consumerId: 'buyer', sessionId: 'cs_test', paymentIntentId: 'pi_test', totalCents: 10000 };
  await assert.rejects(checkout.complete._handler(ctx, { ...args, totalCents: 1 }), /match/);
  const first = await checkout.complete._handler(ctx, args);
  const retry = await checkout.complete._handler(ctx, args);
  assert.equal(first.created, true); assert.equal(retry.created, false);
  assert.equal(tables.orders.length, 1);
  assert.equal(data.get(first.orderId).platformFeeAmount, 10);
  assert.equal(data.get(first.orderId).sellerAmount, 90);
});
test('admin save requires a valid admin session and validates fee on backend', async () => {
  const { ctx, data, tables } = fixture();
  const args = { adminSessionToken: 'test-session', platformName: 'CrankOver', proPlanPrice: 0, transactionFee: 10 };
  await assert.rejects(settingsFunctions.update._handler(ctx, args), /session expired/);
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(args.adminSessionToken))).toString('hex');
  data.set('admin', { tokenHash: hash, expiresAt: Date.now() + 60000 }); tables.adminSessions.push('admin');
  await assert.rejects(settingsFunctions.update._handler(ctx, { ...args, transactionFee: 101 }), /100%/);
  await settingsFunctions.update._handler(ctx, { ...args, transactionFee: 12.5 });
  assert.equal(data.get('settings').transactionFee, 12.5);
});
test('public checkout ignores forged amount/priceId/providerId and uses saved fee', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  let sent;
  globalThis.billingStripeMock = { checkout: { sessions: { create: async params => { sent = params; return { url: 'https://checkout.stripe.com/test' }; } } } };
  const { ctx } = fixture();
  const actionCtx = { auth: { getUserIdentity: async () => ({ subject: 'buyer' }) }, runMutation: async (ref, args) => {
    assert.equal(getFunctionName(ref), 'checkout:prepare');
    return checkout.prepare._handler(ctx, args);
  } };
  await stripeFunctions.createCheckoutSession._handler(actionCtx, {
    items: [{ partId: 'p1', quantity: 1 }], amount: 0.01, priceId: 'price_forged', providerId: 'attacker',
    successUrl: 'https://crankover.com/checkout', cancelUrl: 'https://crankover.com/checkout',
  });
  assert.equal(sent.line_items[0].price_data.unit_amount, 10000);
  assert.equal(sent.payment_intent_data.application_fee_amount, 1000);
  assert.equal(sent.payment_intent_data.transfer_data.destination, 'acct_seller');
  assert.deepEqual(sent.shipping_address_collection.allowed_countries, ['US']);
  assert.ok(sent.metadata.checkoutDraftId);
  assert.equal(sent.metadata.items, undefined);
});
test('subscription checkout uses admin price, and $0 blocks new paid sessions', async () => {
  let sent;
  globalThis.billingStripeMock = { checkout: { sessions: { create: async params => { sent = params; return { url: 'https://checkout.stripe.com/test' }; } } } };
  let proPlanPrice = 14.95;
  const ctx = { auth: { getUserIdentity: async () => ({ subject: 'seller' }) }, runQuery: async ref => getFunctionName(ref) === 'users:getMe' ? { role: 'provider' } : { proPlanPrice } };
  const args = { mode: 'subscription', amount: 0.01, priceId: 'price_forged', successUrl: 'https://crankover.com/subscription', cancelUrl: 'https://crankover.com/subscription' };
  await stripeFunctions.createCheckoutSession._handler(ctx, args);
  assert.equal(sent.line_items[0].price_data.unit_amount, 1495);
  assert.equal(sent.payment_intent_data, undefined);
  assert.equal(sent.shipping_address_collection, undefined);
  proPlanPrice = 0;
  await assert.rejects(stripeFunctions.createCheckoutSession._handler(ctx, args), /disabled/);
});
