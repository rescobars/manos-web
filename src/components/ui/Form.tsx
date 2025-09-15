'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

// Tipos de inputs disponibles
export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file';

// Reglas de validación
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null; // Retorna mensaje de error o null si es válido
}

// Configuración de campo
export interface FieldConfig {
  name: string;
  label: string;
  type: InputType;
  placeholder?: string;
  defaultValue?: any;
  validation?: ValidationRule;
  options?: Array<{ value: string | number; label: string }>; // Para select y radio
  accept?: string; // Para file input
  multiple?: boolean; // Para select y file
  disabled?: boolean;
  className?: string;
  description?: string; // Texto de ayuda
}

// Estado del formulario
export interface FormState {
  [key: string]: any;
}

// Errores del formulario
export interface FormErrors {
  [key: string]: string;
}

// Props del FormTemplate
export interface FormTemplateProps {
  fields: FieldConfig[];
  onSubmit: (data: FormState) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  validateOnChange?: boolean;
  children?: ReactNode; // Para contenido personalizado adicional
}

// Hook personalizado para validación
const useFormValidation = () => {
  const validateField = useCallback((value: any, rule: ValidationRule): string | null => {
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'Este campo es requerido';
    }

    // Si el campo está vacío y no es requerido, no validar más reglas
    if (!value && !rule.required) return null;

    const stringValue = String(value);

    // MinLength validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Debe tener al menos ${rule.minLength} caracteres`;
    }

    // MaxLength validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `No puede exceder ${rule.maxLength} caracteres`;
    }

    // Min/Max for numbers
    if (rule.min !== undefined && Number(value) < rule.min) {
      return `El valor mínimo es ${rule.min}`;
    }

    if (rule.max !== undefined && Number(value) > rule.max) {
      return `El valor máximo es ${rule.max}`;
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return 'Ingresa un email válido';
      }
    }

    // Phone validation (formato básico)
    if (rule.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
        return 'Ingresa un teléfono válido';
      }
    }

    // URL validation
    if (rule.url) {
      try {
        new URL(stringValue);
      } catch {
        return 'Ingresa una URL válida';
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'El formato ingresado no es válido';
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, []);

  const validateForm = useCallback((data: FormState, fields: FieldConfig[]): FormErrors => {
    const errors: FormErrors = {};

    fields.forEach(field => {
      if (field.validation) {
        const error = validateField(data[field.name], field.validation);
        if (error) {
          errors[field.name] = error;
        }
      }
    });

    return errors;
  }, [validateField]);

  return { validateField, validateForm };
};

// Componente de campo individual
const FormField: React.FC<{
  field: FieldConfig;
  value: any;
  error?: string;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
}> = ({ field, value, error, onChange, onBlur }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let newValue: any = e.target.value;

    // Procesar valores según el tipo
    switch (field.type) {
      case 'number':
        newValue = e.target.value === '' ? '' : Number(e.target.value);
        break;
      case 'checkbox':
        newValue = (e.target as HTMLInputElement).checked;
        break;
      case 'file':
        const fileInput = e.target as HTMLInputElement;
        newValue = field.multiple ? Array.from(fileInput.files || []) : fileInput.files?.[0] || null;
        break;
      default:
        newValue = e.target.value;
    }

    onChange(field.name, newValue);
  };

  const renderInput = () => {
    const baseClassName = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
    } ${field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${field.className || ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            onBlur={() => onBlur?.(field.name)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={`${baseClassName} h-24 resize-none`}
          />
        );

      case 'select':
        return (
          <select
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            onBlur={() => onBlur?.(field.name)}
            disabled={field.disabled}
            multiple={field.multiple}
            className={baseClassName}
          >
            {!field.multiple && <option value="">Selecciona una opción...</option>}
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={field.name}
              checked={!!value}
              onChange={handleChange}
              onBlur={() => onBlur?.(field.name)}
              disabled={field.disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  onBlur={() => onBlur?.(field.name)}
                  disabled={field.disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            onChange={handleChange}
            onBlur={() => onBlur?.(field.name)}
            disabled={field.disabled}
            accept={field.accept}
            multiple={field.multiple}
            className={baseClassName}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              onBlur={() => onBlur?.(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={`${baseClassName} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            onBlur={() => onBlur?.(field.name)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={baseClassName}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {field.description && (
          <p className="text-sm text-gray-500">{field.description}</p>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {field.type !== 'radio' && (
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {field.type === 'radio' && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
          </legend>
          {renderInput()}
        </fieldset>
      )}
      {field.type !== 'radio' && renderInput()}
      {field.description && (
        <p className="text-sm text-gray-500">{field.description}</p>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Componente principal del FormTemplate
export const FormTemplate: React.FC<FormTemplateProps> = ({
  fields,
  onSubmit,
  onCancel,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  title,
  subtitle,
  loading = false,
  disabled = false,
  className = '',
  validateOnChange = false,
  children
}) => {
  const [formData, setFormData] = useState<FormState>(() => {
    const initialData: FormState = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || '';
    });
    return initialData;
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const { validateField, validateForm } = useFormValidation();

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validar en tiempo real si está habilitado
    if (validateOnChange && touchedFields.has(name)) {
      const field = fields.find(f => f.name === name);
      if (field?.validation) {
        const error = validateField(value, field.validation);
        setErrors(prev => ({
          ...prev,
          [name]: error || ''
        }));
      }
    }
  }, [fields, validateField, validateOnChange, touchedFields]);

  const handleFieldBlur = useCallback((name: string) => {
    setTouchedFields(prev => new Set(prev).add(name));
    
    const field = fields.find(f => f.name === name);
    if (field?.validation) {
      const error = validateField(formData[name], field.validation);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
  }, [fields, formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || disabled) return;

    // Validar todo el formulario
    const formErrors = validateForm(formData, fields);
    setErrors(formErrors);

    // Si hay errores, no enviar
    if (Object.keys(formErrors).some(key => formErrors[key])) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const hasErrors = Object.keys(errors).some(key => errors[key]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {fields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            error={errors[field.name]}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        ))}

        {children}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || disabled || hasErrors}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading || disabled || hasErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
            )}
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTemplate;
