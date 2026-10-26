import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, rightElement }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-4 border-b border-gray-100">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-brand-red font-bold uppercase tracking-wider text-xs">{subtitle}</span>
          <span className="h-[2px] w-8 bg-brand-red"></span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      </div>
      {rightElement && (
        <div className="mt-4 md:mt-0">
          {rightElement}
        </div>
      )}
    </div>
  );
};