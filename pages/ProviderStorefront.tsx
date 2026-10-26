
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useNavigation } from '../context/NavigationContext';
import { ProductCard } from '../components/ProductCard';
import { SectionHeading } from '../components/SectionHeading';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Search, Filter, ChevronLeft, ChevronRight, PackageSearch, UserRound, Phone, Mail, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const ProviderStorefront: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useNavigation();
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState('All');
  const [currentPageNum, setCurrentPageNum] = useState(1);

  const provider = useQuery(api.providers.getBySlug, { slug: slug || "" });

  const providerProducts = useMemo(() => {
    return products.filter(p => {
      const isProvider = p.providerSlug === slug;
      const matchesSearch = p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (p.partNumber && p.partNumber.toLowerCase().includes(localSearch.toLowerCase()));
      const matchesCategory = localCategory === 'All' || p.category === localCategory;
      return isProvider && matchesSearch && matchesCategory;
    });
  }, [products, slug, localSearch, localCategory]);

  const categories = useMemo(() => {
    const all = products.filter(p => p.providerSlug === slug).map(p => p.category);
    return ['All', ...Array.from(new Set(all))];
  }, [products, slug]);

  const totalPages = Math.ceil(providerProducts.length / ITEMS_PER_PAGE);
  const currentItems = providerProducts.slice((currentPageNum - 1) * ITEMS_PER_PAGE, currentPageNum * ITEMS_PER_PAGE);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    setCurrentPageNum(1);
  };

  const handleCategoryChange = (val: string) => {
    setLocalCategory(val);
    setCurrentPageNum(1);
  };

  if (provider === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (provider === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <PackageSearch size={64} className="text-gray-200 mb-6" />
        <h1 className="text-3xl font-black uppercase text-brand-dark mb-2">Garage Not Found</h1>
        <p className="text-gray-500 text-center max-w-sm mb-8">The storefront protocol you're looking for does not exist or has been taken offline.</p>
        <button onClick={() => window.history.back()} className="bg-brand-red text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Return to Safety</button>
      </div>
    );
  }

  const contactEmail = provider.contactEmail || provider.email;
  const phoneLink = provider.phone?.replace(/[^+\d]/g, '');

  return (
    <div className="bg-white min-h-screen">
      <div className="h-72 md:h-96 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url("${provider.coverImageUrl || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop'}")` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full bg-brand-red/5 backdrop-blur-[2px]"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 mb-16"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-brand-red rounded-2xl shadow-xl flex items-center justify-center font-black text-white text-5xl transform -skew-x-12 relative overflow-hidden">
              {provider.logoUrl ? (
                <img src={provider.logoUrl} className="w-full h-full object-cover skew-x-12 scale-110" alt={provider.storeName} />
              ) : (
                <span className="skew-x-12">{provider.storeName.charAt(0)}</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-black uppercase tracking-tight">{provider.storeName}</h1>
              </div>
              {provider.bio && <p className="text-sm text-gray-600 leading-relaxed max-w-xl mb-4">{provider.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest justify-center md:justify-start">
                <span className="flex items-center gap-1"><MapPin size={14} /> {provider.location || "USA"}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Joined {provider.joinedAt || "2023"}</span>
                <span>{products.filter(p => p.providerSlug === slug).length} available to buy online</span>
              </div>
            </div>
          </div>
          <a href={`mailto:${contactEmail}`} className="bg-brand-dark text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-gray-800 transition-all">
            Contact Garage
          </a>
        </motion.div>

        {provider.specialties && provider.specialties.length > 0 && (
          <section aria-label="Vehicle specialties" className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-red">What we focus on</span>
                <h2 className="text-3xl font-black uppercase mt-2">Vehicle Specialties</h2>
              </div>
              <p className="text-xs text-gray-500">Model ranges are our focus, not a fitment guarantee for every part.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {provider.specialties.map((item: { name: string; years: string; imageUrl: string; photoPageUrl?: string }) => (
                <article key={`${item.name}-${item.years}`} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                  <img src={item.imageUrl} alt={`${item.name} vehicle representative of the store specialty`} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">{item.years}</p>
                    <h3 className="text-xl font-black uppercase mt-1">{item.name}</h3>
                    <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`${item.name} parts inquiry`)}`} className="inline-flex items-center gap-2 text-xs font-black uppercase mt-4 text-brand-dark hover:text-brand-red">Contact Seller <ArrowRight size={14} /></a>
                    {item.photoPageUrl && <a href={item.photoPageUrl} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-gray-400 mt-4 hover:underline">Vehicle photo source</a>}
                  </div>
                </article>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Vehicle photos illustrate the specialties. Product photos and condition appear on individual listings.</p>
          </section>
        )}

        {(provider.ownerName || provider.address || provider.phone || contactEmail) && (
          <section aria-label="Storefront contact details" className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-12">
            <h2 className="text-sm font-black uppercase mb-4">Storefront Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              {provider.ownerName && <p className="flex items-start gap-2"><UserRound size={17} className="shrink-0 text-brand-red" /><span><strong>Owner:</strong> {provider.ownerName}</span></p>}
              {provider.address && <p className="flex items-start gap-2"><MapPin size={17} className="shrink-0 text-brand-red" /><span><strong>Address:</strong> {provider.address}</span></p>}
              {provider.phone && <p className="flex items-start gap-2"><Phone size={17} className="shrink-0 text-brand-red" /><span><strong>Phone:</strong> {phoneLink ? <a href={`tel:${phoneLink}`} className="hover:underline">{provider.phone}</a> : provider.phone}</span></p>}
              {contactEmail && <p className="flex items-start gap-2"><Mail size={17} className="shrink-0 text-brand-red" /><span><strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="hover:underline break-all">{contactEmail}</a></span></p>}
            </div>
          </section>
        )}

        {provider.showcaseItems && provider.showcaseItems.length > 0 && (
          <section aria-label="Featured parts" className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-red">{provider.storeName}</span>
                <h2 className="text-3xl font-black uppercase mt-2">Featured Parts</h2>
              </div>
              <p className="text-xs text-gray-500 max-w-sm">Ask Joseph about availability, exact fitment, condition, and a current price before ordering.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {provider.showcaseItems.map((item: { title: string; vehicle: string; years: string; category: string; description: string; priceNote?: string; conditionNote?: string; imageUrl: string; photoPageUrl?: string }) => (
                <article key={`${item.vehicle}-${item.title}`} className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm flex flex-col">
                  <div className="relative h-52 bg-gray-100">
                    <img src={item.imageUrl} alt={`${item.category} imagery for ${item.vehicle}`} className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-3 left-3 bg-brand-dark/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{item.vehicle}</span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">{item.category} · {item.years}</p>
                    <h3 className="text-lg font-black uppercase mt-2 leading-tight">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed flex-1">{item.description}</p>
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 mt-5 pt-4 text-xs">
                      <div><span className="block text-gray-400 font-bold uppercase text-[10px]">Price</span><span className="font-bold">{item.priceNote || 'Ask seller'}</span></div>
                      <div><span className="block text-gray-400 font-bold uppercase text-[10px]">Condition</span><span className="font-bold">{item.conditionNote || 'Confirm with seller'}</span></div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3">Fitment depends on the exact part and vehicle configuration.</p>
                    <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`${item.vehicle} ${item.title} inquiry`)}`} className="inline-flex items-center justify-center gap-2 mt-5 bg-brand-dark text-white px-5 py-3 rounded-xl text-xs font-black uppercase hover:bg-brand-red transition-colors">Contact Seller <ArrowRight size={15} /></a>
                    {item.photoPageUrl && <a href={item.photoPageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 mt-3 hover:underline">Photo source</a>}
                  </div>
                </article>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">Photos show part categories and are not photos of a specific item offered for sale. Confirm details with Joseph before purchasing.</p>
          </section>
        )}

        <section className="pb-24">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <SectionHeading title="Available to Buy" subtitle={`${provider.storeName}'s Confirmed Stock`} />

            {categories.length > 1 && <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search in this store..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-red transition-all"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={localCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm appearance-none focus:ring-2 focus:ring-brand-red transition-all cursor-pointer font-bold uppercase text-[10px] tracking-widest"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>}
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {currentItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>

          {providerProducts.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-10 md:p-16 text-center">
              <PackageSearch size={38} className="mx-auto text-brand-red mb-4" />
              <h3 className="text-xl font-black uppercase">{localSearch || localCategory !== 'All' ? 'No matching parts found' : 'Contact Joseph for availability'}</h3>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">{localSearch || localCategory !== 'All' ? 'Try another search or ask about a specific part.' : 'The featured parts above are available for inquiry. Online checkout opens for an item after its stock, price, condition, and fitment are confirmed.'}</p>
              {contactEmail && <a href={`mailto:${contactEmail}?subject=${encodeURIComponent('CrankOver parts availability inquiry')}`} className="inline-flex items-center gap-2 mt-6 bg-brand-dark text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-brand-red">Contact Seller <ArrowRight size={16} /></a>}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                disabled={currentPageNum === 1}
                onClick={() => setCurrentPageNum(p => p - 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPageNum(i + 1)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm border transition-all ${currentPageNum === i + 1 ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-900/20' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPageNum === totalPages}
                onClick={() => setCurrentPageNum(p => p + 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>
      </div >
    </div >
  );
};
