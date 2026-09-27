import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Dock */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none select-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] shadow-2xl border backdrop-blur-md transition-all animate-in slide-in-from-top-3 fade-in duration-200 ${
              t.type === 'success'
                ? 'bg-[#151515] border-[#16845B]/50 text-[#F5F5F5]'
                : t.type === 'error'
                ? 'bg-[#151515] border-[#D64545]/50 text-[#F5F5F5]'
                : 'bg-[#151515] border-[#292929] text-[#F5F5F5]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#38A878] shrink-0 stroke-[2px]" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 stroke-[2px]" />
              )}
              {t.type === 'info' && (
                <Info className="w-4 h-4 text-[#FF5C35] shrink-0 stroke-[2px]" />
              )}
              <span className="text-[13px] font-medium leading-snug break-words">
                {t.message}
              </span>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-[#808080] hover:text-white rounded-full shrink-0 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 stroke-[2px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
