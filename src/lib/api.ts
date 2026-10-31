import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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

export interface ManagedMember extends Omit<CurrentMember, 'departments'> {
  isActive: boolean;
  createdAt: string;
  departments: Array<{ department: { id: string; name: string; slug: string } }>;
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

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  confirmedPayments: number;
}

export interface RevenueSummary {
  configured: boolean;
  totalRevenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  monthlyRevenue: MonthlyRevenue[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  departmentId: string;
  startsAt: string | null;
  endsAt: string | null;
  department: Pick<Department, 'id' | 'name' | 'slug'> & { isActive?: boolean };
  createdBy: TeamMember;
  version: number;
  updatedAt: string;
  createdAt: string;
  archivedAt: string | null;
  _count?: { members: number };
  members?: Array<{ id: string; role: ProjectRole; teamMember: TeamMember }>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  attachments?: string[];
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

export interface TaskListPage {
  items: Task[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface RequestOptions {
  /** Maximum age in milliseconds for using cached data. Default: 60_000 (1 min). */
  cacheMs?: number;
  /** When true, bypasses the in-memory cache and forces a fresh network call. */
  force?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
let cachedSessionToken: { token: string; expiresAt: number } | null = null;

export function clearSessionCache() {
  cachedSessionToken = null;
  memoryCache.clear();
  inFlightRequests.clear();
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedSessionToken && cachedSessionToken.expiresAt > now) {
    return cachedSessionToken.token;
  }
  const { data: { session }, error: sessionError } = await createSupabaseBrowserClient().auth.getSession();
  if (sessionError || !session?.access_token) {
    cachedSessionToken = null;
    throw new Error('SESSION_EXPIRED');
  }
  // Cache token in memory for up to 30 seconds to prevent constant async storage locks
  cachedSessionToken = {
    token: session.access_token,
    expiresAt: now + 30_000,
  };
  return session.access_token;
}

function invalidateForPath(path: string) {
  if (path.includes('/projects')) {
    api.invalidate('/team/projects');
    api.invalidate('/team/control-center/overview');
  }
  if (path.includes('/tasks')) {
    api.invalidate('/team/tasks');
    api.invalidate('/team/projects');
    api.invalidate('/team/activity');
  }
  if (path.includes('/departments')) {
    api.invalidate('/team/departments');
    api.invalidate('/team/projects');
  }
  if (path.includes('/members') || path.includes('/invitations')) {
    api.invalidate('/team/members');
    api.invalidate('/team/me');
    api.invalidate('/team/invitations');
  }
  if (path.includes('/control-center')) {
    api.invalidate('/team/control-center');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new Error('The service could not be reached. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      cachedSessionToken = null;
      throw new Error('SESSION_EXPIRED');
    }
    const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> => {
    const cacheMs = options?.cacheMs ?? 60_000;
    const force = Boolean(options?.force);

    if (!force) {
      const cached = memoryCache.get(path);
      if (cached && Date.now() - cached.timestamp < cacheMs) {
        return Promise.resolve(cached.data as T);
      }

      const pending = inFlightRequests.get(path);
      if (pending) {
        return pending as Promise<T>;
      }
    }

    const requestPromise = request<T>(path)
      .then((data) => {
        memoryCache.set(path, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(path);
      });

    inFlightRequests.set(path, requestPromise);
    return requestPromise;
  },

  getCached: <T>(path: string, maxAgeMs = 600_000): T | null => {
    const cached = memoryCache.get(path);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > maxAgeMs) {
      memoryCache.delete(path);
      return null;
    }
    return cached.data as T;
  },

  setCached: <T>(path: string, data: T): void => {
    memoryCache.set(path, { data, timestamp: Date.now() });
  },

  invalidate: (pattern?: string | RegExp): void => {
    if (!pattern) {
      memoryCache.clear();
      return;
    }
    for (const key of Array.from(memoryCache.keys())) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        memoryCache.delete(key);
      }
    }
  },

  post: <T>(path: string, body?: unknown) => {
    invalidateForPath(path);
    return request<T>(path, {
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  },
  patch: <T>(path: string, body: unknown) => {
    invalidateForPath(path);
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  delete: <T>(path: string) => {
    invalidateForPath(path);
    return request<T>(path, { method: 'DELETE' });
  },
};

export const isAdministrator = (role?: TeamRole) => role === 'SYSTEM_OWNER' || role === 'SYSTEM_ADMIN';

export function signInUrl() {
  if (typeof window === 'undefined') return '/login';
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(returnTo)}`;
}
