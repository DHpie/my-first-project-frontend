'use client';

import { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from 'cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  autoClose: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info', autoClose = true) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, autoClose }]);

    if (autoClose) {
      const duration = type === 'warning' ? 2000 : 3000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-card border-border text-foreground',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-accent/10 border-accent/30 text-foreground',
  info: 'bg-card border-border text-foreground',
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg transition-opacity',
            typeStyles[toast.type],
          )}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className="text-sm">{toast.message}</span>
          {!toast.autoClose && (
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 shrink-0 rounded p-0.5 hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
