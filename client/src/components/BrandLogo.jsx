// client/src/components/BrandLogo.jsx
import React from 'react';

const SIZES = {
  sm: {
    icon: 'h-5',
    text: 'text-lg leading-none',
    gap: 'gap-1.5',
  },
  md: {
    icon: 'h-8 md:h-10',
    text: 'text-2xl md:text-3xl leading-none',
    gap: 'gap-2',
  },
  lg: {
    icon: 'h-10',
    text: 'text-3xl leading-none',
    gap: 'gap-2.5',
  },
};

/**
 * Plain mark (/fliccs-icon.png) + Barlow Condensed italic wordmark.
 */
export default function BrandLogo({
  size = 'md',
  className = '',
  iconClassName = '',
  textClassName = '',
  alt = 'Fliccs',
}) {
  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={`inline-flex items-center ${s.gap} font-barlow ${className}`}
      role="img"
      aria-label={alt}
    >
      <img
        src="/fliccs-icon.png"
        alt=""
        aria-hidden="true"
        className={`${s.icon} w-auto opacity-90 ${iconClassName}`}
      />
      <span
        className={`${s.text} italic font-medium lowercase tracking-tight text-brand-primary ${textClassName}`}
      >
        fliccs
      </span>
    </span>
  );
}
