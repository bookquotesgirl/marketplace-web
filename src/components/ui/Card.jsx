export default function Card({ className = '', children }) {
  return <div className={`bg-white rounded-2xl ring-1 ring-black/5 shadow-soft ${className}`}>{children}</div>;
}
