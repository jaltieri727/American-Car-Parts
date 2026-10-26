import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import { useAction, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, CreditCard, ChevronRight, Package } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, removeFromCart, clearCart, navigateTo, user } = useNavigation();
  const { search } = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = cart.length > 0 ? 25 : 0;
  const total = subtotal + shipping;

  // Handle return from Stripe success
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('success') === 'true') {
      setIsSuccess(true);
      // We clear the cart immediately as payment was successful
      // The actual order is created asynchronously via Stripe Webhook for better reliability (Address capture)
      if (cart.length > 0) {
        clearCart();
      }

      const timer = setTimeout(() => {
        navigateTo('dashboard');
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [search, cart.length, clearCart, navigateTo]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) { navigateTo('auth'); return; }

    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/checkout?success=true`;
      const cancelUrl = `${window.location.origin}/checkout?canceled=true`;

      // Pass raw items for server-side verification instead of calculated amount
      const items = cart.map(item => ({
        partId: (item as any)._id || item.id,
        quantity: item.quantity,
      }));

      const { url } = await createCheckoutSession({
        items,
        successUrl,
        cancelUrl,
        mode: "payment",
      });

      if (url) window.location.href = url;
    } catch (e: any) {
      alert("Checkout failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9F9F7]">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40}/>
          </div>
          <h2 className="text-3xl font-black uppercase mb-4">Payment Verified</h2>
          <p className="text-gray-500 mb-8">Your shipping protocol has been initiated. You will receive an email confirmation shortly. Redirecting to your dashboard...</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-10 tracking-widest">
           <button onClick={() => navigateTo('shop')}>Shop</button> <ChevronRight size={12}/> <span>Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><ShoppingCart className="text-brand-red"/> Your Cart ({cart.length})</h2><p className="text-sm text-gray-600 mt-2">Shipping within the United States only.</p></div>
              <div className="p-8 space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col md:flex-row items-center gap-6 py-6 border-b border-gray-50 last:border-none">
                    {item.images[0]?.url ? <img src={item.images[0].url} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-gray-50" /> : <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center"><Package size={26} className="text-gray-300" /></div>}
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-black uppercase text-sm mb-1">{item.name}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</p>
                      <p className="text-[10px] text-brand-red font-bold mt-2">Sold by: {item.providerName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="font-black text-lg">${item.price.toFixed(2)}</span>
                       <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-brand-red transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="py-12 text-center text-gray-400 font-bold uppercase text-xs">Your cart is empty</div>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-black uppercase mb-6">Order Summary</h3>
               <div className="space-y-4 text-sm mb-8">
                 <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-bold text-brand-dark">${subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-bold text-brand-dark">${shipping.toFixed(2)}</span></div>
                 <div className="pt-4 border-t flex justify-between">
                    <span className="font-black uppercase">Total</span>
                    <span className="font-black text-2xl text-brand-red">${total.toFixed(2)}</span>
                 </div>
               </div>
               <button
                 onClick={handleCheckout}
                 disabled={cart.length === 0 || loading}
                 className="w-full bg-brand-dark text-white py-5 rounded-xl font-black uppercase flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl disabled:opacity-30"
               >
                 {loading ? 'Redirecting to Stripe...' : 'Checkout Now'} <ArrowRight size={20}/>
               </button>
               <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                 <ShieldCheck size={14} className="text-green-500"/> Secured by Stripe Connect
               </div>
            </div>
            <div className="bg-gray-900 p-8 rounded-2xl text-white">
               <h4 className="font-black uppercase mb-2 flex items-center gap-2"><CreditCard size={18}/> Payment Protocol</h4>
               <p className="text-gray-400 text-[10px] leading-relaxed">CrankOver uses end-to-end encrypted processing. Your funds are released to the provider only upon shipping confirmation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
