import React, { useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { navigateTo, settings } = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const subscribeMutation = useMutation(api.newsletter.subscribe);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await subscribeMutation({ email });
      alert(result.message);
      setEmail('');
    } catch (error) {
      alert("Subscription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const platformNameFirstChar = settings.platformName.charAt(0);
  const platformNameRest = settings.platformName.slice(1);

  return (
    <footer className="bg-white pt-12">
      {/* Newsletter Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="bg-brand-red rounded-lg p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h4 className="font-medium text-white/80 mb-2 uppercase tracking-widest text-xs">Subscribe To Our Newsletter!</h4>
            <h2 className="text-3xl font-black uppercase tracking-tight">Stay In The Loop</h2>
            <p className="mt-4 text-sm opacity-90">Join the list for future CrankOver news and offers.</p>
          </div>

          <form onSubmit={handleSubscribe} className="relative z-10 w-full max-w-md">
            <div className="bg-white p-1.5 rounded-lg flex shadow-2xl">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className="flex-1 px-4 py-2 text-gray-700 outline-none text-sm font-medium"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-dark text-white px-6 py-2 rounded-md text-xs font-bold uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Subscribe'}
              </button>
            </div>
          </form>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <div className="bg-brand-dark py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-gray-400 text-sm">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6 group">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="h-8 w-auto" alt={settings.platformName} />
                ) : (
                  <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center transform -skew-x-12">
                    <span className="text-white font-bold text-lg skew-x-12">{platformNameFirstChar}</span>
                  </div>
                )}
                <h2 className="text-xl font-bold text-white tracking-tighter uppercase">
                  {platformNameFirstChar}<span className="text-brand-red">{platformNameRest}</span>
                </h2>
              </Link>
              <p className="mb-6 leading-relaxed">The leading vertical SaaS platform for classic and vintage auto parts.</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="bg-gray-800/50 p-2 rounded-lg hover:bg-brand-red hover:text-white transition-all">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-xs">Navigation</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Shop', path: '/shop' },
                  { label: 'Stores', path: '/stores' },
                  { label: 'Pricing', path: '/pricing' },
                  { label: 'About', path: '/about' },
                  { label: 'Blog', path: '/blog' }
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.path} className="hover:text-brand-red transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-xs">Help & Support</h4>
              <ul className="space-y-3">
                <li><Link to="/faq" className="hover:text-brand-red transition-colors">FAQs</Link></li>
                <li><Link to="/privacy" className="hover:text-brand-red transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand-red transition-colors">Terms of Service</Link></li>
                <li><Link to="/shipping" className="hover:text-brand-red transition-colors">Shipping Info</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-xs">Contact</h4>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="text-brand-red font-bold uppercase text-[10px]">Add</div>
                  <div className="text-gray-300">12110 65th Ln N, Largo, FL 33773</div>
                </li>
                <li className="flex gap-3">
                  <div className="text-brand-red font-bold uppercase text-[10px]">Mail</div>
                  <a href="mailto:altieri.joey@gmail.com" className="text-gray-300 hover:text-white">altieri.joey@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 py-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <p>© {currentYear} {settings.platformName}. All Rights Reserved.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <span>Technology By</span>
              <img src="https://dashboard.codeblix.com/codeblix-logo.png" className="h-4 w-auto" alt="Codeblix Logo" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
