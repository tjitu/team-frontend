'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { GrowthConfig, GrowthConfiguration, SocialItem } from './types';
import styles from './growth.module.css';

export function GrowthSettings({ tryoutId, disabled, onChange }: {
  tryoutId: string | null; disabled: boolean; onChange: (config: GrowthConfig, version: number) => void;
}) {
  const [state, setState] = useState<GrowthConfiguration | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const change = useRef(onChange); change.current = onChange;
  useEffect(() => {
    let cancelled = false;
    const path = tryoutId ? `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/growth` : '/team/control-center/tryout-growth/defaults';
    setState(null); setError('');
    api.get<GrowthConfiguration>(path, { force: true }).then(value => {
      if (!cancelled) { setState(value); change.current(value.config, value.version); }
    }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Pengaturan gagal dimuat.'); });
    return () => { cancelled = true; };
  }, [tryoutId, retry]);
  function update(config: GrowthConfig) {
    if (!state) return;
    setState({ ...state, config }); onChange(config, state.version);
  }
  if (!state) return <section className={styles.settings}><h3>Registration &amp; Growth</h3>{error ? <p role="alert">{error} <button type="button" className="table-action-btn" onClick={() => setRetry(value => value + 1)}>Muat ulang</button></p> : <p>Memuat pengaturan...</p>}</section>;
  const config = state.config;
  const itemLabel: Record<SocialItem, string> = { follow: 'Follow Instagram', likeTag: 'Like & tag 3 teman', story: 'Share Instagram Story' };
  return <fieldset className={styles.settings} disabled={disabled}>
    <legend>Registration &amp; Growth</legend>
    <label className="control-check"><input type="checkbox" checked={config.enabled} onChange={e => update({ ...config, enabled: e.target.checked })} /> Social Engagement Modal</label>
    {config.enabled && <>
      <label className="control-check"><input type="checkbox" checked={config.manualVerification} onChange={e => update({ ...config, manualVerification: e.target.checked })} /> Verifikasi manual sebelum akses tryout</label>
      <label className="field-label">URL profil Instagram<input type="url" required className="field-input" value={config.profileUrl} onChange={e => update({ ...config, profileUrl: e.target.value })} /></label>
      <label className="field-label">URL postingan kampanye<input type="url" className="field-input" required={config.items.likeTag.enabled || config.items.story.enabled} value={config.campaignUrl} onChange={e => update({ ...config, campaignUrl: e.target.value })} /></label>
      <div className={styles.requirements}>
        {(Object.keys(itemLabel) as SocialItem[]).map(key => <div key={key} className={styles.requirement}>
          <label className="control-check"><input type="checkbox" checked={config.items[key].enabled} onChange={e => update({ ...config,
            items: { ...config.items, [key]: { ...config.items[key], enabled: e.target.checked } },
            mentionRequired: key === 'story' && !e.target.checked ? false : config.mentionRequired })} /> {itemLabel[key]}</label>
          <label className="control-check"><input type="checkbox" disabled={!config.items[key].enabled} checked={config.items[key].required} onChange={e => update({ ...config, items: { ...config.items, [key]: { ...config.items[key], required: e.target.checked } } })} /> Wajib</label>
        </div>)}
      </div>
      {config.items.story.enabled && <label className="control-check"><input type="checkbox" checked={config.mentionRequired} onChange={e => update({ ...config, mentionRequired: e.target.checked })} /> Wajib mention @jituptn di Story</label>}
    </>}
    <label className="control-check"><input type="checkbox" checked={config.prize.enabled} onChange={e => update({ ...config, prize: { ...config.prize, enabled: e.target.checked } })} /> Pengumuman hadiah</label>
    {config.prize.enabled && <div className={styles.grid}>
      <label className="field-label">Jumlah pemenang<input className="field-input" type="number" min={1} max={100} required value={config.prize.winners} onChange={e => update({ ...config, prize: { ...config.prize, winners: Number(e.target.value) } })} /></label>
      <label className="field-label">Jenis hadiah<input className="field-input" maxLength={80} required value={config.prize.type} onChange={e => update({ ...config, prize: { ...config.prize, type: e.target.value } })} /></label>
      <label className="field-label">Nominal atau informasi tambahan<input className="field-input" maxLength={500} value={config.prize.info} onChange={e => update({ ...config, prize: { ...config.prize, info: e.target.value } })} /></label>
    </div>}
    <label className="control-check"><input type="checkbox" checked={config.community.enabled} onChange={e => update({ ...config, community: { ...config.community, enabled: e.target.checked } })} /> Undangan Komunitas JITU</label>
    {config.community.enabled && <label className="field-label">URL undangan komunitas<input type="url" required className="field-input" value={config.community.url} onChange={e => update({ ...config, community: { ...config.community, url: e.target.value } })} /></label>}
  </fieldset>;
}
