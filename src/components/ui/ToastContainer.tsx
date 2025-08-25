'use client';

import React from 'react';
import { Toast, ToastType, ToastItem } from './Toast';

export { Toast };
export type { ToastItem, ToastType };

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  console.log('ToastContainer render:', { toastsCount: toasts.length, toasts });
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 80}px)`,
          }}
        >
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={onRemoveToast}
          />
        </div>
      ))}
    </div>
  );
}
