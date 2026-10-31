import * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

function Breadcrumb({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn('shadcn-breadcrumb', className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('shadcn-breadcrumb-list', className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('shadcn-breadcrumb-item', className)}
      {...props}
    />
  );
}

interface BreadcrumbLinkProps extends React.ComponentProps<'a'> {
  render?: React.ReactElement<Record<string, unknown>>;
}

function BreadcrumbLink({
  render,
  className,
  children,
  ...props
}: BreadcrumbLinkProps) {
  const mergedClassName = cn('shadcn-breadcrumb-link', className);

  if (render && React.isValidElement(render)) {
    const elementProps = render.props as Record<string, unknown>;
    return React.cloneElement(render, {
      ...props,
      ...elementProps,
      'data-slot': 'breadcrumb-link',
      className: cn(mergedClassName, typeof elementProps.className === 'string' ? elementProps.className : undefined),
      children: children ?? (elementProps.children as React.ReactNode),
    });
  }

  return (
    <a
      data-slot="breadcrumb-link"
      className={mergedClassName}
      {...props}
    >
      {children}
    </a>
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('shadcn-breadcrumb-page', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('shadcn-breadcrumb-separator', className)}
      {...props}
    >
      {children ?? <span className="shadcn-breadcrumb-separator-slash select-none" aria-hidden="true">/</span>}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn('shadcn-breadcrumb-ellipsis', className)}
      {...props}
    >
      <MoreHorizontal className="shadcn-breadcrumb-ellipsis-icon" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};

