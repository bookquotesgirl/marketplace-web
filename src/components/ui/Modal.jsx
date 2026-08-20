import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, variant = 'center' }) {
  if (!open) return null;

  if (variant === 'drawer') {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" onClick={onClose}>
        <div
          className="absolute inset-y-0 start-0 h-full w-[85%] max-w-xs bg-cream dark:bg-ink text-ink dark:text-slate-100 shadow-card overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 text-ink dark:text-slate-100 rounded-3xl shadow-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="text-lg font-extrabold mb-3">{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  );
}
