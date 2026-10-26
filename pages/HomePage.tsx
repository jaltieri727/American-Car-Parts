import React from 'react';
import { Hero } from '../components/Hero';
import { VehicleSelector } from '../components/VehicleSelector';
import { SectionHeading } from '../components/SectionHeading';
import { ProductCard } from '../components/ProductCard';
import { PromoGrid } from '../components/PromoGrid';
import { BrandMarquee } from '../components/BrandMarquee';
import { GarageStories } from '../components/GarageStories';
import { ProtocolSection } from '../components/ProtocolSection';
import { ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const HomePage: React.FC = () => {
  const { navigateTo, products } = useNavigation();

  return (
    <main className="flex-grow bg-white">
      <Hero />
      <VehicleSelector />

      <section className="container mx-auto px-4 mb-16">
        <SectionHeading
          title="Auto Parts For All Model"
          subtitle="Featured Products"
          rightElement={
            <div className="flex gap-2">
              <button className="bg-brand-red text-white px-4 py-1.5 text-sm font-medium rounded" onClick={() => navigateTo('shop')}>All Parts</button>
            </div>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length > 0 ? products.slice(0, 4).map(product => (
            <ProductCard key={(product as any)._id} product={product} />
          )) : <div className="col-span-full p-12 text-center text-gray-500">New parts are coming soon.</div>}
        </div>
      </section>

      <PromoGrid />

      <section className="container mx-auto px-4 mb-20">
        <SectionHeading
          title="More Restoration Parts"
          subtitle="From the Shop"
          rightElement={
            <div className="flex gap-4 text-sm font-medium text-gray-500">
              <button className="text-brand-dark border-b-2 border-brand-dark pb-1">New Arrivals</button>
            </div>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(4, 12).map(product => (
            <ProductCard key={(product as any)._id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
         <div className="container mx-auto px-4 text-center mb-12">
           <h2 className="text-3xl font-bold text-gray-900 mb-4 uppercase">Weekly Top Categories</h2>
         </div>
         <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg">Wheels & Tires</h3>
               <button onClick={() => navigateTo('shop')} className="text-[10px] font-bold bg-brand-red text-white px-2 py-1 rounded flex items-center gap-1 uppercase">
                 View All <ArrowRight size={10} />
               </button>
             </div>
             <div className="flex items-center gap-4 relative overflow-hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {products.filter(p => p.category === 'Wheels & Tires').slice(0,5).map(p => (
                    <div key={(p as any)._id} className="flex-shrink-0 w-32 group cursor-pointer" onClick={() => navigateTo('shop', { id: (p as any)._id })}>
                      <div className="bg-gray-50 p-2 rounded mb-2 group-hover:bg-gray-100 transition-colors">
                         {p.images?.[0]?.url ? <img src={p.images[0].url} className="w-full h-24 object-contain" alt={p.name}/> : <Package className="mx-auto text-gray-300" aria-label="No part photo" />}
                      </div>
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-brand-red font-bold">${p.price}</p>
                    </div>
                  ))}
                </div>
             </div>
           </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg">Engine & Engine Parts</h3>
               <button onClick={() => navigateTo('shop')} className="text-[10px] font-bold border border-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1 uppercase">
                 View All <ArrowRight size={10} />
               </button>
             </div>
             <div className="grid grid-cols-3 gap-4">
                {products.filter(p => p.category === 'Engine & Engine Parts' || p.category === 'Engine Parts').slice(0,3).map(p => (
                  <div key={(p as any)._id} className="flex flex-col items-center text-center group cursor-pointer" onClick={() => navigateTo('shop', { id: (p as any)._id })}>
                    <div className="w-24 h-24 rounded-full bg-gray-50 mb-3 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                       {p.images?.[0]?.url ? <img src={p.images[0].url} className="w-16 h-16 object-contain" alt={p.name}/> : <Package className="text-gray-300" aria-label="No part photo" />}
                    </div>
                    <p className="text-xs font-semibold line-clamp-2">{p.name}</p>
                    <p className="text-xs text-brand-red font-bold">${p.price}</p>
                  </div>
                ))}
             </div>
           </div>
         </div>
      </section>

      <BrandMarquee />
      <ProtocolSection />
      <GarageStories />
    </main>
  );
};
