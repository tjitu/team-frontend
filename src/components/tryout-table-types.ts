import type { TryoutCurationStatus } from './question-lifecycle-types';
import type { GrowthConfig } from './registration-growth/types';

export type TryoutLifecycle = 'DRAFT' | 'PUBLIC' | 'LIVE';

export interface Tryout {
  growthConfig?: GrowthConfig;
  growthVersion?: number;
  id: string;
  code: number;
  title: string;
  description: string | null;
  solutionPrice: number;
  batch: 'SNBT' | 'MANDIRI';
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: string;
  lifecycleStatus?: TryoutLifecycle;
  curationStatus?: TryoutCurationStatus;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  totalDurationMinutes?: number;
  isPublic: boolean;
  referralCode: string | null;
  questionCount?: number;
  readyQuestionCount?: number;
  registrantCount?: number;
  notStartedCount?: number;
  inProgressCount?: number;
  finishedCount?: number;
}

export interface TryoutActions {
  onAutoBalance: (tryout: Tryout) => void;
  onManageQuestions: (tryout: Tryout) => void;
  onSandbox: (tryout: Tryout) => Promise<void>;
  onWorkflow: (tryout: Tryout, action: 'PUBLISH_CATALOG' | 'UNPUBLISH') => Promise<void>;
  onEdit: (tryout: Tryout) => void;
  onDelete: (tryout: Tryout) => Promise<void>;
  onParticipantsChanged: () => void;
}
