import { useState } from 'react';

// Reusable product image with letter-initial fallback.
//
// Renders <img> when `src` is a non-empty string.
// Falls back to a letter-initial placeholder when:
//   1. `src` is missing / undefined / empty, or
//   2. the image URL exists but fails to load (onError).
//
// The parent is expected to size and clip this component
// (e.g. aspect-square + overflow-hidden), so we fill 100%
// of whatever space we're given.
export default function ProductImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-black/5 dark:bg-white/5 grid place-items-center text-ink/20 dark:text-white/20 text-4xl font-bold select-none">
        {alt?.[0]?.toUpperCase() ?? '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
