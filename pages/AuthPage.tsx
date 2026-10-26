import React from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, CheckCircle2, User, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export const AuthPage: React.FC = () => {
  const { settings, navigateTo } = useNavigation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden relative">
      {/* Back Button */}
      <button
        onClick={() => navigateTo('home')}
        className="absolute top-8 right-8 z-50 flex items-center gap-2 text-brand-dark font-black uppercase text-xs tracking-widest hover:text-brand-red transition-colors group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-brand-dark flex items-center justify-center group-hover:border-brand-red">
          <ChevronLeft size={16} />
        </div>
        Back to Protocol
      </button>

      <div className="hidden md:flex md:w-1/2 bg-brand-dark relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 grayscale pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1200&auto=format&fit=crop')`, backgroundSize: 'cover' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent"></div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center transform -skew-x-12">
              <span className="text-white font-bold text-xl skew-x-12">{settings.platformName.charAt(0)}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">{settings.platformName}</h1>
          </div>
          <h2 className="text-5xl lg:text-7xl font-black text-white leading-tight uppercase tracking-tighter mb-8">
            The Digital <br /><span className="text-brand-red">Protocol</span> <br />for Classic <br />Auto Parts.
          </h2>
          <div className="space-y-4 max-w-sm">
            {["Proprietary VIN-Specific Search", "Direct Payout Architecture", "Zero Transaction Fees for Dealers", "Whitelabel Storefront Protocol"].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 font-bold uppercase text-[10px] tracking-widest">
                <CheckCircle2 size={16} className="text-brand-red" /> {text}
              </div>
            ))}
          </div>
        </motion.div>
        <div className="relative z-10 text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">Restoration Technology Standards • EST. 2023</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-[#F9F9F7]">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md text-center">
          <div className="mb-10">
            <h3 className="text-4xl font-black uppercase tracking-tight mb-4 text-brand-dark">Access System</h3>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest leading-relaxed">
              Initialize your connection to the CrankOver marketplace or dealer protocol.
            </p>
          </div>

          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full bg-brand-red text-white py-5 rounded-xl font-black uppercase shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 group">
                Sign In to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>

            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">OR</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            <SignUpButton mode="modal">
              <button className="w-full bg-white text-brand-dark border-2 border-brand-dark py-5 rounded-xl font-black uppercase hover:bg-brand-dark hover:text-white transition-all">
                Register Storefront
              </button>
            </SignUpButton>
          </div>

          <p className="mt-12 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Authentication Powered by Clerk Protocol</p>
        </motion.div>
      </div>
    </div>
  );
};

export const SelectRolePage: React.FC = () => {
  const { navigateTo, updateProvider } = useNavigation();
  const setRole = useMutation(api.users.updateUser);

  const handleSelectRole = async (role: 'provider' | 'consumer') => {
    await setRole({ role });
    if (role === 'provider') {
      try {
        await updateProvider({ storeName: "New Garage" });
      } catch (e) {
        console.error("Provider initialization protocol skipped or failed", e);
      }
    }
    navigateTo('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4 relative">
      <button
        onClick={() => navigateTo('home')}
        className="absolute top-8 left-8 flex items-center gap-2 text-brand-dark font-black uppercase text-xs tracking-widest hover:text-brand-red transition-colors group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-brand-dark flex items-center justify-center group-hover:border-brand-red">
          <ChevronLeft size={16} />
        </div>
        Exit Selection
      </button>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -10 }} className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 text-center flex flex-col items-center group cursor-pointer" onClick={() => handleSelectRole('consumer')}>
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all"><User size={40} /></div>
          <h2 className="text-3xl font-black uppercase mb-4">I'm a Buyer</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">I am looking for authentic parts for my classic vehicle restoration.</p>
          <div className="mt-auto w-full bg-gray-100 py-4 rounded-xl font-bold uppercase text-xs group-hover:bg-brand-red group-hover:text-white transition-all">Select Consumer</div>
        </motion.div>
        <motion.div whileHover={{ y: -10 }} className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 text-center flex flex-col items-center group cursor-pointer" onClick={() => handleSelectRole('provider')}>
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all"><ShieldCheck size={40} /></div>
          <h2 className="text-3xl font-black uppercase mb-4">I'm a Seller</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">I have inventory, a salvage yard, or private collection to sell in the United States.</p>
          <div className="mt-auto w-full bg-gray-100 py-4 rounded-xl font-bold uppercase text-xs group-hover:bg-brand-red group-hover:text-white transition-all">Select Provider</div>
        </motion.div>
      </div>
    </div>
  );
};
