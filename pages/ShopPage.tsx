import React, { useState, useMemo, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useNavigation } from '../context/NavigationContext';
import { Filter, ChevronRight, ShoppingCart, ExternalLink, Search, Info, Check, X, Mail, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { PRODUCT_CATEGORIES } from '../data/productCategories';

const ITEMS_PER_PAGE = 9;

import { Link, useSearchParams } from 'react-router-dom';

export const ShopPage: React.FC = () => {
  const { products: allProducts, searchQuery, setSearchQuery, navigateTo, addToCart } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'All';
  const setSelectedCategory = (category: string) => {
    setSearchParams(category === 'All' ? {} : { category });
    setCurrentPageNum(1);
  };
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  // Use server-side search query
  const searchResults = useQuery(api.products.search, {
    query: searchQuery,
    category: selectedCategory === 'All' ? undefined : selectedCategory
  });

  const productsToDisplay = searchResults || [];

  // Extract ID from window location
  const pathParts = window.location.pathname.split('/');
  const productId = pathParts[pathParts.length - 1];
  const product = useMemo(() => allProducts.find(p => (p as any)._id === productId || p.id === productId), [allProducts, productId]);
  const seller = useQuery(api.providers.getBySlug, { slug: product?.providerSlug || '' });
  const sellerEmail = seller?.contactEmail || seller?.email;

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set([...PRODUCT_CATEGORIES, ...allProducts.map(p => p.category)]))];
  }, [allProducts]);

  const totalPages = Math.ceil(productsToDisplay.length / ITEMS_PER_PAGE);
  const currentItems = productsToDisplay.slice((currentPageNum - 1) * ITEMS_PER_PAGE, currentPageNum * ITEMS_PER_PAGE);

  const handleAddToCart = (p: any) => {
    addToCart(p);
    setShowCartSuccess(true);
  };

  if (productId && product && window.location.pathname.includes('/shop/')) {
    const images = product.images || [];
    const mainImage = images[activeImageIndex]?.url;

    return (
      <div className="bg-white min-h-screen pb-24">
        <div className="bg-brand-dark py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-gray-400 mb-4">
              <Link to="/" className="hover:text-white transition-colors">Home</Link> <ChevronRight size={12} />
              <Link to="/shop" className="hover:text-white transition-colors">Shop</Link> <ChevronRight size={12} />
              <span className="text-white truncate">{product.name}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-4">
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-gray-50 rounded-3xl p-12 flex items-center justify-center border overflow-hidden"
              >
                {mainImage ? <img src={mainImage} alt={product.name} className="w-full h-full object-contain" /> : <Package size={64} className="text-gray-300 m-auto" aria-label="No part photo" />}
              </motion.div>
              {product.imageIsIllustrative && <p className="text-xs text-gray-500">Representative category photo; the shipped item may look different. Contact the seller for an actual-part photo before ordering.</p>}

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden bg-gray-50 p-2 ${activeImageIndex === idx ? 'border-brand-red' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <img src={img.url} className="w-full h-full object-contain" alt={`Thumbnail ${idx}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <span className="text-brand-red font-black uppercase text-[10px] mb-2 block">{product.category}</span>
                <h1 className="text-4xl font-black uppercase mb-4">{product.name}</h1>
                <span className="text-3xl font-black text-brand-dark">${product.price.toFixed(2)}</span>
                {!product.inStock && <p className="text-sm font-bold text-brand-red mt-2">Currently unavailable</p>}
              </div>

              <div className="prose prose-sm text-gray-600 max-w-none">
                <p className="leading-relaxed">{product.description}</p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center text-white font-black">{product.providerName.charAt(0)}</div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Sold By</p>
                    <Link to={`/store/${product.providerSlug}`} className="font-bold text-brand-dark hover:underline flex items-center gap-1">{product.providerName} <ExternalLink size={14} /></Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {product.inStock && <button onClick={() => { addToCart(product); navigateTo('checkout'); }} className="flex-1 bg-brand-red text-white py-4 rounded-xl font-black uppercase flex items-center justify-center gap-3 hover:bg-red-700 transition-colors">
                  <ShoppingCart size={20} /> Buy Now
                </button>}
                {sellerEmail && <a href={`mailto:${sellerEmail}?subject=${encodeURIComponent(`Question about ${product.name}`)}`} className="flex-1 border border-brand-dark text-brand-dark py-4 rounded-xl font-black uppercase flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"><Mail size={20} /> Contact Seller</a>}
                {product.inStock && <button onClick={() => handleAddToCart(product)} className="px-5 py-4 rounded-xl border border-gray-200 font-bold text-sm hover:bg-gray-50">Add to Cart</button>}
              </div>

              <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                {product.partNumber && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Part Number</p>
                    <p className="font-bold text-sm">{product.partNumber}</p>
                  </div>
                )}
                {product.castingNumber && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Casting Number</p>
                    <p className="font-bold text-sm">{product.castingNumber}</p>
                  </div>
                )}
                {product.condition && (
                  <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition</p><p className="font-bold text-sm">{product.condition}</p></div>
                )}
                {product.vinCompatibility && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Compatibility</p>
                    <p className="font-bold text-sm">{product.vinCompatibility}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showCartSuccess && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setShowCartSuccess(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 overflow-hidden border border-gray-100"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-red" />
                <button onClick={() => setShowCartSuccess(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20} /></button>

                <div className="text-center pt-4 pb-6">
                  <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50">
                    <Check size={28} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black uppercase text-brand-dark tracking-tight">Item Added</h3>
                  <p className="text-gray-500 font-medium text-sm mt-1">Part secured in build protocol.</p>
                </div>

                <div className="space-y-3">
                  <button onClick={() => navigateTo('checkout')} className="w-full bg-brand-red text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    <ShoppingCart size={16} /> View Cart
                  </button>
                  <button onClick={() => setShowCartSuccess(false)} className="w-full bg-gray-50 text-gray-600 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-gray-100 transition-all">
                    Continue Shopping
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-brand-dark py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-black uppercase tracking-tight">Marketplace</h1>
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory by name, part number, VIN..."
                className="w-full bg-white text-gray-900 py-3 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm overflow-x-auto w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Filter:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-brand-red text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults === undefined ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
                ))
              ) : currentItems.map(p => <ProductCard key={(p as any)._id || p.id} product={p} />)}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPageNum(i + 1)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm border ${currentPageNum === i + 1 ? 'bg-brand-red text-white border-brand-red' : 'bg-white border-gray-200'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {searchResults !== undefined && currentItems.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-400 font-black uppercase text-xl">No products found matching your search protocol</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="mt-4 text-brand-red font-bold uppercase text-xs hover:underline">Reset All Filters</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
