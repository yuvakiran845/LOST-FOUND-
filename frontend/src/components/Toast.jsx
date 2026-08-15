import { useState, useCallback } from 'react';

/**
 * useToast — simple toast hook.
 *
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('Item deleted!', 'success');
 *   // In JSX: <Toast toast={toast} />
 */
export function useToast() {
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, showToast };
}

/**
 * Toast — renders a toast notification.
 *
 * @param {{ message: string, type: 'success'|'error'|'info' }} toast
 */
function Toast({ toast }) {
  if (!toast) return null;

  const styles = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-blue-600',
  };

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${styles[toast.type] || styles.info}`}
      role="alert"
    >
      <span className="font-bold">{icons[toast.type]}</span>
      {toast.message}
    </div>
  );
}

export default Toast;
