'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ComboboxSelect } from '@/components/ui/combobox';
import type { AffiliateListItem } from './types';

export function AssignedAffiliator({ value,onChange }: { value: string; onChange: (value: string) => void }) {
  const [items,setItems] = useState<AffiliateListItem[]>([]);
  const [error,setError] = useState('');
  useEffect(() => {
    let active=true;
    api.get<AffiliateListItem[]>('/team/affiliate/admin',{ force: true }).then(rows => { if (active) setItems(rows); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Affiliators tidak dapat dimuat.'); });
    return () => { active=false; };
  },[]);
  return <div className="field-label"><span>Assigned Affiliator</span><ComboboxSelect ariaLabel="Assigned Affiliator" searchable fullWidth value={value}
    onValueChange={onChange} options={[{ value: '',label: 'Unassigned · promotional code' },...items.filter(item => item.isActive || item.id===value).map(item => ({ value: item.id,label: `${item.name} · ${item.identifier}${item.isActive ? '' : ' (inactive)'}` }))]} />
    {error && <span className="form-error" role="alert">{error}</span>}
    {value && <span className="subtle-link">Discount and commission follow the affiliator configuration. Existing validity, limits, and status still apply.</span>}
  </div>;
}
