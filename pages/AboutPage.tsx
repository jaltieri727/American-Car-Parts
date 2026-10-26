import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, History, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-brand-dark overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black text-white mb-6 uppercase tracking-tighter"
          >
            Preserving <span className="text-brand-red">History</span> <br />One Part At A Time
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            CrankOver was born in a grease-stained garage from a simple realization:
            finding authentic classic parts shouldn't be a treasure hunt.
          </motion.p>
        </div>
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Background" />
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-brand-red font-bold uppercase tracking-widest text-sm mb-4 block">Our Origin</span>
              <h2 className="text-4xl font-black mb-8 uppercase leading-tight">Built by Enthusiasts,<br />For Enthusiasts</h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  In 2023, we saw that the vertical SaaS landscape was leaving the automotive restoration industry behind.
                  Sellers were stuck on generic platforms that didn't understand the nuances of VIN compatibility,
                  casting numbers, or the sheer rarity of a 1968 HEMI carburetor.
                </p>
                <p>
                  We built CrankOver to give every salvage yard owner, every meticulous collector, and every specialty
                  mechanic the tools to compete in the digital age. A "Business-in-a-Box" that honors the legacy of
                  the vehicles we love.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-brand-red rounded-2xl rotate-3 absolute inset-0 opacity-10"></div>
              <img
                src="https://img.freepik.com/free-photo/mechanic-repairing-car-workshop_329181-11827.jpg?semt=ais_hybrid&w=740&q=80"
                className="rounded-2xl shadow-2xl relative z-10"
                alt="Garage work"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Target, title: "Precision", text: "We prioritize exact compatibility data to ensure every part fits." },
              { icon: Users, title: "Community", text: "Connecting a global network of restoration experts and owners." },
              { icon: History, title: "Legacy", text: "Protecting the history of the automobile for future generations." },
              { icon: ShieldCheck, title: "Integrity", text: "Transparent pricing with zero hidden fees for our sellers." }
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-brand-red mb-6"><v.icon size={40} /></div>
                <h3 className="font-black text-xl mb-3 uppercase">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};