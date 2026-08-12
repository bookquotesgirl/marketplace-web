export default function Rating({ value = 0, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-gold">
        {'★★★★★'.slice(0, Math.round(value))}
        <span className="text-black/15">{'★★★★★'.slice(Math.round(value))}</span>
      </span>
      {count != null && <span className="text-ink/50">({count})</span>}
    </span>
  );
}
