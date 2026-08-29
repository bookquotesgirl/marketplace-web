import { useEffect } from 'react';

const TONES = {
  default: 'bg-ink text-white',
  error: 'bg-crimson text-white',
  success: 'bg-forest text-white',
};

// Transient message pinned to the bottom of the viewport.
// - `variant`: 'default' | 'error' | 'success' (styling + a11y role only).
// - `onDismiss` + `duration`: when provided, the toast auto-hides after `duration` ms.
export default function Toast({ show, children, variant = 'default', onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!show || !onDismiss) return undefined;
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [show, onDismiss, duration, children]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role={variant === 'error' ? 'alert' : 'status'}
        className={`px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-card text-center ${
          TONES[variant] ?? TONES.default
        }`}
      >
        {children}
      </div>
    </div>
  );
}
