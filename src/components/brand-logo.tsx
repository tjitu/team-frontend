'use client';

import React, { useId } from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ size = 32, className = '', showText = false }: BrandLogoProps) {
  const id = useId();
  const safeId = id.replace(/:/g, '');
  const bgId = `jitu-brand-bg-${safeId}`;
  const glowId = `jitu-brand-glow-${safeId}`;

  return (
    <div
      className={`brand-mark-wrapper inline-flex items-center gap-2.5 ${className}`}
      style={{ height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-logo-svg flex-shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="15%" r="75%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Clean rounded squircle container (shadcn / Linear aesthetic) */}
        <rect width="32" height="32" rx="8" fill={`url(#${bgId})`} />
        <rect width="32" height="32" rx="8" fill={`url(#${glowId})`} />
        <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="rgba(255, 255, 255, 0.14)" />

        {/* Minimalist modern Jitu mark: Precision geometric J with focal point */}
        <path
          d="M19 10V17.2C19 19.851 16.851 22 14.2 22C11.549 22 9.4 19.851 9.4 17.2"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Precision focal target dot at apex with electric blue ring */}
        <circle cx="19" cy="10" r="2.2" fill="#2563EB" />
        <circle cx="19" cy="10" r="0.9" fill="#FFFFFF" />

        {/* Subtle crosshair precision ticks */}
        <path d="M22.5 10H24M19 6.5V5" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      </svg>
      {showText && (
        <span className="brand-text font-semibold text-sm tracking-tight text-foreground select-none">
          Jitu<span className="text-blue-600 font-bold ml-0.5">Team</span>
        </span>
      )}
    </div>
  );
}
