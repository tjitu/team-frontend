'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { AffiliateListItem, Agreement, dateTime } from './types';
import { wibInput } from './admin-config';
import { AgreementDocument } from './agreement-document';
import { ConfirmDialog } from './confirm-dialog';
import styles from './affiliate.module.css';

const variables = ['affiliate_name','affiliate_identifier','affiliate_account_id','jitu_party','agreement_version','effective_date','base_commission','base_discount','boost_configuration','acceptance_timestamp'];
export function AffiliateAgreementEditor() {
  const [agreements,setAgreements] = useState<Agreement[]>([]);
  const [affiliates,setAffiliates] = useState<AffiliateListItem[]>([]);
  const [selected,setSelected] = useState<Agreement | null>(null);
  const [editingId,setEditingId] = useState<string | null>(null);
  const [error,setError] = useState(''); const [notice,setNotice] = useState(''); const [busy,setBusy] = useState(false);
  const [preview,setPreview] = useState(false); const [personalized,setPersonalized] = useState('');
  const [affiliateId,setAffiliateId] = useState(''); const [confirm,setConfirm] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const load = useCallback(async () => {
    try {
      const [docs,members] = await Promise.all([api.get<Agreement[]>('/team/affiliate/agreements',{ force: true }),api.get<AffiliateListItem[]>('/team/affiliate/admin',{ force: true })]);
      setAgreements(docs); setAffiliates(members); setError('');
      setSelected(previous => previous ?? docs[0] ?? null); setEditingId(previous => previous ?? docs[0]?.id ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Agreement templates tidak dapat dimuat.'); }
  },[]);
  useEffect(() => { void load(); },[load]);
  const readonly = selected?.status==='PUBLISHED' && editingId!==null;
  const change = (update: Partial<Agreement>) => { if (selected) { setSelected({ ...selected,...update }); setPersonalized(''); } };
  function insert(text: string) {
    if (!selected || readonly) return;
    const start=editor.current?.selectionStart ?? selected.content.length;
    const end=editor.current?.selectionEnd ?? start;
    change({ content: selected.content.slice(0,start)+text+selected.content.slice(end) });
    requestAnimationFrame(() => { editor.current?.focus(); editor.current?.setSelectionRange(start+text.length,start+text.length); });
  }
  async function save() {
    if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const body={ title: selected.title,content: selected.content,party: selected.party,summary: selected.summary,effectiveAt: selected.effectiveAt ?? undefined,requiresAcceptance: selected.requiresAcceptance };
      const saved=editingId ? await api.patch<Agreement>(`/team/affiliate/agreements/${editingId}`,body) : await api.post<Agreement>('/team/affiliate/agreements',body);
      setSelected(saved); setEditingId(saved.id); setNotice('Draft saved.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Draft tidak dapat disimpan.'); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!editingId) return;
    setBusy(true); setError('');
    try { const published=await api.post<Agreement>(`/team/affiliate/agreements/${editingId}/publish`,{}); setSelected(published); setConfirm(false); setNotice('Agreement published. Effective date and acceptance requirements now apply.'); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Agreement tidak dapat dipublikasikan.'); }
    finally { setBusy(false); }
  }
  async function personalPreview() {
    if (!editingId || !affiliateId) return;
    try { const result=await api.get<{ content: string }>(`/team/affiliate/agreements/${editingId}/preview?affiliateId=${encodeURIComponent(affiliateId)}`,{ force: true }); setPersonalized(result.content); setPreview(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Preview unavailable.'); }
  }
  return <div className="page-content"><div className={styles.stack}><Link href="/affiliates">← Affiliate Management</Link><div><h1>Agreement Management</h1><p className={styles.muted}>System Owner mengelola draft dan versi. Published agreements serta accepted snapshots tidak dapat diedit.</p></div>
    {error && <p role="alert" className="inline-message error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className={styles.actions}><label className={styles.field}>Version<select className="field-input" value={editingId ?? ''} onChange={event => { const item=agreements.find(a => a.id===event.target.value); if (item) { setSelected(item); setEditingId(item.id); setPersonalized(''); } }}><option value="" disabled>New draft</option>{agreements.map(a => <option key={a.id} value={a.id}>v{a.version} · {a.status} · {a.title}</option>)}</select></label>
      <button className="button button-secondary" disabled={!selected || busy} onClick={() => { if (selected) { setSelected({ ...selected,id: '',version: 0,status: 'DRAFT',effectiveAt: null }); setEditingId(null); setPersonalized(''); setNotice('New draft copied. Save to allocate the next version.'); } }}>Create new version from selected</button>
    </div>
    {selected && <><div className={styles.gridForm}>
      <label className={styles.field}>Agreement title<input className="field-input" value={selected.title} maxLength={180} disabled={readonly} onChange={event => change({ title: event.target.value })} /></label>
      <label className={styles.field}>Contracting party identity<input className="field-input" maxLength={2000} value={selected.party} disabled={readonly} onChange={event => change({ party: event.target.value })} placeholder="Owner supplies the authorized contracting party" /></label>
      <label className={styles.field}>Effective date · WIB<input className="field-input" type="datetime-local" disabled={readonly} value={selected.effectiveAt ? wibInput(selected.effectiveAt) : ''} onChange={event => change({ effectiveAt: event.target.value ? new Date(`${event.target.value}+07:00`).toISOString() : null })} /></label>
      <label className={styles.actions}><input type="checkbox" checked={selected.requiresAcceptance} disabled={readonly} onChange={event => change({ requiresAcceptance: event.target.checked })} />Require acceptance before protected features</label>
    </div><label className={styles.field}>Summary of changes<textarea className="field-input" value={selected.summary} maxLength={4000} disabled={readonly} onChange={event => change({ summary: event.target.value })} /></label>
      {readonly && <p className={styles.alert}>Published v{selected.version} · Effective {selected.effectiveAt ? dateTime(selected.effectiveAt) : '—'}. Create a new version to make changes.</p>}
      <div className={styles.actions}><button className="button button-secondary" onClick={() => { setPreview(false); setPersonalized(''); }}>Edit / source</button><button className="button button-secondary" onClick={() => { setPreview(true); setPersonalized(''); }}>Preview document</button>
        {!readonly && <><button type="button" className="button button-secondary" onClick={() => insert('\n## Heading\n')}>Heading</button><button type="button" className="button button-secondary" onClick={() => insert('**Bold text**')}>Bold</button><button type="button" className="button button-secondary" onClick={() => insert('\n- List item\n')}>List</button><select className="field-input" aria-label="Insert dynamic variable" defaultValue="" onChange={event => { if (event.target.value) insert(`{{${event.target.value}}}`); event.target.value=''; }}><option value="">Insert variable…</option>{variables.map(v => <option value={v} key={v}>{v}</option>)}</select></>}
      </div>
      {preview ? <AgreementDocument content={personalized || selected.content} /> : <label className={styles.field}>Agreement content · safe Markdown editor<textarea ref={editor} className={styles.editor} maxLength={100000} readOnly={readonly} value={selected.content} onChange={event => change({ content: event.target.value })} /></label>}
      <p className={styles.muted}>Supported formatting: headings, bold, and lists. HTML remains text. Owner must resolve all OWNER_REVIEW placeholders; contracting identity, legal terms, payout policy, and effective date must be reviewed before publishing.</p>
      <div className={styles.actions}><button className="button button-primary" disabled={readonly || busy} onClick={() => void save()}>Save draft</button><button className="button button-secondary" disabled={readonly || !editingId || busy} onClick={() => setConfirm(true)}>Publish saved version</button>
        <select className="field-input" aria-label="Preview for affiliator" value={affiliateId} onChange={event => setAffiliateId(event.target.value)}><option value="">Preview for affiliator…</option>{affiliates.map(a => <option value={a.id} key={a.id}>{a.name}</option>)}</select><button className="button button-secondary" disabled={!affiliateId || !editingId} onClick={() => void personalPreview()}>Preview saved personalized agreement</button>
      </div>
    </>}
    {confirm && <ConfirmDialog title="Publish saved agreement?" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void publish()}><p>Publikasi menggunakan draft yang terakhir disimpan. Konten versi ini menjadi immutable. Bila persetujuan diwajibkan, affiliator harus menyetujui versi baru mulai effective date.</p>{error && <p role="alert">{error}</p>}</ConfirmDialog>}
  </div></div>;
}
