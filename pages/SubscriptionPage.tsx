import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { CreditCard, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  const { settings, confirmPayment, user, navigateTo } = useNavigation();
  const { search } = useLocation();
  const [loading, setLoading] = useState(false);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const cancelSubscription = useAction(api.stripe.cancelSubscription);

  // Handle return from Stripe success
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('success') === 'true' && user?.hasPaid) {
      navigateTo('dashboard');
    }
  }, [search, user?.hasPaid, navigateTo]);

  const handleActivation = async () => {
    setLoading(true);
    try {
      if (settings.proPlanPrice > 0) {
        const successUrl = `${window.location.origin}/subscription?success=true`;
        const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

        const { url } = await createCheckoutSession({
          successUrl,
          cancelUrl,
          mode: "subscription"
        });

        if (url) window.location.href = url;
      } else {
        await confirmPayment();
        navigateTo('dashboard');
      }
    } catch (e: any) {
      alert("Activation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  const hasExistingSubscription = Boolean(user.stripeSubscriptionId && !['canceled', 'incomplete_expired'].includes(user.subscriptionStatus ?? ''));

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-brand-red font-black uppercase tracking-widest text-xs mb-4 block">Finalize Your Store</span>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-tight">One Step Away From <br /><span className="text-brand-red">Your First Sale</span></h1>
            <p className="text-gray-600 mb-8 leading-relaxed">Sell with a {settings.transactionFee}% all-inclusive fee on each order, including shipping. You receive {100 - settings.transactionFee}%; CrankOver pays Stripe processing from its share.</p>
            <ul className="space-y-4 mb-8">
              {["Unlimited Listings", "Custom /store Slug", `${settings.transactionFee}% fee — processing included`].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700"><CheckCircle2 className="text-brand-red" size={18} />{f}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-3xl shadow-2xl border">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><CreditCard className="text-brand-red" /> {settings.proPlanPrice > 0 ? "Secure Checkout" : "Protocol Activation"}</h2>
              {settings.proPlanPrice > 0 && <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-5 opacity-40" alt="Stripe" />}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-8 flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase text-gray-400">Monthly Plan</p><h3 className="text-3xl font-black">${settings.proPlanPrice}</h3></div>
              <ShieldCheck className="text-brand-red" size={40} />
            </div>

            <button onClick={hasExistingSubscription ? () => navigateTo('dashboard') : handleActivation} disabled={loading || (hasExistingSubscription && !user.hasPaid)} className="w-full bg-brand-dark text-white py-5 rounded-xl font-black uppercase flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
              {loading ? 'Initializing...' : hasExistingSubscription ? (user.hasPaid ? 'Back to Dashboard' : 'Subscription payment required') : settings.proPlanPrice === 0 ? 'Activate Free Storefront' : `Subscribe for $${settings.proPlanPrice.toFixed(2)}/month`}
              {!loading && <ArrowRight size={20} />}
            </button>
            {user.stripeSubscriptionId && !['canceled', 'incomplete_expired'].includes(user.subscriptionStatus ?? '') && (
              <div className="mt-6 text-sm text-gray-600">
                <p>Existing subscription: {user.subscriptionStatus}. Your existing price is unchanged.</p>
                <button disabled={loading || user.subscriptionCancelAtPeriodEnd} className="mt-3 underline font-bold disabled:opacity-50" onClick={async () => {
                  if (!window.confirm('Cancel your subscription at the end of the current billing period?')) return;
                  setLoading(true);
                  try { await cancelSubscription({}); alert('Cancellation scheduled for the end of your billing period.'); }
                  catch (error: any) { alert(error.message); }
                  finally { setLoading(false); }
                }}>{user.subscriptionCancelAtPeriodEnd ? 'Cancellation scheduled' : 'Cancel subscription'}</button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
