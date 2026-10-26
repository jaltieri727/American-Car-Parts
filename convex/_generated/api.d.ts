/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminModel from "../adminModel.js";
import type * as ai from "../ai.js";
import type * as aiSettings from "../aiSettings.js";
import type * as blogs from "../blogs.js";
import type * as catalogAdmin from "../catalogAdmin.js";
import type * as checkout from "../checkout.js";
import type * as contact from "../contact.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_billing from "../lib/billing.js";
import type * as lib_sellerAccess from "../lib/sellerAccess.js";
import type * as newsletter from "../newsletter.js";
import type * as orders from "../orders.js";
import type * as platformSettings from "../platformSettings.js";
import type * as products from "../products.js";
import type * as providers from "../providers.js";
import type * as stripe from "../stripe.js";
import type * as testimonials from "../testimonials.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminModel: typeof adminModel;
  ai: typeof ai;
  aiSettings: typeof aiSettings;
  blogs: typeof blogs;
  catalogAdmin: typeof catalogAdmin;
  checkout: typeof checkout;
  contact: typeof contact;
  emails: typeof emails;
  http: typeof http;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/billing": typeof lib_billing;
  "lib/sellerAccess": typeof lib_sellerAccess;
  newsletter: typeof newsletter;
  orders: typeof orders;
  platformSettings: typeof platformSettings;
  products: typeof products;
  providers: typeof providers;
  stripe: typeof stripe;
  testimonials: typeof testimonials;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
