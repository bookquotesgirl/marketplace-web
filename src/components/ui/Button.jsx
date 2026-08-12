const styles = {
  primary: 'bg-forest text-white hover:bg-forest-dark',
  secondary: 'ring-1 ring-black/10 hover:bg-black/5',
  gold: 'bg-gold text-ink hover:bg-gold-light',
  ghost: 'hover:bg-black/5',
};
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5', lg: 'h-12 px-6 text-lg' };
export default function Button({ variant = 'primary', size = 'md', disabled, className = '', ...props }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition
        ${styles[variant]} ${sizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      {...props}
    />
  );
}
