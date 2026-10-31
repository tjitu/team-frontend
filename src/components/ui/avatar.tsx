'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  size?: 'default' | 'sm' | 'lg' | 'xs';
}

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'shadcn-avatar',
        size === 'default' && 'size-10',
        size === 'sm' && 'size-8',
        size === 'xs' && 'size-6',
        size === 'lg' && 'size-12',
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt = '',
  onError,
  ...props
}: React.ComponentProps<'img'>) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) {
    return null;
  }

  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn('shadcn-avatar-image', className)}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      loading="lazy"
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('shadcn-avatar-fallback', className)}
      {...props}
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
