import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        const bg =
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100'
            : toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100'
            : 'bg-sky-50 border-sky-200 text-sky-900 shadow-sky-100';

        const Icon =
          toast.type === 'error'
            ? AlertCircle
            : toast.type === 'success'
            ? CheckCircle2
            : Info;

        const iconColor =
          toast.type === 'error'
            ? 'text-rose-600'
            : toast.type === 'success'
            ? 'text-emerald-600'
            : 'text-sky-600';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all animate-bounce-subtle backdrop-blur-md ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-bold mb-0.5">{toast.title}</div>}
              <div className="text-xs leading-relaxed opacity-90">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
