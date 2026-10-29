const API_URL = (process.env.NEXT_PUBLIC_TEAM_API_URL ?? 'http://localhost:3200/api').replace(/\/$/, '');

export type TeamRole = 'SYSTEM_OWNER' | 'SYSTEM_ADMIN' | 'MEMBER';
export type ProjectRole = 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export interface CurrentMember extends TeamMember {
  userId: string;
  role: TeamRole;
  departments: Array<{ id: string; name: string; slug: string }>;
}

export interface ManagedMember extends CurrentMember {
  isActive: boolean;
  createdAt: string;
}

export type InvitationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'ACCEPTED' | 'REVOKED';

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdBy: TeamMember;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
}

export interface DepartmentMember {
  id: string;
  createdAt: string;
  teamMember: TeamMember & { role: TeamRole };
}

export interface ActivityRecord {
  id: string;
  actorTeamMemberId: string;
  projectId: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: TeamMember & { role: TeamRole };
  project: Pick<Project, 'id' | 'name' | 'slug'> | null;
}

export interface ActivityPage {
  items: ActivityRecord[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  updatedAt: string;
  createdAt: string;
  _count?: { members: number };
  members?: Array<{ id: string; role: ProjectRole; teamMember: TeamMember }>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  version: number;
  dueAt: string | null;
  updatedAt: string;
  createdAt: string;
  assignees: Array<{ teamMember: TeamMember }>;
  createdBy: TeamMember;
  _count?: { comments: number };
  comments?: Array<{ id: string; body: string; createdAt: string; author: TeamMember }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new Error('Layanan tidak dapat dihubungi. Periksa koneksi, lalu muat ulang.');
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('SESSION_EXPIRED');
    const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || `Permintaan gagal (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }),
  patch: <T>(path: string, body: unknown) => request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const isAdministrator = (role?: TeamRole) => role === 'SYSTEM_OWNER' || role === 'SYSTEM_ADMIN';

export function signInUrl() {
  return process.env.NEXT_PUBLIC_SIGN_IN_URL ?? 'http://localhost:5173/login';
}
