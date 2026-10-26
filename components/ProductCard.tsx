import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, Share2, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, navigateTo } = useNavigation();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/shop/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const thumbnail = product.images?.[0]?.url;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-gray-100 rounded-lg p-4 group relative hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => navigateTo('shop', { id: product.id })}
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.discount && (
          <span className="bg-brand-yellow text-brand-dark text-[10px] font-bold px-2 py-1 rounded">
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">NEW</span>
        )}
      </div>

      <button
        onClick={handleShare}
        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-brand-red bg-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
      >
        <Share2 size={16} />
      </button>

      <div className="relative h-48 mb-4 overflow-hidden rounded bg-gray-50 flex items-center justify-center">
        {thumbnail ? <img src={thumbnail} alt={product.name} className="w-full h-full object-contain mix-blend-multiply p-4 group-hover:scale-110 transition-transform duration-500" /> : <Package size={38} className="text-gray-300" aria-label="No part photo" />}
        {product.imageIsIllustrative && <span className="absolute bottom-2 left-2 bg-white/95 text-gray-600 px-2 py-1 rounded text-[9px] font-bold uppercase">Representative photo</span>}
        {product.inStock && <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} aria-label={`Add ${product.name} to cart`} className="bg-brand-red text-white p-3 rounded-full shadow-lg"><ShoppingCart size={18} /></button>
        </div>}
      </div>

      <div className="space-y-2">
        {(product.reviewsCount ?? product.reviews) > 0 && <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className={`${i < product.rating ? 'fill-brand-yellow text-brand-yellow' : 'text-gray-200'}`} />
          ))}
        </div>}
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 min-h-[40px] uppercase">{product.name}</h3>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{product.category}</p>
        {product.condition && <p className="text-xs text-gray-600">Condition: {product.condition}</p>}
        {product.vinCompatibility && <p className="text-xs text-gray-600 line-clamp-1">Fits: {product.vinCompatibility}</p>}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-brand-red text-lg">${product.price.toFixed(2)}</span>
          {product.oldPrice && <span className="text-xs text-gray-400 line-through">${product.oldPrice.toFixed(2)}</span>}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); navigateTo('shop', { id: product.id }); }} className="w-full bg-brand-dark text-white rounded-lg py-2.5 text-xs font-black uppercase hover:bg-brand-red">{product.inStock ? 'View & Buy' : 'View Part'}</button>
      </div>
    </motion.div>
  );
};
