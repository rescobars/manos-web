'use client';

import React from 'react';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { LucideIcon } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  icon?: LucideIcon;
  step?: string;
  min?: number;
  disabled?: boolean;
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  className = '',
  step,
  min,
  disabled = false
}: InputFieldProps) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
            error ? 'text-red-400' : 'text-gray-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          min={min}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-200'
          }`}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  rows = 3,
  disabled = false
}: TextAreaFieldProps) {
  const textareaId = `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className={className}>
      <label htmlFor={textareaId} className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <TextArea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
            : 'border-gray-200'
        }`}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  className = '',
  disabled = false
}: SelectFieldProps) {
  const { colors } = useDynamicTheme();
  const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className={className}>
      <label 
        htmlFor={selectId} 
        className="block text-sm font-semibold theme-text-primary mb-3"
        style={{ color: colors.textPrimary }}
      >
        {label}
        {required && <span className="theme-error ml-1" style={{ color: colors.error }}>*</span>}
      </label>
      
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
          error 
            ? 'focus:border-red-500 focus:ring-red-200' 
            : ''
        }`}
        style={{
          backgroundColor: colors.background3,
          borderColor: error ? colors.error : colors.border,
          color: colors.textPrimary,
        }}
      >
        {placeholder && (
          <option 
            value="" 
            disabled
            style={{
              backgroundColor: colors.background3,
              color: colors.textMuted
            }}
          >
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{
              backgroundColor: colors.background3,
              color: colors.textPrimary
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-2 text-sm theme-error flex items-center gap-2" style={{ color: colors.error }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.error }}></span>
          {error}
        </p>
      )}
    </div>
  );
}
