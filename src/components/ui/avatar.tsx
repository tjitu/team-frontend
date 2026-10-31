'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  size?: 'default' | 'sm' | 'lg';
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
        'shadcn-avatar relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-medium',
        size === 'default' && 'size-10 text-sm',
        size === 'sm' && 'size-8 text-xs',
        size === 'lg' && 'size-12 text-base',
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
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
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground uppercase',
        className
      )}
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
      className={cn(
        'shadcn-avatar-badge absolute bottom-0 right-0 z-10 size-2.5 rounded-full ring-2 ring-background',
        className
      )}
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
      className={cn(
        'shadcn-avatar-group flex items-center -space-x-2.5 *:ring-2 *:ring-background',
        className
      )}
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
      className={cn(
        'shadcn-avatar-group-count relative flex size-10 shrink-0 select-none items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background',
        className
      )}
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
