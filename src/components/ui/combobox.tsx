'use client';

import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Primitives as specified in shadcn base-ui Combobox docs
const Combobox = BaseCombobox.Root;
const ComboboxInput = BaseCombobox.Input;
const ComboboxTrigger = BaseCombobox.Trigger;
const ComboboxList = BaseCombobox.List;
const ComboboxItem = BaseCombobox.Item;
const ComboboxItemIndicator = BaseCombobox.ItemIndicator;
const ComboboxEmpty = BaseCombobox.Empty;
const ComboboxGroup = BaseCombobox.Group;
const ComboboxLabel = BaseCombobox.GroupLabel;
const ComboboxSeparator = BaseCombobox.Separator;
const ComboboxValue = BaseCombobox.Value;

interface ComboboxContentProps extends React.ComponentProps<typeof BaseCombobox.Popup> {
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

function ComboboxContent({
  children,
  className,
  sideOffset = 4,
  ...props
}: ComboboxContentProps) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner sideOffset={sideOffset}>
        <BaseCombobox.Popup
          className={cn(
            'combobox-popup z-[1100] min-w-[160px] max-w-[340px] max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 text-[var(--foreground)] shadow-xl animate-in fade-in-0 zoom-in-95',
            className
          )}
          {...props}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export type ComboboxItemOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

export interface ComboboxSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: ComboboxItemOption[] | string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  searchable?: boolean;
  ariaLabel?: string;
}

/**
 * High-level ComboboxSelect component for replacing all standard HTML <select> dropdowns.
 * Built on @base-ui/react with full keyboard accessibility, dark UI, and instant response.
 */
export function ComboboxSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className,
  triggerClassName,
  searchable = false,
  ariaLabel,
}: ComboboxSelectProps) {
  const normalizedOptions: ComboboxItemOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  return (
    <BaseCombobox.Root
      items={normalizedOptions}
      value={selectedOption ?? null}
      itemToStringValue={(item) => (item ? item.label : '')}
      onValueChange={(item) => {
        if (item) {
          onValueChange(item.value);
        }
      }}
      disabled={disabled}
    >
      <div className={cn('relative inline-flex items-center', className)}>
        <BaseCombobox.Trigger
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            'combobox-trigger flex h-8 min-w-[110px] items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--muted-bg)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--ring)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName
          )}
        >
          <span className="truncate flex items-center gap-1.5">
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : <span className="text-[var(--muted-fg)]">{placeholder}</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted-fg)]" />
        </BaseCombobox.Trigger>

        <BaseCombobox.Portal>
          <BaseCombobox.Positioner sideOffset={4}>
            <BaseCombobox.Popup className="combobox-popup z-[1100] min-w-[140px] max-h-[260px] overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--card)] p-1 text-xs text-[var(--foreground)] shadow-xl animate-in fade-in-0 zoom-in-95">
              {searchable && (
                <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-2 py-1.5 mb-1">
                  <Search className="h-3.5 w-3.5 text-[var(--muted-fg)]" />
                  <BaseCombobox.Input
                    className="w-full bg-transparent text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-fg)]"
                    placeholder="Search..."
                  />
                </div>
              )}
              <BaseCombobox.Empty className="py-2 px-3 text-center text-xs text-[var(--muted-fg)]">
                No options found.
              </BaseCombobox.Empty>
              <BaseCombobox.List>
                {(opt: ComboboxItemOption) => (
                  <BaseCombobox.Item
                    key={opt.value}
                    value={opt}
                    className="combobox-item flex cursor-pointer select-none items-center justify-between rounded px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--surface-hover)] data-[highlighted]:bg-[var(--surface-hover)] data-[selected]:font-semibold data-[selected]:text-[var(--brand)]"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon}
                      {opt.label}
                    </span>
                    <BaseCombobox.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-[var(--brand)] shrink-0" />
                    </BaseCombobox.ItemIndicator>
                  </BaseCombobox.Item>
                )}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </div>
    </BaseCombobox.Root>
  );
}

export {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxValue,
};
