import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, BarChart, Globe } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const FEATURES = [
  { icon: Globe, title: "Custom Domain", desc: "Launch your store on your own unique URL." },
  { icon: Zap, title: "Unlimited Listings", desc: "No limits on how many classic parts you can sell." },
  { icon: Shield, title: "Secure Payouts", desc: "Your earnings are paid to your Stripe account. CrankOver covers Stripe processing fees." },
  { icon: BarChart, title: "Sales Insights", desc: "Track orders, inventory, and customer behavior easily." }
];

export const PricingPage: React.FC = () => {
  const { settings, navigateTo, user } = useNavigation();

  const handleGetStarted = () => {
    if (!user) {
      navigateTo('auth');
    } else {
      navigateTo('dashboard');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-brand-dark py-24 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-red font-bold uppercase tracking-widest text-sm"
          >
            Launch Your Business
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-4 mb-6 uppercase"
          >
            Simple, Transparent <br /> <span className="text-brand-red">{settings.transactionFee}% All-Inclusive Fee</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Pay {settings.transactionFee}% per sale, including payment processing. We cover Stripe's processing fees from our share. {settings.proPlanPrice === 0 ? 'No monthly subscription required.' : `Seller subscriptions are $${settings.proPlanPrice.toFixed(2)} per month.`}
          </motion.p>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      </section>

      <section className="container mx-auto px-4 -mt-16 relative z-20 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row"
          >
            <div className="p-10 md:p-16 flex-1 bg-[#F9F9F7]">
              <h2 className="text-3xl font-black mb-4 uppercase">Pro Storefront</h2>
              <p className="text-gray-600 mb-10">Perfect for salvage yards, collectors, and restoration specialists.</p>

              <ul className="space-y-4">
                {[
                  "Unlimited Part Listings",
                  "Whitelabel Storefront Builder",
                  "Direct Stripe Connect Payouts",
                  "VIN & Casting Number Search",
                  "Inventory Management Tools",
                  "US Domestic Shipping",
                  `${settings.transactionFee}% fee — processing included`
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center text-white">
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-10 md:p-16 bg-brand-dark text-white flex flex-col justify-center items-center text-center md:w-80">
              <div className="mb-6">
                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-2">Monthly</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">${settings.proPlanPrice}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                disabled={user?.role === 'consumer'}
                className={`w-full font-black uppercase py-4 rounded-lg transition-all shadow-xl flex items-center justify-center gap-2 group ${user?.role === 'consumer'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-red hover:bg-red-700 text-white hover:shadow-red-900/40'
                  }`}
              >
                {user?.role === 'consumer' ? 'Not Applicable' : 'Get Started'}
                {user?.role !== 'consumer' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
              {user?.role === 'consumer' && (
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Standard buying accounts do not require Pro billing.
                </p>
              )}
              {settings.proPlanPrice === 0 && user?.role !== 'consumer' && (
                <p className="mt-4 text-xs text-gray-300">No monthly subscription. Just {settings.transactionFee}% of each order total, including shipping.</p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-red group-hover:text-white transition-colors">
                <f.icon size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
