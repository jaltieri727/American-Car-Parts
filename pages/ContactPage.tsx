import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin } from 'lucide-react';

const supportEmail = 'altieri.joey@gmail.com';

export const ContactPage: React.FC = () => (
  <main className="bg-white min-h-screen">
    <div className="bg-brand-dark py-24 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-6">
          Get In <span className="text-brand-red">Touch</span>
        </motion.h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto">For help with an order, email us directly. Please include your order number if you have one.</p>
      </div>
    </div>

    <div className="container mx-auto px-4 py-16 max-w-4xl grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
        <Mail className="text-brand-red mb-5" size={32} />
        <h2 className="font-black uppercase mb-2">Order Support</h2>
        <a href={`mailto:${supportEmail}?subject=CrankOver%20Order%20Support`} className="text-brand-red font-bold break-all hover:underline">{supportEmail}</a>
        <p className="text-gray-500 text-sm mt-4">Email Joseph for questions about your order.</p>
      </div>
      <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
        <MapPin className="text-brand-red mb-5" size={32} />
        <h2 className="font-black uppercase mb-2">Shop Address</h2>
        <address className="not-italic text-gray-700 font-semibold">12110 65th Ln N<br />Largo, FL 33773</address>
      </div>
    </div>
  </main>
);
