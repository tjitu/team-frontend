'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AffiliateReport } from './types';

export function useAffiliate(endpoint = '/team/affiliate/me') {
  const [data,setData] = useState<AffiliateReport | null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [from,setFrom] = useState('');
  const [to,setTo] = useState('');
  const [offset,setOffset] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ limit: '100',offset: String(offset) });
    if (from) params.set('from',`${from}T00:00:00+07:00`);
    if (to) params.set('to',new Date(new Date(`${to}T00:00:00+07:00`).getTime()+86400000).toISOString());
    try { setData(await api.get<AffiliateReport>(`${endpoint}?${params}`,{ force: true })); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Data afiliasi tidak dapat dimuat.';
      if (message.includes('AGREEMENT_REQUIRED') && endpoint==='/team/affiliate/me') window.location.replace('/affiliate/agreement');
      else setError(message);
    } finally { setLoading(false); }
  },[endpoint,from,to,offset]);
  useEffect(() => { void load(); },[load]);
  return { data,error,loading,load,from,to,offset,setOffset,
    setFrom: (value: string) => { setFrom(value); setOffset(0); },setTo: (value: string) => { setTo(value); setOffset(0); } };
}
export function useServerClock(serverTime?: string) {
  const [now,setNow] = useState(Date.now());
  useEffect(() => {
    const started = Date.now(); const server = serverTime ? new Date(serverTime).getTime() : started;
    setNow(server);
    const timer = setInterval(() => setNow(server+Date.now()-started),1000);
    return () => clearInterval(timer);
  },[serverTime]);
  return now;
}
