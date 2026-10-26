
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Product, CartItem, PlatformSettings, Order } from '../types';

interface NavigationContextType {
  navigateTo: (page: string, params?: Record<string, any>) => void;
  user: any;
  logout: () => void;
  updateUser: (args: any) => Promise<any>;
  updateProvider: (args: any) => Promise<any>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products: Product[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: PlatformSettings;
  confirmPayment: () => Promise<void>;
  isSettingsLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const convexUser = useQuery(api.users.getMe);
  const platformSettings = useQuery(api.platformSettings.get);
  const updateUserMutation = useMutation(api.users.updateUser);
  const activateFreePlanMutation = useMutation(api.users.activateFreePlan);
  const updateProviderMutation = useMutation(api.providers.updateProvider);

  const products = useQuery(api.products.list, {}) || [];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setLocalOrders] = useState<Order[]>([]);

  const convexOrders = useQuery(api.orders.listMyOrders, { role: convexUser?.role || 'consumer' }) || [];

  const settings: PlatformSettings = useMemo(() => ({
    proPlanPrice: platformSettings?.proPlanPrice ?? 0,
    transactionFee: platformSettings?.transactionFee ?? 0,
    platformName: platformSettings?.platformName ?? 'CrankOver',
    logoUrl: platformSettings?.logoUrl ?? ''
  }), [platformSettings]);

  const navigateTo = (page: string, params?: Record<string, any>) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let url = `/${page}`;
    if (page === 'home') url = '/';
    if (page === 'shop' && params?.id) url = `/shop/${params.id}`;
    if (page === 'shop' && params?.category) url = `/shop?category=${encodeURIComponent(params.category)}`;
    if (page === 'store' && params?.slug) url = `/store/${params.slug}`;
    navigate(url);
  };

  const logout = () => signOut(() => navigate('/'));

  const updateUser = async (args: any) => {
    return await updateUserMutation(args);
  };

  const updateProvider = async (args: any) => {
    return await updateProviderMutation(args);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const pId = (product as any)._id || product.id;
      const existing = prev.find(item => ((item as any)._id || item.id) === pId);
      if (existing) {
        return prev.map(item => ((item as any)._id || item.id) === pId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => ((item as any)._id || item.id) !== productId));
  };

  const clearCart = () => setCart([]);

  const confirmPayment = async () => {
    await activateFreePlanMutation({});
  };

  return (
    <NavigationContext.Provider value={{
      navigateTo,
      user: convexUser,
      logout,
      updateUser,
      updateProvider,
      cart, addToCart, removeFromCart, clearCart,
      searchQuery, setSearchQuery,
      products,
      orders: convexOrders as any,
      setOrders: setLocalOrders as any,
      settings,
      confirmPayment,
      isSettingsLoading: platformSettings === undefined
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
};
