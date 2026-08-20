export default function Card({ className = '', children }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}
