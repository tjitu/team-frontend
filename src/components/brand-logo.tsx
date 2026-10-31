import Image from 'next/image';
import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ size = 32, className = '', showText = false }: BrandLogoProps) {
  return (
    <div className={`brand-mark-wrapper inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/blue-jitu-logo.png"
        alt="Logo Jitu"
        width={size}
        height={size}
        priority
        className="brand-logo object-contain flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      {showText && (
        <span className="font-display font-extrabold text-[20px] tracking-tight leading-none">
          jitu<span className="text-blue-500">.</span>
        </span>
      )}
    </div>
  );
}
