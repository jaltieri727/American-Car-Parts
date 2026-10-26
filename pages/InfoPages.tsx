import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, HelpCircle, Truck } from 'lucide-react';

const PageWrapper: React.FC<{ title: string, icon: any, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-50 min-h-screen pt-24 pb-32">
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-brand-dark p-12 text-white text-center">
          <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-6 transform -skew-x-12">
            <Icon size={32} className="skew-x-12"/>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">{title}</h1>
        </div>
        <div className="p-12 lg:p-20 prose prose-red max-w-none">
          {children}
        </div>
      </motion.div>
    </div>
  </div>
);

export const FAQPage = () => (
  <PageWrapper title="Frequently Asked Questions" icon={HelpCircle}>
    <div className="space-y-12">
      {[
        { q: "How do I list a part?", a: "To list a part, you must first register as a Provider. Once in your dashboard, use the 'New Listing' button to upload photos and specifications." },
        { q: "Is shipping included?", a: "Shipping is calculated at checkout and varies depending on the weight and dimensions of the part." },
        { q: "How do I get paid?", a: "Payments are processed through Stripe Connect. Once you've confirmed shipment, funds are released to your connected bank account." },
        { q: "What is your refund policy?", a: "Refunds are handled on a case-by-case basis between the buyer and seller. CrankOver provides mediation for authenticated parts." }
      ].map((item, i) => (
        <div key={i}>
          <h3 className="text-xl font-black uppercase text-brand-dark mb-4">{item.q}</h3>
          <p className="text-gray-600 leading-relaxed">{item.a}</p>
        </div>
      ))}
    </div>
  </PageWrapper>
);

export const PrivacyPage = () => (
  <PageWrapper title="Privacy Policy" icon={Shield}>
    <div className="space-y-8 text-gray-600">
      <p>Last Updated: October 2023</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you create an account, list a part, or make a purchase.</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">2. How We Use Information</h3>
      <p>We use your information to facilitate transactions, maintain your store domain, and provide customer support.</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">3. Data Security</h3>
      <p>We implement industry-standard security measures, including Stripe Connect for all financial transactions, to protect your data.</p>
    </div>
  </PageWrapper>
);

export const TermsPage = () => (
  <PageWrapper title="Terms of Service" icon={FileText}>
    <div className="space-y-8 text-gray-600">
      <h3 className="text-xl font-black uppercase text-brand-dark">1. Storefront Ownership</h3>
      <p>Providers own their inventory but agree to abide by the CrankOver authentication standards for all classic parts listed.</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">2. Platform Fees</h3>
      <p>Currently, CrankOver offers a $0/mo Pro Plan. We reserve the right to introduce transaction fees or subscription models in the future for new users.</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">3. User Conduct</h3>
      <p>All users agree to provide accurate descriptions, high-resolution photos, and honest communication during the trade process.</p>
    </div>
  </PageWrapper>
);

export const ShippingPage = () => (
  <PageWrapper title="Shipping Info" icon={Truck}>
    <div className="space-y-8 text-gray-600">
      <h3 className="text-xl font-black uppercase text-brand-dark">United States Only</h3>
      <p>Shipping is currently available to US addresses only. International shipping is not available.</p>
      <h3 className="text-xl font-black uppercase text-brand-dark">Shipping & Handling</h3>
      <p>Sellers arrange shipping and secure packaging. Confirm delivery details with the seller before purchasing large or heavy parts.</p>
    </div>
  </PageWrapper>
);
