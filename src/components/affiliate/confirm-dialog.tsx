'use client';
import { useEffect, useRef } from 'react';
import styles from './affiliate.module.css';

export function ConfirmDialog({ title,children,busy,onCancel,onConfirm }: { title: string; children: React.ReactNode; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); },[]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="affiliate-confirm-title" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <div className={styles.confirm}><h2 id="affiliate-confirm-title">{title}</h2>{children}<div className={styles.actions}>
      <button className="button button-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      <button className="button button-primary" onClick={onConfirm} disabled={busy}>{busy ? 'Menyimpan…' : 'Confirm'}</button>
    </div></div></dialog>;
}
