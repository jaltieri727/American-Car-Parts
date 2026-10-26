import React from 'react';
import { Mail, ChevronDown } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <div className="bg-gray-100 text-xs text-gray-600 border-b border-gray-200 py-2 hidden md:block">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <p>Hi! Welcome to CrankOver online store.</p>
        <div className="flex items-center space-x-6">
          <a href="mailto:altieri.joey@gmail.com" className="flex items-center gap-2 hover:text-brand-red transition-colors">
            <Mail size={14} /> Email: altieri.joey@gmail.com
          </a>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-brand-red transition-colors">FAQ</a>
            <a href="/contact" className="hover:text-brand-red transition-colors">Contact Us</a>
            <div className="flex items-center gap-1 cursor-pointer hover:text-brand-red transition-colors">
              English <ChevronDown size={12} />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-brand-red transition-colors">
              USD <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
