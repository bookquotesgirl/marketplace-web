export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink/60 mb-1.5">{label}</span>}
      <input
        className={`w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 bg-white outline-none focus:ring-2 focus:ring-forest ${className}`}
        {...props}
      />
    </label>
  );
}
