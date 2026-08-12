export default function Spinner({ className = '' }) {
  return (
    <span className={`inline-block w-6 h-6 rounded-full border-2 border-forest border-t-transparent animate-spin ${className}`} />
  );
}
