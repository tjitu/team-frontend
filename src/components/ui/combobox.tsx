'use client';

import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  align?: 'start' | 'end';
  fullWidth?: boolean;
}

/**
 * Polished, high-performance, accessible dropdown combobox for the team workspace.
 * Uses exact semantic design tokens, clean flexbox alignment, and keyboard support.
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
  align = 'end',
  fullWidth = false,
}: ComboboxSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const isFull = fullWidth || className?.includes('w-full') || triggerClassName?.includes('w-full');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const normalizedOptions: ComboboxItemOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions;
    const query = search.trim().toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchable, search]);

  // Click outside to dismiss
  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  // Focus search input when opened
  React.useEffect(() => {
    if (open) {
      const selectedIdx = filteredOptions.findIndex((o) => o.value === value);
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 20);
      }
    } else {
      setSearch('');
      setFocusedIndex(-1);
    }
  }, [open, searchable, filteredOptions, value]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((prev) =>
        filteredOptions.length === 0 ? -1 : (prev + 1) % filteredOptions.length
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((prev) =>
        filteredOptions.length === 0
          ? -1
          : (prev - 1 + filteredOptions.length) % filteredOptions.length
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        const chosen = filteredOptions[focusedIndex];
        onValueChange(chosen.value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('combobox-root relative inline-flex items-center', isFull && 'w-full flex', className)}
      style={{
        position: 'relative',
        display: isFull ? 'flex' : 'inline-flex',
        width: isFull ? '100%' : undefined,
        verticalAlign: 'middle',
      }}
      onKeyDown={handleContainerKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'combobox-trigger flex h-8 items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--muted-bg)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--ring)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50',
          triggerClassName
        )}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          minHeight: '36px',
          height: '36px',
          width: isFull ? '100%' : undefined,
          minWidth: isFull ? '100%' : '110px',
          padding: '0 10px 0 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--muted-bg)',
          color: 'var(--foreground)',
          fontSize: '12px',
          fontWeight: 550,
          lineHeight: 'normal',
          verticalAlign: 'middle',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: 'var(--shadow-xs)',
          userSelect: 'none',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        <span
          className="combobox-trigger-label truncate flex items-center gap-1.5"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'left',
            lineHeight: 1.2,
          }}
        >
          {selectedOption?.icon}
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span style={{ color: 'var(--muted-fg)' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className="combobox-trigger-icon shrink-0 text-[var(--muted-fg)]"
          style={{
            width: '14px',
            height: '14px',
            flexShrink: 0,
            color: 'var(--muted-fg)',
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={popupRef}
          className="combobox-popup z-[1200] rounded-md border border-[var(--border)] bg-[var(--card)] p-1 text-xs text-[var(--foreground)] shadow-xl animate-in fade-in-0 zoom-in-95"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: align === 'end' ? 0 : 'auto',
            left: align === 'start' ? 0 : 'auto',
            zIndex: 1200,
            minWidth: '100%',
            width: isFull ? '100%' : 'max-content',
            maxWidth: isFull ? '100%' : '360px',
            maxHeight: '260px',
            overflowY: 'auto',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            padding: '4px',
            boxShadow:
              '0 10px 25px -4px rgba(0, 0, 0, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.12)',
            boxSizing: 'border-box',
          }}
        >
          {searchable && (
            <div
              className="combobox-search-box flex items-center gap-1.5 border-b border-[var(--border)] px-2 py-1.5 mb-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid var(--border)',
                padding: '6px 8px',
                marginBottom: '4px',
              }}
            >
              <Search
                size={13}
                className="combobox-search-icon text-[var(--muted-fg)] shrink-0"
                style={{ color: 'var(--muted-fg)', flexShrink: 0 }}
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                className="combobox-search-input w-full bg-transparent text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-fg)]"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  padding: 0,
                }}
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(0);
                }}
              />
            </div>
          )}

          <div
            role="listbox"
            className="combobox-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: 0,
              margin: 0,
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                className="combobox-empty py-2 px-3 text-center text-xs text-[var(--muted-fg)]"
                style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--muted-fg)',
                }}
              >
                No options found.
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isFocused = index === focusedIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'combobox-item flex cursor-pointer select-none items-center justify-between rounded px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--surface-hover)] data-[highlighted]:bg-[var(--surface-hover)] data-[selected]:font-semibold data-[selected]:text-[var(--brand)]',
                      isSelected && 'is-selected font-semibold text-[var(--brand)]',
                      isFocused && 'is-focused bg-[var(--surface-hover)]'
                    )}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: 'none',
                      background: isFocused || isSelected ? 'var(--surface-hover)' : 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      color: isSelected ? 'var(--brand)' : 'var(--foreground)',
                      fontWeight: isSelected ? 600 : 500,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span
                      className="combobox-item-label truncate flex items-center gap-2"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check
                        size={14}
                        className="combobox-item-check text-[var(--brand)] shrink-0"
                        style={{ color: 'var(--brand)', flexShrink: 0 }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Dummy primitives preserved for any backward compatibility
export const Combobox = { Root: ComboboxSelect };
export const ComboboxInput = 'input';
export const ComboboxTrigger = 'button';
export const ComboboxContent = 'div';
export const ComboboxList = 'div';
export const ComboboxItem = 'button';
export const ComboboxItemIndicator = 'span';
export const ComboboxEmpty = 'div';
export const ComboboxGroup = 'div';
export const ComboboxLabel = 'label';
export const ComboboxSeparator = 'hr';
export const ComboboxValue = 'span';
