"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextValue {
  addToast: (type: Toast["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

const typeConfig = {
  success: {
    borderClass: "border-l-4 border-l-green-500",
    Icon: CheckCircleIcon,
    iconClass: "text-green-500",
  },
  error: {
    borderClass: "border-l-4 border-l-red-500",
    Icon: ExclamationCircleIcon,
    iconClass: "text-red-500",
  },
  info: {
    borderClass: "border-l-4 border-l-blue-500",
    Icon: InformationCircleIcon,
    iconClass: "text-blue-500",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const { borderClass, Icon, iconClass } = typeConfig[toast.type];

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(enterFrame);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      role="alert"
      className={[
        "rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px] max-w-[420px]",
        "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700",
        borderClass,
        "transition-all duration-200 ease-out",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
      ].join(" ")}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconClass}`} />
      <p className="flex-1 text-sm text-gray-900 dark:text-slate-100 line-clamp-2">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: Toast["type"], message: string) => {
      const id = crypto.randomUUID();

      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        if (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer !== undefined) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
