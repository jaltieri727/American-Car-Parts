import React, { border } from 'react';

export type UserRole = 'consumer' | 'provider' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  storeSlug?: string;
  avatar?: string;
  hasPaid?: boolean; // Track if the user has paid for the pro plan if price > 0
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
  stripeConnected?: boolean;
  isPublished?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  condition?: string;
  oldPrice?: number;
  rating: number;
  reviews: number;
  reviewsCount?: number;
  images: Array<{ url: string | null; storageId: string }>;
  imageIsIllustrative?: boolean;
  isNew?: boolean;
  discount?: number;
  inStock: boolean;
  providerId: string;
  providerName: string;
  providerSlug: string;
  partNumber?: string;
  castingNumber?: string;
  vinCompatibility?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  partId: string;
  quantity: number;
  priceAtPurchase: number;
  name: string; // Helpful for quick display
  image?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  amount: number;
  transactionFeePercent?: number;
  platformFeeAmount?: number;
  sellerAmount?: number;
  items: OrderItem[]; // Stricter schema
  consumerId: string;
  providerId: string;
  shippingDetails?: any;
  stripePaymentIntentId?: string;
}

export interface PlatformSettings {
  proPlanPrice: number;
  transactionFee: number;
  platformName: string;
  logoUrl?: string;
}

export type PageType =
  | 'home'
  | 'shop'
  | 'pricing'
  | 'about'
  | 'blog'
  | 'contact'
  | 'dashboard'
  | 'products'
  | 'auth'
  | 'admin'
  | 'store'
  | 'checkout'
  | 'select-role'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'shipping';

export interface NavigationState {
  page: PageType;
  params?: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
}
