
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const ENGINES_BY_MODEL: Record<string, string[]> = {
  Mustang: ['289 V8', '302 V8', '351 V8', '390 V8', 'Other'],
  Camaro: ['250 I6', '302 V8', '350 V8', '396 V8', 'Other'],
  Corvette: ['327 V8', '350 V8', '427 V8', '454 V8', 'Other'],
  Other: ['Other'],
};

export const VehicleSelector: React.FC = () => {
  const { setSearchQuery, navigateTo } = useNavigation();
  const [selections, setSelections] = useState({
    model: '',
    body: '',
    year: '',
    engine: ''
  });

  const handleSearch = () => {
    const query = Object.values(selections)
      .filter(v => v && v !== 'Other')
      .join(' ');

    setSearchQuery(query);
    navigateTo('shop');
  };

  const updateSelection = (key: keyof typeof selections, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value, ...(key === 'model' ? { engine: '', year: '' } : {}) }));
  };

  return (
    <div className="relative z-30 -mt-10 mb-16 container mx-auto px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          Select Your Vehicle Parts
          <span className="h-1 w-12 bg-brand-red inline-block rounded-full"></span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SelectInput
            placeholder="Select Model"
            options={['Corvette', 'Mustang', 'Camaro', 'Other']}
            value={selections.model}
            onChange={(v) => updateSelection('model', v)}
          />
          <SelectInput
            placeholder="Select Body"
            options={['Coupe', 'Fastback', 'Convertible', 'Other']}
            value={selections.body}
            onChange={(v) => updateSelection('body', v)}
          />
          <SelectInput
            placeholder="Select Year"
            options={[...Array.from({ length: 9 - (selections.model === 'Camaro' ? 2 : 0) }, (_, i) => String((selections.model === 'Camaro' ? 1967 : 1965) + i)), 'Other']}
            value={selections.year}
            onChange={(v) => updateSelection('year', v)}
          />
          <SelectInput
            placeholder="Select Engine"
            options={ENGINES_BY_MODEL[selections.model] || []}
            value={selections.engine}
            onChange={(v) => updateSelection('engine', v)}
          />

          <button
            onClick={handleSearch}
            className="bg-brand-dark text-white font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors h-12"
          >
            Search Parts
            <Search size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SelectInput: React.FC<{
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void
}> = ({ placeholder, options, value, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-brand-red transition-colors cursor-pointer h-12"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <ChevronDown size={16} />
    </div>
  </div>
);
