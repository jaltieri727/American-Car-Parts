import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    id: '01',
    label: 'REGISTER',
    title: 'CLAIM YOUR DOMAIN',
    description: 'Secure your unique store URL and upload your business credentials.',
    requiresAuth: true // Marker for logic
  },
  {
    id: '02',
    label: 'LIST',
    title: 'ADD YOUR INVENTORY',
    description: 'Use our high-precision forms to list parts with casting numbers and photos.'
  },
  {
    id: '03',
    label: 'CONNECT',
    title: 'LINK STRIPE',
    description: 'Connect your bank account to receive 100% of your sales revenue.'
  },
  {
    id: '04',
    label: 'SELL',
    title: 'GO LIVE',
    description: 'Publish your storefront and reach enthusiasts across the United States.'
  }
];

import { useNavigation } from '../context/NavigationContext';

export const ProtocolSection: React.FC = () => {
  const { user } = useNavigation();

  return (
    <section className="bg-[#EAE9E4] py-24 border-t border-gray-200">
      <div className="container mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-brand-red font-bold uppercase tracking-[0.2em] text-sm mb-4 block"
          >
            The Protocol to Business Owners
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-brand-dark uppercase tracking-tight"
          >
            From Garage To Market
          </motion.h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.filter(step => !user || step.id !== '01').map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className="bg-[#F5F5F2] rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-[#e0dfd8]"
            >
              {/* Step Number Bubble */}
              <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center text-white text-xs font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                {step.id}
              </div>

              {/* Content */}
              <span className="text-brand-red font-bold text-xs uppercase tracking-wider block mb-2">
                {step.label}
              </span>
              <h3 className="text-xl font-black text-brand-dark mb-4 uppercase leading-tight">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                {step.description}
              </p>

              {/* Decorative Background Fade */}
              <div className="absolute -right-4 -bottom-4 text-[100px] font-black text-black/[0.03] leading-none select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                {step.id}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
