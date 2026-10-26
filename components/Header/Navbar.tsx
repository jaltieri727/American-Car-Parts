import React, { useState, useMemo } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNavigation } from '../../context/NavigationContext';
import { PageType } from '../../types';
import { PRODUCT_CATEGORIES } from '../../data/productCategories';

export const Navbar: React.FC = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { navigateTo, products, user, setSearchQuery } = useNavigation();
  const currentPath = window.location.pathname;

  const categories = useMemo(() => {
    return Array.from(new Set([...PRODUCT_CATEGORIES, ...products.map(p => p.category)]));
  }, [products]);

  const navItems: { label: string; page: PageType; path: string }[] = [
    { label: 'Home', page: 'home', path: '/' },
    { label: 'Shop', page: 'shop', path: '/shop' },
    { label: 'Stores', page: 'home' as any, path: '/stores' },
    { label: 'Pricing', page: 'pricing', path: '/pricing' },
    { label: 'Blog', page: 'blog', path: '/blog' },
    { label: 'Contact', page: 'contact', path: '/contact' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm relative">
      <div className="w-full">
        <div className="flex items-center h-14">
          <div className="relative h-full">
            <button
              className="flex items-center gap-3 bg-brand-red text-white px-8 h-full font-semibold tracking-wide hover:bg-red-700 transition-colors whitespace-nowrap"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <Menu size={20} />
              PRODUCT CATEGORY
            </button>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 w-72 max-h-[70vh] overflow-y-auto bg-white shadow-xl border border-gray-100 z-[100]"
                >
                  <ul className="py-2">
                    {categories.map((cat) => (
                      <li
                        key={cat}
                        className="px-6 py-3 text-sm text-gray-600 hover:text-brand-red border-b border-gray-50 last:border-none cursor-pointer flex justify-between items-center group"
                        onClick={() => { setSearchQuery(''); navigateTo('shop', { category: cat }); setIsCategoryOpen(false); }}
                      >
                        {cat}
                        <ChevronDown size={14} className="transform -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-12 text-sm font-bold uppercase tracking-widest text-gray-700">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-1 transition-colors relative group py-2 ${isActive ? 'text-brand-red' : 'hover:text-brand-red'}`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full ${isActive ? 'w-full' : ''}`}></span>
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className="hidden lg:flex items-center px-8 h-full border-l border-gray-100">
              <Link
                to="/dashboard"
                className="text-brand-red font-black text-xs uppercase tracking-[0.2em] px-4 py-2 hover:text-red-700 transition-all"
              >
                Register Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
