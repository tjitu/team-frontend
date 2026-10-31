'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getCartoonAvatarUrl, CartoonStyle } from '@/lib/avatar';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm' | 'lg' | 'xs';
  seed?: string | null;
  src?: string | null;
  alt?: string;
  styleType?: CartoonStyle;
  children?: React.ReactNode;
}

function Avatar({
  className,
  size = 'default',
  seed,
  src,
  alt = 'Cartoon Avatar',
  styleType = 'open-peeps',
  children,
  ...props
}: AvatarProps) {
  const cartoonUrl = src || (seed ? getCartoonAvatarUrl(seed, styleType) : null);

  return (
    <div
      data-slot="avatar"
      data-size={size}
      className={cn(
        'shadcn-avatar avatar',
        size === 'default' && 'size-10',
        size === 'sm' && 'size-8',
        size === 'xs' && 'size-6',
        size === 'lg' && 'size-12',
        className
      )}
      {...props}
    >
      {cartoonUrl && (
        <img
          data-slot="avatar-image"
          src={cartoonUrl}
          alt={alt}
          className="shadcn-avatar-image"
          loading="lazy"
        />
      )}
      {children}
    </div>
  );
}

function AvatarImage({
  className,
  src,
  alt = 'Cartoon Avatar',
  ...props
}: React.ComponentProps<'img'>) {
  if (!src) return null;
  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn('shadcn-avatar-image', className)}
      loading="lazy"
      {...props}
    />
  );
}

/**
 * AvatarFallback:
 * By user requirement, NO initials text is ever rendered.
 * If fallback is called, it renders a deterministic cartoon person avatar based on the seed.
 */
function AvatarFallback({
  children,
  seed,
  className,
  styleType = 'open-peeps',
}: {
  children?: React.ReactNode;
  seed?: string | null;
  className?: string;
  styleType?: CartoonStyle;
}) {
  const candidateSeed = seed || (typeof children === 'string' && children.trim() ? children.trim() : 'member');
  const cartoonSrc = getCartoonAvatarUrl(candidateSeed, styleType);

  return (
    <img
      data-slot="avatar-image"
      src={cartoonSrc}
      alt="Cartoon Avatar"
      className={cn('shadcn-avatar-image', className)}
      loading="lazy"
    />
  );
}

function AvatarBadge({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn('shadcn-avatar-badge', className)}
      {...props}
    />
  );
}

function AvatarGroup({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn('shadcn-avatar-group', className)}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn('shadcn-avatar-group-count', className)}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
