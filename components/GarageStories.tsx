import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export const GarageStories: React.FC = () => {
  const testimonials = useQuery(api.testimonials.list) || [];

  return (
    <section className="bg-[#111827] py-24 text-white overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 flex flex-col justify-center">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black uppercase leading-tight mb-6"
            >
              Garage <span className="text-brand-red">Stories</span>
            </motion.h2>
            <div className="h-px w-full bg-gray-700 mb-8"></div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg leading-relaxed font-light"
            >
              See how CrankOver is changing the way the world restores history, one part at a time.
            </motion.p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.length > 0 ? testimonials.map((item: any, idx: number) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + (idx * 0.2) }}
                className="bg-[#1F2937] p-10 rounded-sm relative hover:bg-[#2d3748] transition-all border border-gray-800"
              >
                <Quote className="text-brand-red mb-6 w-10 h-10 fill-brand-red stroke-none" />
                <p className="text-gray-300 italic mb-8 min-h-[80px] leading-relaxed">"{item.text}"</p>
                <div className="flex items-center gap-4 border-t border-gray-700 pt-6">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm tracking-wide">{item.name}</h4>
                    <span className="text-brand-red text-[10px] font-bold uppercase tracking-widest">{item.role}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <p className="text-gray-500 font-bold uppercase tracking-widest">Awaiting stories...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};