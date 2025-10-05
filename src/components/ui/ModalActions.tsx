'use client';

import React from 'react';
import { Button } from './Button';
import { Loader2 } from 'lucide-react';

interface ModalActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitText: string;
  loading?: boolean;
  loadingText?: string;
  cancelText?: string;
  submitIcon?: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export function ModalActions({
  onCancel,
  onSubmit,
  submitText,
  loading = false,
  loadingText = 'Guardando...',
  cancelText = 'Cancelar',
  submitIcon,
  disabled = false,
  variant = 'default'
}: ModalActionsProps) {
  const getSubmitButtonStyles = () => {
    if (variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl';
  };

  return (
    <div className="flex justify-end gap-4 pt-6 border-t theme-divider">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading || disabled}
        className="px-6 py-3 border-2 theme-border hover:theme-border hover:theme-bg-2 theme-text-primary hover:theme-text-primary rounded-xl transition-all duration-200"
      >
        {cancelText}
      </Button>
      
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={loading || disabled}
        className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 ${getSubmitButtonStyles()}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {submitIcon}
            {submitText}
          </>
        )}
      </Button>
    </div>
  );
}
