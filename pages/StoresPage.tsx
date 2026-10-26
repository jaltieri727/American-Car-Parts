
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Link } from 'react-router-dom';

export const StoresPage: React.FC = () => {
    const providers = useQuery(api.providers.listAll);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-brand-dark pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <span className="text-brand-red font-black uppercase tracking-[0.3em] text-xs mb-4 block">Independent Sellers</span>
                        <h1 className="text-5xl lg:text-7xl font-black text-white uppercase leading-none mb-6">
                            Seller <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-400">Storefronts</span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-xl italic">
                            Explore independent shops focused on classic auto parts. Check each listing for photos, condition, price, and vehicle fitment.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Stores Grid */}
            <div className="container mx-auto px-4 py-20">
                {!providers ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Network...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {providers.map((store, idx) => (
                            <motion.div
                                key={store._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full"
                            >
                                {/* Store Header/Logo */}
                                <div className="h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center p-12">
                                    {store.logoUrl ? (
                                        <img src={store.logoUrl} alt={store.storeName} className="max-w-full max-h-full object-contain filter group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-24 h-24 bg-brand-red rounded-2xl flex items-center justify-center text-white text-4xl font-black transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                            {store.storeName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>

                                {/* Store Info */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight group-hover:text-brand-red transition-colors">{store.storeName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="text-gray-500 text-xs font-bold uppercase">{store.location || 'Unknown Location'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-8 italic">
                                        {store.bio || 'Browse this seller’s parts and contact the shop with fitment questions.'}
                                    </p>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between py-4 border-y border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-gray-400">Inventory Status</span>
                                                <span className="text-sm font-bold text-brand-dark">{store.listingCount === 0 ? 'Listings coming soon' : `${store.listingCount} ${store.listingCount === 1 ? 'part' : 'parts'} listed`}</span>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/store/${store.storeSlug}`}
                                            className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 group-hover:bg-brand-red transition-all duration-300 shadow-xl shadow-gray-200 group-hover:shadow-brand-red/40"
                                        >
                                            Enter Storefront <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-gray-50 py-24">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto"
                    >
                        <h2 className="text-4xl font-black text-brand-dark uppercase mb-6">Want to list your garage?</h2>
                        <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                            Join our network of vintage parts sellers and reach restoration enthusiasts across the United States.
                        </p>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center gap-3 bg-brand-red text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-brand-red/20"
                        >
                            Launch Your Storefront <ExternalLink size={18} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
