'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, disabled = false, className = '' }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
        ${checked 
          ? 'bg-blue-600 border-blue-600 text-white' 
          : 'bg-white border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {checked && <Check className="w-3 h-3" />}
    </button>
  );
}
