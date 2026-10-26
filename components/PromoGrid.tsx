import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const specialties = [
  { name: 'Ford Mustang', years: '1965–1973', image: 'https://images.unsplash.com/photo-1759832014878-3ca69e15c79e?auto=format&fit=crop&w=900&h=600&q=80' },
  { name: 'Chevrolet Corvette', years: '1967–2015', image: 'https://images.unsplash.com/photo-1759831766602-84834f223fcc?auto=format&fit=crop&w=900&h=600&q=80' },
  { name: 'Chevrolet Camaro', years: '1968–1969', image: 'https://images.unsplash.com/photo-1584751092539-fa97e9f4e95d?auto=format&fit=crop&w=900&h=600&q=80' },
];

export const PromoGrid: React.FC = () => (
  <section className="container mx-auto px-4 py-12" aria-label="Shop by vehicle">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {specialties.map((vehicle) => (
        <motion.div key={vehicle.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative min-h-[260px] rounded-xl overflow-hidden bg-brand-dark text-white">
          <img src={vehicle.image} alt={`${vehicle.name} vehicle`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">{vehicle.years}</span>
            <h3 className="text-2xl font-black uppercase mt-1">{vehicle.name}</h3>
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-bold uppercase mt-4 hover:text-brand-yellow">Browse Parts <ArrowRight size={16} /></Link>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);
