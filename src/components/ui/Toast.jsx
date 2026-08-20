export default function Toast({ show, children }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="px-4 py-2.5 rounded-2xl bg-ink text-white text-sm font-semibold shadow-card">
        {children}
      </div>
    </div>
  );
}
