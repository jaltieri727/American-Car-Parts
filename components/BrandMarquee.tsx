import React from 'react';
import { motion } from 'framer-motion';

const BRANDS = [
  'CHEVROLET',
  'PORSCHE',
  'JAGUAR',
  'FERRARI',
  'DODGE',
  'PLYMOUTH',
  'MERCEDES',
  'FORD'
];

export const BrandMarquee: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F5F2] py-12 overflow-hidden border-t border-b border-gray-100 relative">
      <div className="flex whitespace-nowrap">
        <motion.div
          className="flex gap-24 items-center pl-24"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 40,
            repeat: Infinity
          }}
        >
          {/* Repeat enough times to ensure smooth infinite scroll on wide screens */}
          {[...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
            <h2
              key={i}
              className="text-4xl md:text-6xl font-black text-[#dcdcd9] uppercase tracking-tighter hover:text-brand-red transition-colors duration-300 cursor-pointer select-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {brand}
            </h2>
          ))}
        </motion.div>
      </div>
    </div>
  );
};