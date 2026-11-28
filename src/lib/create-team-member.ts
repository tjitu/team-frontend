import { api } from './api';
import { isSessionExpiredDueToInactivity, performInactivityLogout, recordActivity } from './session';

export async function createTeamAccount(input: { email: string; name: string; username?: string; role: string; password: string }) {
  if (isSessionExpiredDueToInactivity()) {
    void performInactivityLogout();
    throw new Error('Your session has expired. Sign in again.');
  }
  recordActivity();
  const response = await fetch('/api/team/members', { method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), cache: 'no-store' });
  const payload = await response.json() as { email: string; message?: string };
  if (!response.ok) throw new Error(payload.message || 'Could not create the team account.');
  api.invalidate('/team/members');
  api.invalidate('/team/activity');
  return payload;
}
