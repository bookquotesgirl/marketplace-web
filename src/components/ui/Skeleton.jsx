// Neutral loading placeholder. Compose these to mirror the shape of the content
// that's loading (see ProductCardSkeleton) instead of showing a bare spinner.
export function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}

// Matches the footprint of <ProductCard> so grids don't reflow when data lands.
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
