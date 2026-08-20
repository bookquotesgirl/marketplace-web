const tones = {
  forest: 'bg-forest/10 text-forest',
  gold: 'bg-gold/20 text-gold-dark',
  crimson: 'bg-crimson/10 text-crimson',
  gray: 'bg-black/5 text-ink/60 dark:bg-white/10 dark:text-slate-300',
};
export default function Badge({ tone = 'forest', children }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
