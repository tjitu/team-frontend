'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Project, TeamMember } from '@/lib/api';

type ProjectMemberOption = NonNullable<Project['members']>[number];

export function AssigneePicker({
  members,
  initialIds = [],
  name = 'assigneeIds',
}: {
  members: ProjectMemberOption[];
  initialIds?: string[];
  name?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => initialIds);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedMembers = useMemo(
    () => members.filter(({ teamMember }) => selectedIds.includes(teamMember.id)),
    [members, selectedIds],
  );
  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return members;
    return members.filter(({ teamMember }) =>
      `${teamMember.name} ${teamMember.email}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [members, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function toggleMember(member: TeamMember) {
    setSelectedIds((current) => current.includes(member.id)
      ? current.filter((id) => id !== member.id)
      : [...current, member.id]);
  }

  return (
    <div className="assignee-picker" ref={pickerRef}>
      {selectedIds.map((id) => <input type="hidden" name={name} value={id} key={id} />)}
      <button
        className="assignee-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedIds.length ? `${selectedIds.length} anggota dipilih` : 'Pilih assignee'}</span>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {selectedMembers.length > 0 && <div className="assignee-picker-selected" aria-label="Assignee terpilih">
        {selectedMembers.map(({ teamMember }) => <span className="assignee-picker-chip" key={teamMember.id}>
          <span>{teamMember.name}</span>
          <button type="button" aria-label={`Hapus ${teamMember.name}`} onClick={() => toggleMember(teamMember)}>×</button>
        </span>)}
      </div>}
      {open && <div className="assignee-picker-menu">
        <label className="sr-only" htmlFor={`${name}-search`}>Cari anggota proyek</label>
        <input
          ref={searchRef}
          id={`${name}-search`}
          className="assignee-picker-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama atau email"
          autoComplete="off"
        />
        <div className="assignee-picker-options" role="listbox" aria-multiselectable="true" aria-label="Anggota proyek">
          {filteredMembers.length ? filteredMembers.map(({ teamMember }) => {
            const selected = selectedIds.includes(teamMember.id);
            return <button
              className={`assignee-picker-option ${selected ? 'is-selected' : ''}`}
              type="button"
              role="option"
              aria-selected={selected}
              key={teamMember.id}
              onClick={() => toggleMember(teamMember)}
            >
              <span className="assignee-picker-avatar" aria-hidden="true">{teamMember.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</span>
              <span className="assignee-picker-person"><strong>{teamMember.name}</strong><small>{teamMember.email}</small></span>
              <span className="assignee-picker-check" aria-hidden="true">{selected ? '✓' : ''}</span>
            </button>;
          }) : <p className="assignee-picker-empty">Tidak ada anggota yang cocok.</p>}
        </div>
      </div>}
      <span className="subtle-link">Pilih satu atau beberapa anggota proyek.</span>
    </div>
  );
}
