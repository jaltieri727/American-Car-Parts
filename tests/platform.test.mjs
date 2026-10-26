import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getFunctionName } from 'convex/server';
const require = createRequire(import.meta.url);
const { build } = require(createRequire(require.resolve('vite')).resolve('esbuild'));
async function load(entry) {
  const result = await build({ entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const ai = await load('convex/ai.ts');
const newsletter = await load('convex/newsletter.ts');
const catalog = await load('convex/catalogAdmin.ts');
const aiSettings = await load('convex/aiSettings.ts');
const providers = await load('convex/providers.ts');
const {ChatMarkdown} = await load('components/ChatMarkdown.tsx');

test('chat renders Markdown and search buttons without allowing HTML or script links', () => {
  const html = renderToStaticMarkup(React.createElement(ChatMarkdown, {text:'## Help\n\n**Classic Car Maintenance**\n\n* Parts\n* Restoration\n\n**[Search: brake pads]**\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert)\n\n![tracking](https://example.com/track)',onSearch:()=>{}}));
  assert.match(html,/<strong>Classic Car Maintenance<\/strong>/);
  assert.match(html,/<ul[^>]*>/);assert.match(html,/<li>Parts<\/li>/);
  assert.match(html,/<button[^>]*>Search: brake pads<\/button>/);
  assert.doesNotMatch(html,/<script|javascript:|<img/);
});

test('AI key settings are admin-only, encrypted and excluded from status responses', async () => {
  process.env.AI_SETTINGS_ENCRYPTION_KEY=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
  const {ctx,records}=await adminContext();
  const key='AIza'+'x'.repeat(35);
  await assert.rejects(aiSettings.store._handler(ctx,{adminSessionToken:'invalid',apiKey:key}),/session expired/);
  await assert.rejects(aiSettings.status._handler(ctx,{adminSessionToken:'invalid'}),/session expired/);
  await aiSettings.store._handler(ctx,{adminSessionToken:'admin-test',apiKey:key});
  const secret=[...records.values()].find(r=>r.table==='aiSecrets');
  assert.ok(secret.ciphertext);assert.ok(!JSON.stringify(secret).includes(key));
  assert.equal(await aiSettings.getKey._handler(ctx,{}),key);
  const status=await aiSettings.status._handler(ctx,{adminSessionToken:'admin-test'});
  assert.equal(status.source,'Admin key');assert.ok(!JSON.stringify(status).includes(key));
});

test('failed API validation leaves existing key unchanged and never saves', async () => {
  const previous=globalThis.fetch;let saved=false;
  globalThis.fetch=async()=>new Response('{}',{status:403});
  try {
    await assert.rejects(aiSettings.save._handler({runQuery:async()=>null,runMutation:async()=>{saved=true;}},{adminSessionToken:'admin-test',apiKey:'AIza'+'x'.repeat(35)}),/existing key is unchanged/);
    assert.equal(saved,false);
  }finally{globalThis.fetch=previous;}
});

test('only the seller can save contact details, which appear on the storefront', async () => {
  const { db } = database();
  const userId = await db.insert('users', { clerkId: 'seller-1', name: 'Alex Morgan', email: 'owner@example.com' });
  const providerId = await db.insert('providers', { userId, clerkId: 'seller-1', storeName: 'Garage', storeSlug: 'garage', stripeConnected: false, isPublished: true });
  const args = { ownerName: 'Alex Morgan', address: '123 Main Street, Springfield, IL 62701', phone: '(217) 555-0100', contactEmail: 'shop@example.com' };
  await assert.rejects(providers.updateProvider._handler({ db, auth: { getUserIdentity: async () => null } }, args), /Unauthorized/);
  await providers.updateProvider._handler({ db, auth: { getUserIdentity: async () => ({ subject: 'seller-1' }) } }, args);
  assert.equal((await db.get(providerId)).contactEmail, 'shop@example.com');
  const publicStore = await providers.getBySlug._handler({ db }, { slug: 'garage' });
  assert.equal(publicStore.ownerName, 'Alex Morgan');
  assert.equal(publicStore.address, args.address);
  assert.equal(publicStore.phone, args.phone);
  assert.equal(publicStore.contactEmail, args.contactEmail);
  await assert.rejects(providers.updateProvider._handler({ db, auth: { getUserIdentity: async () => ({ subject: 'seller-1' }) } }, { contactEmail: 'bad-email' }), /valid storefront contact email/);
});

test('admin storefront setup requires an admin session and a connected seller', async () => {
  const { ctx } = await adminContext();
  const userId = await ctx.db.insert('users', { clerkId: 'seller', email: 'owner@example.com' });
  const providerId = await ctx.db.insert('providers', { userId, clerkId: 'seller', storeName: 'New Garage', storeSlug: 'garage', stripeConnected: false, isPublished: false });
  const args = { adminSessionToken: 'admin-test', id: providerId, storeName: 'Classic Parts Garage', bio: 'Classic restoration parts.', coverImageUrl: 'https://images.unsplash.com/photo-1759832014878-3ca69e15c79e?w=1200', specialties: [{ name: 'Ford Mustang', years: '1965–1973', imageUrl: 'https://images.unsplash.com/photo-1759832014878-3ca69e15c79e?w=800' }], showcaseItems: [{ title: 'V8 engine parts', vehicle: 'Ford Mustang', years: '1965–1973', category: 'Engine & Engine Parts', description: 'Contact the seller about engine components and confirm fitment.', imageUrl: 'https://images.unsplash.com/photo-1694714610088-b0105ba4ab09?w=800', photoPageUrl: 'https://unsplash.com/photos/a-close-up-of-the-engine-of-a-classic-car-6JidXQTnL_E' }], location: 'Springfield, IL', address: '123 Main Street, Springfield, IL 62701', ownerName: 'Alex Morgan', contactEmail: 'shop@example.com', isPublished: true };
  await assert.rejects(providers.configureStorefrontAsAdmin._handler(ctx, { ...args, adminSessionToken: 'invalid' }), /session expired/);
  await assert.rejects(providers.configureStorefrontAsAdmin._handler(ctx, args), /Connect Stripe/);
  await ctx.db.patch(providerId, { stripeConnected: true });
  await providers.configureStorefrontAsAdmin._handler(ctx, args);
  const store = await ctx.db.get(providerId);
  assert.equal(store.storeName, 'Classic Parts Garage');
  assert.equal(store.specialties[0].years, '1965–1973');
  assert.equal(store.showcaseItems[0].title, 'V8 engine parts');
  await providers.updateProvider._handler({ db: ctx.db, auth: { getUserIdentity: async () => ({ subject: 'seller' }) } }, { showcaseItems: [{ ...args.showcaseItems[0], priceNote: '$125', conditionNote: 'Restored' }] });
  assert.equal((await ctx.db.get(providerId)).showcaseItems[0].priceNote, '$125');
  assert.equal(store.isPublished, true);
  await assert.rejects(providers.configureStorefrontAsAdmin._handler(ctx, { ...args, showcaseItems: [{ ...args.showcaseItems[0], imageUrl: 'https://untrusted.example/part.jpg' }] }), /valid Unsplash part photo URL/);
});

test('admin catalog publication is authorized, priced, and duplicate-safe', async () => {
  const { ctx } = await adminContext();
  const userId = await ctx.db.insert('users', { clerkId: 'seller', role: 'provider' });
  const storeId = await ctx.db.insert('providers', { userId, clerkId: 'seller', storeName: 'Classic Parts Garage', storeSlug: 'classic-parts', stripeConnected: true, stripeAccountId: 'acct_test', isPublished: true, showcaseItems: [{ title: 'Inquiry card' }] });
  const listings = [{ name: 'Mustang wheel center cap', category: 'Wheels & Tires', description: 'Wheel center cap. Photo is representative.', price: 59, condition: 'New', imageUrl: 'https://images.unsplash.com/photo-1559674697-aea453b06ea9?w=800', partNumber: 'TEST-PART-001', vinCompatibility: '1971–1973 Mustang Magnum 500 wheels; confirm wheel specification.' }];
  await assert.rejects(catalog.publishStoreCatalog._handler(ctx, { adminSessionToken: 'invalid', storeId, listings }), /session expired/);
  await assert.rejects(catalog.publishStoreCatalog._handler(ctx, { adminSessionToken: 'admin-test', storeId, listings: [{ ...listings[0], price: 0 }] }), /valid listing price/);
  const ids = await catalog.publishStoreCatalog._handler(ctx, { adminSessionToken: 'admin-test', storeId, listings });
  assert.equal(ids.length, 1);
  const product = await ctx.db.get(ids[0]);
  assert.equal(product.inStock, true);
  assert.equal(product.providerSlug, 'classic-parts');
  assert.equal(product.imageIsIllustrative, true);
  assert.equal((await ctx.db.get(storeId)).showcaseItems.length, 0);
  await assert.rejects(catalog.publishStoreCatalog._handler(ctx, { adminSessionToken: 'admin-test', storeId, listings }), /already has catalog listings/);
});

function database() {
  const records = new Map(); let next = 1;
  const db = {
    async get(id) { return records.get(id) ?? null; },
    async insert(table, value) { const id = `${table}-${next++}`; records.set(id, { ...value, _id:id, table }); return id; },
    async patch(id, value) { Object.assign(records.get(id),value); },
    async delete(id) { records.delete(id); },
    query(table) {
      let predicate = r => r.table === table;
      const query = {
        withIndex(_name, cb) { cb({ eq(field,value) { predicate = r => r.table === table && r[field] === value; } }); return query; },
        order() {return query;},
        async take(n) {return [...records.values()].filter(predicate).slice(0,n);},
        async first() {return (await query.take(1))[0] ?? null;},
        async unique() {return query.first();},
        async collect() {return [...records.values()].filter(predicate);},
      }; return query;
    },
  };
  return { db, records };
}
async function adminContext() {
  const {db,records}=database();
  const tokenHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('admin-test'))).toString('hex');
  await db.insert('adminSessions',{tokenHash,expiresAt:Date.now()+60000});
  return {ctx:{db},records};
}

test('AI falls back on unavailable model, keeps history and authoritative US policy', async () => {
  const original=globalThis.fetch; const calls=[];
  process.env.GEMINI_API_KEY='test-key'; delete process.env.GEMINI_MODELS;
  globalThis.fetch=async (url,options) => {calls.push({url,body:JSON.parse(options.body)}); return calls.length===1 ? new Response('{}',{status:503}) : Response.json({candidates:[{content:{parts:[{text:'US shipping only.'}]}}]});};
  try {
    const ctx={auth:{getUserIdentity:async()=>null},runMutation:async()=>true,runQuery:async ref=>getFunctionName(ref)==='aiSettings:getKey'?'test-key':({transactionFee:10,monthlyPrice:0,listingCount:0})};
    const result=await ai.askCopilot._handler(ctx,{message:'Can you ship to Canada?',sessionId:'test',history:[{role:'user',text:'I own a Camaro.'}]});
    assert.equal(result.text,'US shipping only.'); assert.equal(calls.length,2);
    assert.match(calls[1].url,/gemini-3.5-flash-lite/);
    assert.match(calls[0].body.systemInstruction.parts[0].text,/US domestic shipping only/);
    assert.match(calls[0].body.systemInstruction.parts[0].text,/Never invent inventory/);
    assert.equal(calls[0].body.contents[0].parts[0].text,'I own a Camaro.');
  } finally {globalThis.fetch=original;}
});
test('AI validates input and limits free-tier requests before calling Gemini',async()=>{
  const ctx={auth:{getUserIdentity:async()=>null},runMutation:async()=>false};
  assert.match((await ai.askCopilot._handler(ctx,{message:'x'.repeat(2001)})).text,/2,000/);
  assert.match((await ai.askCopilot._handler(ctx,{message:'Hello'})).text,/wait a minute/);
  const {db}=database();
  for(let i=0;i<4;i++) assert.equal(await ai.reserveRequest._handler({db},{sessionId:'visitor:one'}),true);
  assert.equal(await ai.reserveRequest._handler({db},{sessionId:'visitor:one'}),false);
});
test('newsletter validates, normalizes and deduplicates registrations without claiming email sent',async()=>{
  const {db,records}=database();
  await assert.rejects(newsletter.subscribe._handler({db},{email:'not-an-email'}));
  const result=await newsletter.subscribe._handler({db},{email:'  Owner@Example.com '});
  await newsletter.subscribe._handler({db},{email:'owner@example.com'});
  assert.equal(records.size,1); assert.equal([...records.values()][0].email,'owner@example.com');
  assert.match(result.message,/future/);
});
test('catalog deletion requires admin session and exact store-name confirmation',async()=>{
  const {ctx}=await adminContext();
  await assert.rejects(catalog.deleteProduct._handler(ctx,{adminSessionToken:'invalid',id:'product'}),/session expired/);
  const store=await ctx.db.insert('providers',{storeName:'Demo Garage',clerkId:'seed_provider_1',userId:'user'});
  await assert.rejects(catalog.deleteStore._handler(ctx,{adminSessionToken:'admin-test',id:store,confirmName:'Wrong'}),/confirmation/);
});
test('store deletion removes its listings/reviews but preserves real stores, users and historical orders',async()=>{
  const {ctx,records}=await adminContext();
  const user=await ctx.db.insert('users',{clerkId:'seed_provider_1'});
  const store=await ctx.db.insert('providers',{storeName:'Demo Garage',clerkId:'seed_provider_1',userId:user});
  const real=await ctx.db.insert('providers',{storeName:'Real Garage',clerkId:'real'});
  const product=await ctx.db.insert('products',{providerId:'seed_provider_1'});
  const review=await ctx.db.insert('reviews',{productId:product});
  const order=await ctx.db.insert('orders',{providerId:'seed_provider_1',status:'Processing'});
  const args={adminSessionToken:'admin-test',id:store,confirmName:'Demo Garage'};
  await assert.rejects(catalog.deleteStore._handler(ctx,args),/open orders/);
  await ctx.db.patch(order,{status:'Delivered'});
  assert.equal((await catalog.deleteStore._handler(ctx,args)).deletedListings,1);
  assert.ok(records.has(user));assert.ok(records.has(real));assert.ok(records.has(order));
  assert.ok(!records.has(store));assert.ok(!records.has(product));assert.ok(!records.has(review));
});
