
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AICopilot } from './components/AICopilot';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BlogPage } from './pages/BlogPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthPage, SelectRolePage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProviderStorefront } from './pages/ProviderStorefront';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { StoresPage } from './pages/StoresPage';
import { FAQPage, PrivacyPage, TermsPage, ShippingPage } from './pages/InfoPages';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AnimatePresence } from 'framer-motion';

const AuthenticatedApp: React.FC = () => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, isSettingsLoading } = useNavigation();
  const convexUser = useQuery(api.users.getMe);
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      syncUser({
        name: clerkUser.fullName || clerkUser.username || "Enthusiast",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        avatar: clerkUser.imageUrl
      });
    }
  }, [isSignedIn, clerkUser, syncUser]);

  useEffect(() => {
    if (location.pathname === '/admin') return; // Admin auth and billing are independent of Clerk.
    if (isSignedIn && isLoaded && convexUser !== undefined && !isSettingsLoading) {
      // Role enforcement: ensure user selects a role after first login
      if (convexUser && !convexUser.role && location.pathname !== '/select-role') {
        navigate('/select-role');
      } else if (convexUser?.role && location.pathname === '/select-role') {
        navigate('/dashboard');
      }

      // Payment enforcement for Providers based on dynamic Platform Settings
      const proPlanPrice = settings.proPlanPrice;
      if (convexUser?.role === 'provider' && !convexUser.hasPaid && proPlanPrice > 0 && location.pathname !== '/subscription' && location.pathname !== '/select-role') {
        navigate('/subscription');
      }
    }
  }, [isSignedIn, isLoaded, convexUser, location.pathname, navigate, settings.proPlanPrice, isSettingsLoading]);

  if (!isLoaded || isSettingsLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center font-black uppercase tracking-widest text-brand-red bg-brand-dark">
        <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-6"></div>
        Loading...
      </div>
    );
  }

  const showHeaderFooter = !['/auth', '/select-role', '/dashboard', '/admin'].includes(location.pathname);

  return (
    <div className="antialiased text-gray-900 bg-white min-h-screen flex flex-col">
      {showHeaderFooter && <Header />}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/auth" element={isSignedIn ? <Navigate to="/dashboard" /> : <AuthPage />} />
            <Route path="/select-role" element={isSignedIn ? <SelectRolePage /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/store/:slug" element={<ProviderStorefront />} />
            <Route path="/subscription" element={isSignedIn ? <SubscriptionPage /> : <Navigate to="/auth" />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </div>
      {showHeaderFooter && <Footer />}
      <AICopilot />
    </div>
  );
};

function App() {
  return (
    <NavigationProvider>
      <AuthenticatedApp />
    </NavigationProvider>
  );
}

export default App;
