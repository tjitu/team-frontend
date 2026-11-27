'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AffiliateReport, Agreement, BoostType, boostNames, Config, dateTime, money } from './types';
import { ConfirmDialog } from './confirm-dialog';
import styles from './affiliate.module.css';

export const wibInput = (value: string) => new Date(new Date(value).getTime()+7*3600000).toISOString().slice(0,16);
export function AffiliateAdminConfig({ data,reload }: { data: AffiliateReport; reload: () => Promise<void> }) {
  const [config,setConfig] = useState<Config>(() => structuredClone(data.profile.config));
  const [agreements,setAgreements] = useState<Agreement[]>([]);
  const [error,setError] = useState(''); const [notice,setNotice] = useState(''); const [busy,setBusy] = useState(false);
  const [effectiveAt,setEffectiveAt] = useState(wibInput(new Date(Date.now()+3600000).toISOString()));
  const [agreementId,setAgreementId] = useState('');
  const [bonus,setBonus] = useState({ type: 'COMMISSION' as BoostType,quantity: 1,requestKey: crypto.randomUUID() });
  const [payout,setPayout] = useState({ amount: 0,reference: '',paidAt: wibInput(new Date().toISOString()),status: 'PAID',notes: '',requestKey: crypto.randomUUID() });
  const [confirmPayout,setConfirmPayout] = useState(false);
  useEffect(() => { api.get<Agreement[]>('/team/affiliate/admin/agreement-options',{ force: true }).then(setAgreements).catch(cause => setError(String(cause))); },[]);
  async function run(action: () => Promise<unknown>,success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await reload(); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Perubahan tidak dapat disimpan.'); return false; }
    finally { setBusy(false); }
  }
  const endpoint = `/team/affiliate/admin/${data.profile.id}`;
  return <div className={styles.stack}>
    {error && <p className="inline-message error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <section className={styles.panel}><h2>Commercial configuration</h2><p className={styles.muted}>Rate dalam persen; boost menambah percentage points. Perubahan memakai versi agreement baru yang belum diterima affiliator dan berlaku setelah effective date serta acceptance. Benefit boost aktif tetap memakai snapshot saat aktivasi. Kuota bulanan yang sudah dialokasikan tetap; gunakan bonus untuk menambah kuota bulan ini.</p>
      <form className={styles.stack} onSubmit={event => { event.preventDefault(); void run(() => api.post(`${endpoint}/config`,{ config,effectiveAt: new Date(`${effectiveAt}+07:00`).toISOString(),agreementId }),'Configuration scheduled.'); }}>
        <div className={styles.gridForm}>{(['discount','commission'] as const).map(key => <label className={styles.field} key={key}>Base {key} (%)<input className="field-input" type="number" min={0} max={100} step="0.01" required value={config[key]/100} onChange={event => setConfig({ ...config,[key]: Math.round(Number(event.target.value)*100) })} /></label>)}</div>
        {(Object.keys(boostNames) as BoostType[]).map(type => <fieldset className={styles.panel} key={type}><legend>{boostNames[type]}</legend><div className={styles.gridForm}>
          {(['additional','quota','durationHours','maxTransactions'] as const).map(key => <label className={styles.field} key={key}>{({ additional: 'Additional percentage points',quota: 'Monthly quota',durationHours: 'Duration (hours)',maxTransactions: 'Maximum transactions (blank = unlimited)' })[key]}
            <input className="field-input" type="number" min={key==='durationHours' || key==='maxTransactions' ? 1 : 0} max={key==='additional' ? 100 : key==='durationHours' ? 744 : key==='quota' ? 10000 : 1000000} step={key==='additional' ? '0.01' : '1'} value={key==='additional' ? config.boosts[type][key]/100 : config.boosts[type][key] ?? ''}
              onChange={event => setConfig({ ...config,boosts: { ...config.boosts,[type]: { ...config.boosts[type],[key]: key==='maxTransactions' && !event.target.value ? null : key==='additional' ? Math.round(Number(event.target.value)*100) : Number(event.target.value) } } })} /></label>)}
          <label className={styles.actions}><input type="checkbox" checked={config.boosts[type].available} onChange={event => setConfig({ ...config,boosts: { ...config.boosts,[type]: { ...config.boosts[type],available: event.target.checked } } })} />Available</label></div></fieldset>)}
        <div className={styles.gridForm}><label className={styles.field}>Required agreement<select className="field-input" value={agreementId} required onChange={event => { setAgreementId(event.target.value); const agreement=agreements.find(a => a.id===event.target.value); if (agreement?.effectiveAt) setEffectiveAt(wibInput(agreement.effectiveAt)); }}><option value="">Select published agreement</option>{agreements.map(a => <option key={a.id} value={a.id}>v{a.version} · {a.title}</option>)}</select></label><label className={styles.field}>Effective date · WIB<input className="field-input" type="datetime-local" required value={effectiveAt} onChange={event => setEffectiveAt(event.target.value)} /></label></div>
        <button className="button button-primary" disabled={busy}>Schedule configuration</button>
      </form>
      <details><summary>Configuration history / scheduled terms</summary>{data.terms.map(term => <div key={term.id}><p>{dateTime(term.effectiveAt)} · Agreement {term.agreementId || 'initial defaults'}</p><pre>{JSON.stringify(term.config,null,2)}</pre></div>)}</details>
    </section>
    <section className={styles.panel}><h2>Additional quota · current WIB month</h2><form className={styles.gridForm} onSubmit={event => { event.preventDefault(); void run(async () => { await api.post(`${endpoint}/bonus`,bonus); setBonus({ ...bonus,requestKey: crypto.randomUUID() }); },'Bonus quota added.'); }}>
      <label className={styles.field}>Boost<select className="field-input" value={bonus.type} onChange={event => setBonus({ ...bonus,type: event.target.value as BoostType })}>{Object.entries(boostNames).map(([type,name]) => <option value={type} key={type}>{name}</option>)}</select></label><label className={styles.field}>Activations<input className="field-input" type="number" min={1} max={10000} required value={bonus.quantity} onChange={event => setBonus({ ...bonus,quantity: Number(event.target.value) })} /></label><button className="button button-primary" disabled={busy}>Grant bonus</button>
    </form></section>
    <section className={styles.panel}><h2>Record manual payout</h2><p className={styles.muted}>Eligible outstanding: {money(Math.max(0,data.totals.outstanding))}. PENDING reserves commission; PAID records a completed external payment. No bank transfer is initiated.</p>
      <form className={styles.gridForm} onSubmit={event => { event.preventDefault(); setConfirmPayout(true); }}>
        <label className={styles.field}>Amount · IDR<input className="field-input" type="number" min={1} max={Math.max(0,data.totals.outstanding)} required value={payout.amount || ''} onChange={event => setPayout({ ...payout,amount: Number(event.target.value) })} /></label>
        <label className={styles.field}>Payment reference<input className="field-input" required minLength={2} maxLength={150} value={payout.reference} onChange={event => setPayout({ ...payout,reference: event.target.value })} /></label>
        <label className={styles.field}>Payment date · WIB<input className="field-input" type="datetime-local" required value={payout.paidAt} onChange={event => setPayout({ ...payout,paidAt: event.target.value })} /></label>
        <label className={styles.field}>Status<select className="field-input" value={payout.status} onChange={event => setPayout({ ...payout,status: event.target.value })}><option value="PAID">PAID</option><option value="PENDING">PENDING</option></select></label>
        <label className={styles.field}>Internal notes<textarea className="field-input" maxLength={2000} value={payout.notes} onChange={event => setPayout({ ...payout,notes: event.target.value })} /></label><button className="button button-primary" disabled={busy || data.totals.outstanding<=0}>Review payout</button>
      </form>
      {data.payouts.filter(p => p.status==='PENDING').map(p => <div className={styles.actions} key={p.id}><span>{p.reference} · {money(p.amount)}</span>{(['PAID','CANCELLED'] as const).map(status => <button className="button button-secondary" disabled={busy} key={status} onClick={() => { if (window.confirm(`Mark ${p.reference} as ${status}?`)) void run(() => api.patch(`/team/affiliate/admin/payouts/${p.id}/status`,{ status }),'Payout updated.'); }}>{status}</button>)}</div>)}
    </section>
    {confirmPayout && <ConfirmDialog title="Record manual payout?" busy={busy} onCancel={() => setConfirmPayout(false)} onConfirm={() => void run(async () => {
      await api.post(`${endpoint}/payouts`,{ ...payout,paidAt: new Date(`${payout.paidAt}+07:00`).toISOString() });
      setConfirmPayout(false); setPayout({ ...payout,amount: 0,reference: '',notes: '',requestKey: crypto.randomUUID() });
    },'Payout recorded.')}><p>{money(payout.amount)} · {payout.reference} · {payout.status}</p><p>This records an external manual payment and reserves or settles commission. Confirm the reference and amount.</p>{error && <p role="alert">{error}</p>}</ConfirmDialog>}
  </div>;
}
