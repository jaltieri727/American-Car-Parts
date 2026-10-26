import React, { useState } from 'react';
import { User as UserIcon, ShoppingCart } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

interface MainHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { navigateTo, user, logout, cart, setSearchQuery, settings } = useNavigation();
  const [localSearch, setLocalSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    navigateTo('shop');
  };

  const platformNameFirstChar = settings.platformName.charAt(0);
  const platformNameRest = settings.platformName.slice(1);

  return (
    <div className="bg-brand-dark text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigateTo('home')}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="h-10 w-auto" alt={settings.platformName} />
            ) : (
              <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center transform -skew-x-12">
                <span className="text-white font-bold text-xl skew-x-12">{platformNameFirstChar}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">
                {platformNameFirstChar}<span className="text-brand-red">{platformNameRest}</span>
              </h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Classic Parts Marketplace</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden lg:block">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="block w-full pl-10 pr-24 py-3 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-brand-red sm:text-sm"
                placeholder="Search by Part Name, VIN, or Casting Number..."
              />
              <button type="submit" className="absolute inset-y-1 right-1 px-6 bg-brand-dark text-white rounded-full text-sm font-medium">Search</button>
            </div>
          </form>

          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => user ? navigateTo('dashboard') : navigateTo('auth')}
                  className="p-1 hover:text-brand-red transition-colors flex items-center gap-2"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} className="w-9 h-9 rounded-full border-2 border-brand-red object-cover" alt="User Profile" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center"><UserIcon size={20} /></div>
                  )}
                </button>
                {user && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white text-brand-dark rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <button onClick={() => navigateTo('dashboard')} className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gray-50 border-b">Dashboard</button>
                    <button onClick={logout} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 font-bold uppercase tracking-wider">Logout Session</button>
                  </div>
                )}
              </div>
              <button onClick={() => navigateTo('checkout')} className="relative p-2 hover:text-brand-red transition-colors">
                <ShoppingCart size={24} />
                {cart.length > 0 && <span className="absolute top-0 right-0 bg-brand-red rounded-full px-1.5 py-0.5 text-[10px] font-black">{cart.length}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};