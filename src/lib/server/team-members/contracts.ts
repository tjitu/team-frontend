export type MemberRole = 'SYSTEM_OWNER' | 'SYSTEM_ADMIN' | 'MEMBER' | 'AFFILIATOR';
export interface MemberInput {
  email: string; name: string; username: string | null; role: MemberRole; password: string;
}
export interface Actor { id: string; role: MemberRole; isActive: boolean }
export interface CreatedMember extends Actor {
  userId: string; email: string; name: string; username: string | null;
}
export class MemberError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
// A lost COMMIT response must never cause deletion of an account that may exist.
export class UncertainMemberWrite extends MemberError {
  constructor() { super(503, 'Account status could not be confirmed. Refresh the member list before trying again.'); }
}
export function parseMemberInput(value: unknown): MemberInput {
  if (!value || typeof value !== 'object') throw new MemberError(400, 'Invalid account details.');
  const data = value as Record<string, unknown>;
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const username = typeof data.username === 'string' ? data.username.trim().toLowerCase() || null : null;
  const password = typeof data.password === 'string' ? data.password : '';
  const role = data.role ?? 'MEMBER';
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MemberError(400, 'Enter a valid email address.');
  if (name.length < 2 || name.length > 120) throw new MemberError(400, 'Full name must contain 2–120 characters.');
  if (username && (username.length < 3 || username.length > 40 || !/^[a-z0-9][a-z0-9._-]+$/.test(username))) {
    throw new MemberError(400, 'Username must contain 3–40 lowercase letters, numbers, periods, underscores, or hyphens.');
  }
  if (password.length < 12 || password.length > 72) throw new MemberError(400, 'Initial password must contain 12–72 characters.');
  if (!['SYSTEM_OWNER', 'SYSTEM_ADMIN', 'MEMBER', 'AFFILIATOR'].includes(String(role))) throw new MemberError(400, 'Invalid team role.');
  return { email, name, username, password, role: role as MemberRole };
}
export function requireCreationAccess(actor: Actor | undefined, role: MemberRole) {
  if (!actor?.isActive || !['SYSTEM_OWNER', 'SYSTEM_ADMIN'].includes(actor.role)) {
    throw new MemberError(403, 'System Owner or System Admin access is required.');
  }
  if (role === 'SYSTEM_OWNER') throw new MemberError(403, 'System Owner access can only be assigned through the bootstrap process.');
  if (role === 'SYSTEM_ADMIN' && actor.role !== 'SYSTEM_OWNER') {
    throw new MemberError(403, 'Only the System Owner can create a System Admin account.');
  }
}
