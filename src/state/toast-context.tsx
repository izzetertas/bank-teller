'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const TOAST_DURATION_MS = 3000;

/** Oldest toasts are dropped beyond this, so the stack never buries the page. */
const MAX_VISIBLE_TOASTS = 3;

interface Toast {
  readonly id: string;
  readonly message: string;
}

export interface ToastApi {
  /** Shows a transient success notification; it auto-dismisses after a few seconds. */
  showToast(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const dismiss = useCallback((id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string): void => {
      const id = crypto.randomUUID();
      setToasts((current) =>
        [...current, { id, message }].slice(-MAX_VISIBLE_TOASTS),
      );
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="toast"
            onClick={() => dismiss(toast.id)}
            title="Dismiss"
          >
            <span className="toast-icon" aria-hidden="true">
              ✓
            </span>
            <span>{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return api;
}
