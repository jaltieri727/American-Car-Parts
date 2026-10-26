import React, { useState } from 'react';
import { MainHeader } from './Header/MainHeader';
import { Navbar } from './Header/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigateTo } = useNavigation();

  return (
    <header className="w-full relative z-50">
      <MainHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Navbar />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-white lg:hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-xl font-bold">MENU</h1>
                <button onClick={() => setMobileMenuOpen(false)}><X size={32} /></button>
              </div>
              <ul className="space-y-6 text-2xl font-bold uppercase tracking-tight">
                {['home', 'shop', 'stores', 'pricing', 'about', 'blog', 'contact'].map((p) => (
                  <li key={p}>
                    <button
                      onClick={() => { navigateTo(p as any); setMobileMenuOpen(false); }}
                      className="hover:text-brand-red transition-colors"
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};