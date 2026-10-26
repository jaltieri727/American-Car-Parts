import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';

export const Hero: React.FC = () => {
  const { navigateTo, user, settings } = useNavigation();

  const handleCTA = () => {
    if (user) {
      navigateTo('dashboard');
    } else {
      navigateTo('auth');
    }
  };

  const ctaText = settings.proPlanPrice === 0
    ? "Create Your Free Storefront"
    : "Create Your Storefront";

  return (
    <div className="relative w-full h-[500px] lg:h-[600px] bg-brand-dark overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-transparent z-10"></div>

      <div className="container mx-auto px-4 h-full relative z-20 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <span className="inline-block text-brand-red font-bold tracking-wider uppercase text-sm bg-brand-red/10 px-4 py-2 rounded-full">
              Scale Your Restoration Business
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight uppercase">
              The Protocol for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Classic Parts Dealers</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
              Launch your own branded storefront for classic parts, with clear listing photos, prices, and a {settings.transactionFee}% transaction fee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="bg-brand-red text-white px-8 py-4 rounded font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg hover:shadow-red-900/50 group"
              >
                {ctaText}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded font-black uppercase tracking-wider hover:bg-white/20 transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden lg:flex justify-center items-center relative"
          >
            <motion.img
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              src="https://pngimg.com/d/engine_PNG35.png"
              alt="Car Engine"
              className="w-full max-w-[600px] object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
