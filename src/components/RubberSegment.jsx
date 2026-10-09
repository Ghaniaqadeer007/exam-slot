import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * RubberSegment Component (React Bits Inspired)
 * Segmented control toggle with elastic rubber-band thumb physics.
 * Supports: Day, Week, Month, Year views.
 */
export default function RubberSegment({
  options = ['Day', 'Week', 'Month', 'Year'],
  value = 'Day',
  onChange,
  className = ''
}) {
  const [selected, setSelected] = useState(value);

  const handleSelect = (opt) => {
    setSelected(opt);
    if (onChange) onChange(opt);
  };

  return (
    <div className={`inline-flex items-center p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 shadow-inner ${className}`}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={`relative px-4 py-2 text-xs sm:text-sm font-bold tracking-wide rounded-xl transition-colors duration-200 focus:outline-none z-10 ${
              isSelected ? 'text-white' : 'text-gray-600 hover:text-burgundy-900'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="rubber-thumb"
                className="absolute inset-0 bg-gradient-to-r from-burgundy-700 to-burgundy-800 rounded-xl shadow-md shadow-burgundy-900/20 z-[-1]"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 26,
                  mass: 0.8
                }}
              />
            )}
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
