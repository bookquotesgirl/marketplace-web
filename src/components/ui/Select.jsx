export default function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
          {label}
        </span>
      )}
      <select
        className={`w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-forest ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
