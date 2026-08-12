export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-6" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-lg font-extrabold mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
