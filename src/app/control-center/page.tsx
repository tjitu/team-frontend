'use client';

import * as React from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createColumnHelper } from '@tanstack/react-table';
import { api, CurrentMember, RevenueSummary, signInUrl } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { type DataTableFeatures } from '@/components/ui/data-table-features';
import { ComboboxSelect } from '@/components/ui/combobox';
import {
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Ban,
  CreditCard,
  PenTool,
  Sliders,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Percent,
  Tag,
  Flame,
  Crown,
  Coins,
  Ticket,
  BookOpen,
  Plus,
  FolderPlus,
  Clock,
  XCircle,
  Wallet,
  QrCode,
  Calendar,
  Layers,
  ListChecks,
  ShoppingBag,
  FlaskConical,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCartoonAvatarUrl } from '@/lib/avatar';
import { PixelCoin } from '@/components/pixel-coin';

import {
  AlertTriangle as QcAlertIcon,
  Archive as QcArchiveIcon,
  CheckCircle2 as QcCheckIcon,
  RotateCcw as QcRestoreIcon,
  Send as QcSendIcon,
} from 'lucide-react';
import { PracticeSection } from '@/components/practice-section';
import { TryoutQuestionsSection } from '@/components/tryout-questions-section';
import { SoalAsliSection } from '@/components/soal-asli-section';
import { KotakRevisiBanner, BulkRevisionModal, RevisionRequestModal } from '@/components/question-workflow-modals';
import {
  QuestionBatchField,
  mergeBatchSummaries,
  type QuestionBatchSummary,
} from '@/components/question-batch-field';
import {
  buildAutoBalancedBatchPrompt,
  computePackageAutoBalancePlan,
  DIFFICULTY_COMPOSITION_PRESETS,
  getQuestionStatusBadge,
  getSubtestDisplay,
  getTryoutStatusBadge,
  normalizeDifficultyComposition,
  normalizeSubtestKey,
  OFFICIAL_SNBT_SUBTEST_SPEC,
  SOLUTION_FORMATTING_RULES,
  type AutoBalanceSlot,
  type DifficultyComposition,
  type QuestionLifecycleStatus,
  type TryoutAssignedQuestion,
  type TryoutCurationStatus,
} from '@/components/question-lifecycle-types';

const JITU_MAIN_URL = (
  process.env.NEXT_PUBLIC_JITU_MAIN_URL ||
  process.env.NEXT_PUBLIC_MAIN_APP_URL ||
  'http://localhost:5173'
).replace(/\/+$/, '');

export type Section = 'tryouts' | 'pricing' | 'vouchers' | 'discounts' | 'users' | 'articles' | 'careers' | 'payments' | 'questions' | 'practice' | 'soal-asli' | 'curriculum';

export type Voucher = {
  id: string;
  code: string;
  discountPercent: number;
  commissionPercent: number;
  maxDiscount?: number | null;
  minPurchase: number;
  maxUsage?: number | null;
  usedCount: number;
  totalUsed: number;
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  referrerName: string | null;
  issuedToUserId?: string | null;
  issuedToName?: string | null;
  issuedToEmail?: string | null;
  issuedByUserId?: string | null;
  issuedByName?: string | null;
  issuedByEmail?: string | null;
  resolvedIssuedToName?: string | null;
  resolvedIssuedToEmail?: string | null;
  resolvedIssuedToImage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VoucherForm = {
  code: string;
  discountPercent: string;
  commissionPercent: string;
  issuedToUserId: string;
  issuedToName: string;
  issuedToEmail: string;
  maxDiscount: string;
  minPurchase: string;
  maxUsage: string;
  expiresAt: string;
  description: string;
  referrerName: string;
  isActive: boolean;
};

const initialVoucherForm: VoucherForm = {
  code: '',
  discountPercent: '20',
  commissionPercent: '10',
  issuedToUserId: '',
  issuedToName: '',
  issuedToEmail: '',
  maxDiscount: '',
  minPurchase: '0',
  maxUsage: '',
  expiresAt: '',
  description: '',
  referrerName: '',
  isActive: true,
};

export type Discount = {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  startDate: string;
  endDate: string;
  packageId: string | null;
  badgeText: string;
  badgeStyle: string;
  issuedByUserId?: string | null;
  issuedByName?: string | null;
  issuedByEmail?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  packageName?: string | null;
  packageTokens?: number | null;
  packagePrice?: number | null;
};

export type DiscountForm = {
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  startDate: string;
  endDate: string;
  packageId: string;
  badgeText: string;
  badgeStyle: string;
  issuedByUserId?: string | null;
  issuedByName?: string | null;
  issuedByEmail?: string | null;
  isActive: boolean;
};

export const initialDiscountForm: DiscountForm = {
  name: '',
  type: 'PERCENTAGE',
  value: '25',
  startDate: '',
  endDate: '',
  packageId: '',
  badgeText: 'DISKON 25%',
  badgeStyle: 'RED_FIRE',
  isActive: true,
};

export type Tryout = {
  id: string;
  code: number;
  title: string;
  description: string | null;
  solutionPrice: number;
  batch: 'SNBT' | 'MANDIRI';
  releaseDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: string;
  curationStatus?: TryoutCurationStatus;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  totalDurationMinutes?: number;
  isPublic: boolean;
  referralCode: string | null;
  questionCount?: number;
  readyQuestionCount?: number;
};

export type Package = {
  id: string;
  name: string;
  tokenAmount: number;
  price: number;
  isActive: boolean;
  paymentCount?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'USER' | 'ADMIN';
  target: string | null;
  tokenBalance: number;
  currentStreak?: number;
  isBanned?: boolean;
  emailVerified?: boolean;
  isSandbox?: boolean;
  createdAt: string;
};

export type PaymentLog = {
  id: string;
  orderId: string;
  amount: number;
  tokenAmount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'DECLINED';
  paymentMethod: string;
  snapToken?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: User | null;
  tokenPackage?: {
    id: string;
    name: string;
    price: number;
  } | null;
};

export type PaymentSummary = {
  configured: boolean;
  totalRevenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  cancelledPayments: number;
  declinedPayments: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    confirmedPayments: number;
    pendingPayments: number;
    cancelledPayments: number;
  }>;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  category: string;
  tags: string;
  authorName: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  readTimeMinutes: number;
  viewsCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};


export type QuestionOption = {
  id?: string;
  content: string;
  isCorrect: boolean;
  order: number;
};

export type SolutionStep = {
  stepNumber: number;
  category?: string;
  title: string;
  content: string;
};

export type QuestionItem = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  pattern?: string | null;
  batch?: string | null;
  subtopicTitle?: string | null;
  topicTitle?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'COMPLEX_MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
  target: 'DRAFT' | 'SANDBOX' | 'FOR_TRYOUT' | 'FOR_PRACTICE' | 'SOAL_ASLI' | 'BANK';
  status?: 'DRAFT' | 'QC_SANDBOX' | 'NEEDS_REVISION' | 'READY' | 'RETIRED' | string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  tryoutCode?: number | null;
  tryoutStatus?: string | null;
  isLockedInTryout?: boolean;
  isPracticeAssigned?: boolean;
  attemptCount?: number;
  packageId?: string | null;
  packageTitle?: string | null;
  narration?: string | null;
  content: string;
  imageUrl?: string | null;
  points: number;
  correctAnswer?: string | null;
  createdAt: string;
  options: QuestionOption[];
  solution?: {
    id?: string;
    steps?: SolutionStep[] | null;
    staticContent?: string | null;
    quickTrick?: string | null;
    keyFormula?: string | null;
    defaultView?: string;
  } | null;
};

export type TopicItem = {
  id: string;
  subtest: string;
  title: string;
  slug: string;
  order: number;
  subtopics: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    patterns?: string[];
  }>;
};

export type QuestionForm = {
  subtest: string;
  topicId: string;
  subtopicId: string;
  pattern: string;
  batch: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  target: 'DRAFT' | 'SANDBOX' | 'FOR_TRYOUT' | 'FOR_PRACTICE' | 'SOAL_ASLI' | 'BANK';
  status?: string;
  tryoutId: string;
  packageId: string;
  narration: string;
  content: string;
  imageUrl: string;
  points: string;
  correctAnswer: string;
  answerFormatGuide: string;
  options: Array<{ content: string; isCorrect: boolean; order: number }>;
  keyFormula: string;
  quickTrick: string;
  staticExplanation: string;
  solutionSteps: Array<{ stepNumber: number; category: string; title: string; content: string }>;
};

const initialQuestionForm: QuestionForm = {
  subtest: 'PENGETAHUAN_KUANTITATIF',
  topicId: '',
  subtopicId: '',
  pattern: '',
  batch: '',
  difficulty: 'MEDIUM',
  type: 'MULTIPLE_CHOICE',
  target: 'DRAFT',
  status: 'DRAFT',
  tryoutId: '',
  packageId: '',
  narration: '',
  content: '',
  imageUrl: '',
  points: '1',
  correctAnswer: '',
  answerFormatGuide: 'Bilangan Bulat Non-Negatif (0-9999)',
  options: [
    { content: '', isCorrect: true, order: 1 },
    { content: '', isCorrect: false, order: 2 },
    { content: '', isCorrect: false, order: 3 },
    { content: '', isCorrect: false, order: 4 },
    { content: '', isCorrect: false, order: 5 },
  ],
  keyFormula: '',
  quickTrick: '',
  staticExplanation: '',
  solutionSteps: [
    { stepNumber: 1, category: 'Pahami Soal', title: 'Cari Tahu Targetnya', content: '' },
    { stepNumber: 2, category: 'Tahap 1', title: 'Langkah Pengerjaan', content: '' },
    { stepNumber: 3, category: 'Kesimpulan', title: 'Jadi Jawabannya...', content: '' },
  ],
};

export type CareerApplication = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  university: string;
  major: string | null;
  academicStatus: string | null;
  domicile: string | null;
  primaryRole: string;
  primaryDivision: string;
  secondaryRole: string | null;
  availability: string | null;
  startDate: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  experienceEssay: string | null;
  motivationEssay: string | null;
  referralSource: string | null;
  commitmentAgreed: boolean | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type TryoutForm = {
  title: string;
  description: string;
  solutionPrice: string;
  batch: 'SNBT' | 'MANDIRI';
  releaseDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  isPublic: boolean;
  referralCode: string;
};

type PackageForm = {
  name: string;
  tokenAmount: string;
  price: string;
  isActive: boolean;
};

type ArticleForm = {
  title: string;
  slug: string;
  category: string;
  tags: string;
  authorName: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  readTimeMinutes: string;
  coverImageUrl: string;
  summary: string;
  content: string;
};

const initialTryoutForm: TryoutForm = {
  title: '',
  description: '',
  solutionPrice: '1',
  batch: 'SNBT',
  releaseDate: '',
  scheduledStart: '',
  scheduledEnd: '',
  isPublic: true,
  referralCode: '',
};

const initialPackageForm: PackageForm = {
  name: '',
  tokenAmount: '1',
  price: '',
  isActive: true,
};

const initialArticleForm: ArticleForm = {
  title: '',
  slug: '',
  category: 'UTBK-SNBT',
  tags: 'UTBK, PTN, Tips Belajar',
  authorName: 'Tim Jitu PTN',
  status: 'PUBLISHED',
  readTimeMinutes: '3',
  coverImageUrl: '',
  summary: '',
  content: '',
};

const sections: Array<{ id: Section; label: string }> = [
  { id: 'tryouts', label: 'Tryouts' },
  { id: 'questions', label: 'Bank Soal' },
  { id: 'practice', label: 'Latihan' },
  { id: 'soal-asli', label: 'Arsip Soal' },
  { id: 'curriculum', label: 'Materi & Kurikulum' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'users', label: 'Users' },
  { id: 'articles', label: 'Articles' },
  { id: 'careers', label: 'Careers' },
  { id: 'payments', label: 'Payments' },
];

const ALL_SUBTESTS = [
  { id: 'PENALARAN_UMUM', code: 'PU', shortLabel: 'Penalaran Umum', label: 'Penalaran Umum (PU)' },
  { id: 'PENGETAHUAN_KUANTITATIF', code: 'PK', shortLabel: 'Pengetahuan Kuantitatif', label: 'Pengetahuan Kuantitatif (PK)' },
  { id: 'PENALARAN_MATEMATIKA', code: 'PM', shortLabel: 'Penalaran Matematika', label: 'Penalaran Matematika (PM)' },
  { id: 'PEMAHAMAN_BACAAN_MENULIS', code: 'PBM', shortLabel: 'Bacaan & Menulis', label: 'Pemahaman Bacaan & Menulis (PBM)' },
  { id: 'PENGETAHUAN_PEMAHAMAN_UMUM', code: 'PPU', shortLabel: 'Pengetahuan Umum', label: 'Pengetahuan & Pemahaman Umum (PPU)' },
  { id: 'LITERASI_INDONESIA', code: 'LBI', shortLabel: 'Literasi Indonesia', label: 'Literasi Bahasa Indonesia (LBI)' },
  { id: 'LITERASI_INGGRIS', code: 'LBE', shortLabel: 'Literasi Inggris', label: 'Literasi Bahasa Inggris (LBE)' },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
}

function formatDate(value?: string | null) {
  return value ? dateLabel.format(new Date(value)) : 'Not scheduled';
}

function formatMonth(value: string) {
  return monthLabel.format(new Date(`${value}-01T00:00:00.000Z`));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not complete this action.';
}

function autoSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Column Helpers for Data Tables
const tryoutColHelper = createColumnHelper<DataTableFeatures, Tryout>();
const packageColHelper = createColumnHelper<DataTableFeatures, Package>();
const discountColHelper = createColumnHelper<DataTableFeatures, Discount>();
const userColHelper = createColumnHelper<DataTableFeatures, User>();
const articleColHelper = createColumnHelper<DataTableFeatures, Article>();
const careerColHelper = createColumnHelper<DataTableFeatures, CareerApplication>();
const questionColHelper = createColumnHelper<DataTableFeatures, QuestionItem>();
const paymentColHelper = createColumnHelper<DataTableFeatures, PaymentLog>();
const voucherColHelper = createColumnHelper<DataTableFeatures, Voucher>();

const BADGE_STYLES = [
  { id: 'RED_FIRE', label: 'Flame Red', icon: Flame, className: 'discount-badge-red', gradient: 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white' },
  { id: 'GOLD_PREMIUM', label: 'Luxury Gold', icon: Crown, className: 'discount-badge-gold', gradient: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black' },
  { id: 'EMERALD_SAVE', label: 'Emerald Save', icon: Sparkles, className: 'discount-badge-emerald', gradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white' },
  { id: 'CYAN_ELECTRIC', label: 'Neon Cyan', icon: Zap, className: 'discount-badge-cyan', gradient: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white' },
  { id: 'PURPLE_ROYAL', label: 'Royal Purple', icon: Tag, className: 'discount-badge-purple', gradient: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white' },
];

function getBadgeClass(style: string) {
  const match = BADGE_STYLES.find((s) => s.id === style);
  return match ? match.className : 'discount-badge-red';
}

function getBadgeGradient(style?: string) {
  switch (style) {
    case 'RED_FIRE':
      return 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white';
    case 'GOLD_PREMIUM':
      return 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black';
    case 'EMERALD_SAVE':
      return 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white';
    case 'CYAN_ELECTRIC':
      return 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white';
    case 'PURPLE_ROYAL':
      return 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white';
    default:
      return 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white';
  }
}

function getBadgeIcon(style: string) {
  const match = BADGE_STYLES.find((s) => s.id === style);
  return match ? match.icon : Flame;
}

const LANDING_QUOTA_PACKS = [
  {
    id: 'pack-1',
    quota: 1,
    totalPrice: 15000,
    perTryout: 15000,
    note: 'Cocok untuk coba 1 sesi tryout, cek rincian jawabanmu, dan akses skor IRT.',
  },
  {
    id: 'pack-3',
    quota: 3,
    totalPrice: 39000,
    perTryout: 13000,
    note: 'Mulai bangun ritme latihan mingguan dan evaluasi subtes yang butuh perbaikan.',
  },
  {
    id: 'pack-5',
    quota: 5,
    totalPrice: 59000,
    perTryout: 11800,
    note: 'Paling pas untuk persiapan sebulan penuh dan pantau kenaikan skor konsisten.',
  },
  {
    id: 'pack-10',
    quota: 10,
    totalPrice: 89000,
    perTryout: 8900,
    note: 'Paket lengkap persiapan intensif agar makin percaya diri.',
    isBestValue: true,
  },
];

function ControlCenterContent() {
  const searchParams = useSearchParams();
  const urlSec = searchParams?.get('section') as Section | null;
  const [section, setSection] = React.useState<Section>(() => {
    if (urlSec && ['tryouts', 'pricing', 'vouchers', 'discounts', 'users', 'articles', 'careers', 'payments', 'questions', 'practice', 'soal-asli', 'curriculum'].includes(urlSec)) {
      return urlSec;
    }
    return 'tryouts';
  });
  const [member, setMember] = React.useState<CurrentMember | null>(() => api.getCached<CurrentMember>('/team/me'));
  const [tryouts, setTryouts] = React.useState<Tryout[]>(() => api.getCached<Tryout[]>('/team/control-center/tryouts') ?? []);
  const [packages, setPackages] = React.useState<Package[]>(() => api.getCached<Package[]>('/team/control-center/packages') ?? []);
  const [vouchers, setVouchers] = React.useState<Voucher[]>(() => api.getCached<Voucher[]>('/team/control-center/vouchers') ?? []);
  const [voucherForm, setVoucherForm] = React.useState<VoucherForm>(initialVoucherForm);
  const [voucherFormOpen, setVoucherFormOpen] = React.useState(false);
  const [editingVoucher, setEditingVoucher] = React.useState<string | null>(null);
  const [voucherFilter, setVoucherFilter] = React.useState('ALL');
  const [discounts, setDiscounts] = React.useState<Discount[]>(() => api.getCached<Discount[]>('/team/control-center/discounts') ?? []);
  const [discountForm, setDiscountForm] = React.useState<DiscountForm>(initialDiscountForm);
  const [discountFormOpen, setDiscountFormOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [activeUserTab, setActiveUserTab] = React.useState<'REGULAR' | 'SANDBOX'>('REGULAR');
  const [sandboxConfirmModal, setSandboxConfirmModal] = React.useState<{
    isOpen: boolean;
    user: User | null;
    targetState: boolean;
    loading: boolean;
  }>({
    isOpen: false,
    user: null,
    targetState: true,
    loading: false,
  });

  const regularUsers = React.useMemo(() => users.filter((u) => !u.isSandbox), [users]);
  const sandboxUsers = React.useMemo(() => users.filter((u) => Boolean(u.isSandbox)), [users]);
  const [articles, setArticles] = React.useState<Article[]>(() => api.getCached<Article[]>('/team/control-center/articles') ?? []);
  const [applications, setApplications] = React.useState<CareerApplication[]>([]);
  const [summary, setSummary] = React.useState<RevenueSummary | null>(() => api.getCached<RevenueSummary>('/team/control-center/revenue'));
  const [payments, setPayments] = React.useState<PaymentLog[]>([]);
  const [paymentSummary, setPaymentSummary] = React.useState<PaymentSummary | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<string>('ALL');
  const [selectedUserForModal, setSelectedUserForModal] = React.useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = React.useState(false);
  const [banningUserId, setBanningUserId] = React.useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [previewMode, setPreviewMode] = React.useState<'all' | 'pass' | 'coins'>('all');

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Questions State
  const [questions, setQuestions] = React.useState<QuestionItem[]>([]);
  const [topics, setTopics] = React.useState<TopicItem[]>(() => api.getCached<TopicItem[]>('/team/control-center/topics') ?? []);
  const [questionForm, setQuestionForm] = React.useState<QuestionForm>(initialQuestionForm);
  const [questionFormOpen, setQuestionFormOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = React.useState<QuestionItem | null>(null);
  const [aiImportOpen, setAiImportOpen] = React.useState(false);
  const [aiJsonInput, setAiJsonInput] = React.useState('');
  const [previewSlideIdx, setPreviewSlideIdx] = React.useState(0);
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [workflowBusyId, setWorkflowBusyId] = React.useState<string | null>(null);
  const [sandboxOpeningId, setSandboxOpeningId] = React.useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = React.useState<string[]>([]);
  const [bulkMovingStatus, setBulkMovingStatus] = React.useState<QuestionLifecycleStatus | null>(null);
  const [bulkRevisionModal, setBulkRevisionModal] = React.useState<{
    open: boolean;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    notes: '',
    submitting: false,
  });
  const lastSelectedQuestionIdRef = React.useRef<string | null>(null);
  const shiftSelectPendingRef = React.useRef<boolean>(false);
  const filteredQuestionIdsRef = React.useRef<string[]>([]);
  const [practiceRefreshKey, setPracticeRefreshKey] = React.useState(0);
  const [managingTryoutId, setManagingTryoutId] = React.useState<string | null>(null);
  const [revisionModal, setRevisionModal] = React.useState<{
    open: boolean;
    question: QuestionItem | null;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    question: null,
    notes: '',
    submitting: false,
  });
  const [tryoutWorkspaceRefreshKey, setTryoutWorkspaceRefreshKey] = React.useState(0);
  const [tryoutStatusFilter, setTryoutStatusFilter] = React.useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [tryoutWorkflowBusyId, setTryoutWorkflowBusyId] = React.useState<string | null>(null);

  const tryoutStatusCounts = React.useMemo(() => {
    const counts = {
      DRAFT: 0,
      PUBLISHED: 0,
    };
    for (const item of tryouts) {
      const s = (item.curationStatus || 'DRAFT').toUpperCase();
      if (s === 'PUBLISHED') counts.PUBLISHED += 1;
      else counts.DRAFT += 1;
    }
    return counts;
  }, [tryouts]);

  const filteredTryouts = React.useMemo(() => {
    if (tryoutStatusFilter === 'ALL') return tryouts;
    if (tryoutStatusFilter === 'PUBLISHED') {
      return tryouts.filter((t) => (t.curationStatus || 'DRAFT').toUpperCase() === 'PUBLISHED');
    }
    return tryouts.filter((t) => (t.curationStatus || 'DRAFT').toUpperCase() !== 'PUBLISHED');
  }, [tryouts, tryoutStatusFilter]);

  async function runTryoutWorkflow(
    tryout: Tryout,
    action: 'APPROVE' | 'UNPUBLISH',
  ) {
    if (action === 'APPROVE') {
      const ok = window.confirm(
        `Publish Paket Tryout "${tryout.title}" ke halaman siswa? Pastikan seluruh soal di dalam paket ini sudah berstatus Siap (Ready).`,
      );
      if (!ok) return;
    }
    if (action === 'UNPUBLISH') {
      const ok = window.confirm(
        `Tarik Paket Tryout "${tryout.title}" kembali ke Draf? Tryout akan disembunyikan sementara dari daftar publik siswa.`,
      );
      if (!ok) return;
    }

    setTryoutWorkflowBusyId(tryout.id);
    setError('');
    try {
      await api.post(`/team/control-center/tryouts/${encodeURIComponent(tryout.id)}/workflow`, {
        action,
      });
      const fresh = await api.get<Tryout[]>('/team/control-center/tryouts', { force: true });
      setTryouts(fresh);
      setNotice(
        action === 'APPROVE'
          ? `Paket Tryout "${tryout.title}" resmi Published (Live) untuk siswa!`
          : `Paket Tryout "${tryout.title}" ditarik kembali ke Draf.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui status tryout.');
    } finally {
      setTryoutWorkflowBusyId(null);
    }
  }

  async function openTryoutSandboxPreview(tryout: Tryout) {
    setTryoutWorkflowBusyId(tryout.id);
    setError('');
    try {
      const res = await api.post<{ token: string }>('/team/control-center/sandbox-preview', {
        tryoutId: tryout.id,
      });
      const url = new URL(`/tryout/${encodeURIComponent(tryout.id)}`, JITU_MAIN_URL);
      url.searchParams.set('token', res.token);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      setNotice(`Pratinjau Sandbox "${tryout.title}" dibuka di tab baru.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal membuat sesi Sandbox Tryout.');
    } finally {
      setTryoutWorkflowBusyId(null);
    }
  }

  React.useEffect(() => {
    const handleDirty = () => {
      void api.get<Tryout[]>('/team/control-center/tryouts', { force: true }).then(setTryouts).catch(() => {});
    };
    const handleOpenBuilder = (ev: Event) => {
      const detail = (ev as CustomEvent<{
        subtestValue?: string;
        difficulty?: string;
        topicHint?: string;
      }>).detail;
      setManagingTryoutId(null);
      setSection('questions');
      if (detail?.subtestValue) {
        setPromptSubtestCounts({ [detail.subtestValue]: 4 });
      }
      if (detail?.difficulty) {
        setPromptDifficulty(detail.difficulty);
      }
      if (detail?.topicHint) {
        setPromptCustomTopic(detail.topicHint);
      }
      setIsPromptAdjusterOpen(false);
      setCreateMethodView('IMPORT_JSON');
      setCreateMethodModalOpen(true);
    };
    window.addEventListener('jitu:tryouts-dirty', handleDirty);
    window.addEventListener('jitu:open-tryout-question-builder', handleOpenBuilder);
    return () => {
      window.removeEventListener('jitu:tryouts-dirty', handleDirty);
      window.removeEventListener('jitu:open-tryout-question-builder', handleOpenBuilder);
    };
  }, []);

  // Question Creation Method & Prompt Engineering State
  const [createMethodModalOpen, setCreateMethodModalOpen] = React.useState(false);
  const [createMethodView, setCreateMethodView] = React.useState<'SELECT' | 'IMPORT_JSON'>('SELECT');
  const [isPromptAdjusterOpen, setIsPromptAdjusterOpen] = React.useState(false);
  const [importingBulk, setImportingBulk] = React.useState(false);

  // 3-Option Creation Destination & Auto-Balance State
  const [createTarget, setCreateTarget] = React.useState<'FOR_PRACTICE' | 'FOR_TRYOUT' | 'DRAFT'>('DRAFT');
  const [createTryoutId, setCreateTryoutId] = React.useState<string>('');
  const [autoBalanceEnabled, setAutoBalanceEnabled] = React.useState<boolean>(false);
  const [autoBalanceCount, setAutoBalanceCount] = React.useState<number>(5);
  const [autoBalanceIsianCount, setAutoBalanceIsianCount] = React.useState<number>(1);
  const [autoBalanceSubtestScope, setAutoBalanceSubtestScope] = React.useState<string>('AUTO');
  const [difficultyComposition, setDifficultyComposition] = React.useState<DifficultyComposition>({
    easy: 30,
    medium: 50,
    hard: 20,
  });
  const [customBalanceSlots, setCustomBalanceSlots] = React.useState<AutoBalanceSlot[] | null>(null);

  const normalizedDifficultyComposition = React.useMemo(
    () => normalizeDifficultyComposition(difficultyComposition),
    [difficultyComposition],
  );

  React.useEffect(() => {
    if (!createMethodModalOpen && !questionFormOpen) return;
    if (questions.length === 0) {
      void api.get<QuestionItem[]>('/team/control-center/questions').then(setQuestions).catch(() => {});
    }
    if (topics.length === 0) {
      void api.get<TopicItem[]>('/team/control-center/topics').then(setTopics).catch(() => {});
    }
    if (tryouts.length === 0) {
      void api.get<Tryout[]>('/team/control-center/tryouts').then(setTryouts).catch(() => {});
    }
  }, [createMethodModalOpen, questionFormOpen, questions.length, topics.length, tryouts.length]);

  const currentPackageQuestions = React.useMemo(() => {
    if (createTarget === 'FOR_TRYOUT') {
      if (!createTryoutId) return [];
      return questions.filter((q) => q.tryoutId === createTryoutId && q.status !== 'RETIRED');
    }
    if (createTarget === 'FOR_PRACTICE') {
      return questions.filter(
        (q) => (q.target === 'FOR_PRACTICE' || q.isPracticeAssigned) && q.status !== 'RETIRED',
      );
    }
    return questions.filter((q) => q.target !== 'SOAL_ASLI' && q.status !== 'RETIRED');
  }, [createTarget, createTryoutId, questions]);

  const autoBalanceAnalysis = React.useMemo(() => {
    return computePackageAutoBalancePlan({
      destination: createTarget,
      packageQuestions: currentPackageQuestions,
      curriculumTopics: topics as any,
      count: autoBalanceCount,
      scopeSubtest: autoBalanceSubtestScope,
      typeComposition: { isianCount: autoBalanceIsianCount },
      difficultyRatio: difficultyComposition,
    });
  }, [createTarget, currentPackageQuestions, topics, autoBalanceCount, autoBalanceSubtestScope, autoBalanceIsianCount, difficultyComposition]);

  React.useEffect(() => {
    setCustomBalanceSlots(null);
  }, [createTarget, createTryoutId, autoBalanceCount, autoBalanceSubtestScope, autoBalanceIsianCount, difficultyComposition]);

  const effectiveBalanceSlots = React.useMemo(() => {
    if (customBalanceSlots && customBalanceSlots.length === autoBalanceAnalysis.slots.length) {
      return customBalanceSlots;
    }
    return autoBalanceAnalysis.slots;
  }, [customBalanceSlots, autoBalanceAnalysis.slots]);

  const selectedCreateTryout = React.useMemo(
    () => tryouts.find((t) => t.id === createTryoutId) || null,
    [tryouts, createTryoutId],
  );

  const currentPackageLabel = React.useMemo(() => {
    if (createTarget === 'FOR_TRYOUT') {
      return selectedCreateTryout
        ? `Paket Tryout: ${selectedCreateTryout.title} (#${selectedCreateTryout.code})`
        : 'Paket Tryout';
    }
    if (createTarget === 'FOR_PRACTICE') {
      return 'Paket Global Latihan (/latihan)';
    }
    return 'Eksperimen (Bank Soal)';
  }, [createTarget, selectedCreateTryout]);

  function renderDifficultyCompositionControls(batchSummary?: string) {
    const rawTotal = difficultyComposition.easy + difficultyComposition.medium + difficultyComposition.hard;
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#e5e7eb' }}>
            Parameter Komposisi Level (Easy / Medium / Hard)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {batchSummary && (
              <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: 600 }}>
                {batchSummary}
              </span>
            )}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '999px',
                background: rawTotal === 100 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                color: rawTotal === 100 ? '#34d399' : '#fbbf24',
                border: rawTotal === 100 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              {rawTotal === 100
                ? 'Total: 100%'
                : `Input ${rawTotal} → Proporsi ${normalizedDifficultyComposition.easyPct}% / ${normalizedDifficultyComposition.mediumPct}% / ${normalizedDifficultyComposition.hardPct}%`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {DIFFICULTY_COMPOSITION_PRESETS.map((preset) => {
            const isActive =
              difficultyComposition.easy === preset.ratio.easy &&
              difficultyComposition.medium === preset.ratio.medium &&
              difficultyComposition.hard === preset.ratio.hard;
            return (
              <button
                key={preset.id}
                type="button"
                className="pill"
                onClick={() => setDifficultyComposition(preset.ratio)}
                style={{
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  padding: '3px 9px',
                  background: isActive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#6ee7b7' : 'var(--muted-fg)',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border)',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
          {(
            [
              { key: 'easy' as const, label: 'Easy / Mudah (%)', color: '#34d399', pct: normalizedDifficultyComposition.easyPct },
              { key: 'medium' as const, label: 'Medium / Sedang (%)', color: '#fbbf24', pct: normalizedDifficultyComposition.mediumPct },
              { key: 'hard' as const, label: 'Hard / HOTS (%)', color: '#fb7185', pct: normalizedDifficultyComposition.hardPct },
            ]
          ).map((item) => (
            <div key={item.key}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: item.color, display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>{item.label}</span>
                <span style={{ color: 'var(--muted-fg)' }}>Efektif {item.pct}%</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className="field-input"
                style={{ fontSize: '12px', width: '100%', padding: '5px 8px' }}
                value={difficultyComposition[item.key]}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                  setDifficultyComposition((prev) => ({ ...prev, [item.key]: val }));
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', height: '6px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ width: `${normalizedDifficultyComposition.easyPct}%`, background: '#10b981', transition: 'width 0.15s ease' }} />
          <div style={{ width: `${normalizedDifficultyComposition.mediumPct}%`, background: '#f59e0b', transition: 'width 0.15s ease' }} />
          <div style={{ width: `${normalizedDifficultyComposition.hardPct}%`, background: '#f43f5e', transition: 'width 0.15s ease' }} />
        </div>
      </div>
    );
  }

  // New Per-Subtest Count Stepper State
  const [promptSubtestCounts, setPromptSubtestCounts] = React.useState<Record<string, number>>({
    PENALARAN_MATEMATIKA: 5,
  });
  const [promptDifficulty, setPromptDifficulty] = React.useState<string>('MEDIUM');
  const [promptQuestionType, setPromptQuestionType] = React.useState<'PILIHAN_GANDA' | 'ISIAN_SINGKAT' | 'CAMPURAN'>('PILIHAN_GANDA');
  const [promptShortAnswerRule, setPromptShortAnswerRule] = React.useState<string>('INTEGER_BPPP');
  const [promptSelectedSubtopicId, setPromptSelectedSubtopicId] = React.useState<string>('');
  const [promptCustomTopic, setPromptCustomTopic] = React.useState<string>('');
  const [promptIncludePassage, setPromptIncludePassage] = React.useState<boolean>(true);
  const [promptIncludeTricks, setPromptIncludeTricks] = React.useState<boolean>(true);
  const [copiedPrompt, setCopiedPrompt] = React.useState<boolean>(false);

  // Curriculum State & Modal Forms
  const [curriculumSubtestFilter, setCurriculumSubtestFilter] = React.useState<string>('ALL');
  const [curriculumSearch, setCurriculumSearch] = React.useState<string>('');
  const [collapsedTopicIds, setCollapsedTopicIds] = React.useState<Record<string, boolean>>({});
  const [topicModalOpen, setTopicModalOpen] = React.useState<boolean>(false);
  const [subtopicModalOpen, setSubtopicModalOpen] = React.useState<boolean>(false);
  const [editingTopic, setEditingTopic] = React.useState<TopicItem | null>(null);
  const [editingSubtopic, setEditingSubtopic] = React.useState<{ id: string; topicId: string; title: string; slug: string; order: number; patterns?: string[] } | null>(null);
  const [activeParentTopic, setActiveParentTopic] = React.useState<TopicItem | null>(null);
  const [topicForm, setTopicForm] = React.useState<{ subtest: string; title: string; slug: string; order: number }>({
    subtest: 'PENALARAN_MATEMATIKA',
    title: '',
    slug: '',
    order: 1,
  });
  const [subtopicForm, setSubtopicForm] = React.useState<{ topicId: string; title: string; slug: string; order: number; patternsText: string }>({
    topicId: '',
    title: '',
    slug: '',
    order: 1,
    patternsText: '',
  });
  const [topicSaving, setTopicSaving] = React.useState(false);
  const [subtopicSaving, setSubtopicSaving] = React.useState(false);

  const activeSubtestEntries = React.useMemo(() => {
    return Object.entries(promptSubtestCounts).filter(([_, c]) => typeof c === 'number' && c > 0);
  }, [promptSubtestCounts]);

  const totalPromptCount = React.useMemo(() => {
    return activeSubtestEntries.reduce((sum, [_, c]) => sum + c, 0);
  }, [activeSubtestEntries]);

  const selectedSubtopicMeta = React.useMemo(() => {
    if (!promptSelectedSubtopicId) return null;
    for (const t of topics) {
      const s = t.subtopics.find((sub) => sub.id === promptSelectedSubtopicId);
      if (s) {
        const subtestMeta = ALL_SUBTESTS.find((sub) => sub.id === t.subtest);
        return {
          topicTitle: t.title,
          subtopicTitle: s.title,
          subtestId: t.subtest,
          subtestLabel: subtestMeta?.label || t.subtest,
          patterns: Array.isArray(s.patterns) ? s.patterns : [],
        };
      }
    }
    return null;
  }, [promptSelectedSubtopicId, topics]);

  // Hierarchical cascading curriculum taxonomy for Question Form
  const questionSubtestTopics = React.useMemo(() => {
    return topics.filter((t) => t.subtest === questionForm.subtest);
  }, [topics, questionForm.subtest]);

  const questionActiveTopic = React.useMemo(() => {
    if (!questionForm.topicId) return null;
    return topics.find((t) => t.id === questionForm.topicId) || null;
  }, [topics, questionForm.topicId]);

  const questionActiveSubtopic = React.useMemo(() => {
    if (!questionForm.subtopicId) return null;
    for (const t of topics) {
      const s = t.subtopics?.find((sub) => sub.id === questionForm.subtopicId);
      if (s) return s;
    }
    return null;
  }, [topics, questionForm.subtopicId]);

  const questionAvailablePatterns = React.useMemo(() => {
    if (questionActiveSubtopic && Array.isArray(questionActiveSubtopic.patterns) && questionActiveSubtopic.patterns.length > 0) {
      return questionActiveSubtopic.patterns;
    }
    if (questionActiveTopic) {
      const allPats = (questionActiveTopic.subtopics || []).flatMap((s) => (Array.isArray(s.patterns) ? s.patterns : []));
      return Array.from(new Set(allPats));
    }
    return [];
  }, [questionActiveSubtopic, questionActiveTopic]);

  const handleOpenCreateTopic = (defaultSubtest?: string) => {
    setError('');
    setNotice('');
    setEditingTopic(null);
    const targetSub = defaultSubtest && defaultSubtest !== 'ALL'
      ? defaultSubtest
      : (curriculumSubtestFilter !== 'ALL' ? curriculumSubtestFilter : 'PENALARAN_MATEMATIKA');
    const nextOrder = topics.filter((t) => t.subtest === targetSub).length + 1;
    setTopicForm({ subtest: targetSub, title: '', slug: '', order: nextOrder });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (top: TopicItem) => {
    setError('');
    setNotice('');
    setEditingTopic(top);
    setTopicForm({ subtest: top.subtest, title: top.title, slug: top.slug, order: top.order });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      setError('Judul Materi Utama wajib diisi.');
      return;
    }
    setTopicSaving(true);
    setError('');
    setNotice('');
    try {
      const slug = topicForm.slug.trim() || topicForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        subtest: topicForm.subtest,
        title: topicForm.title.trim(),
        slug,
        order: Number(topicForm.order) || 1,
      };
      if (editingTopic) {
        await api.patch(`/team/control-center/topics/${editingTopic.id}`, payload);
      } else {
        await api.post('/team/control-center/topics', payload);
      }
      const fresh = await api.get<TopicItem[]>('/team/control-center/topics', { force: true });
      setTopics(fresh);
      setTopicModalOpen(false);
      setNotice(editingTopic ? `Materi "${payload.title}" berhasil diperbarui.` : `Materi "${payload.title}" berhasil ditambahkan.`);
    } catch (err) {
      setError('Gagal menyimpan materi: ' + errorMessage(err));
    } finally {
      setTopicSaving(false);
    }
  };

  const handleDeleteTopic = async (top: TopicItem) => {
    const subCount = top.subtopics ? top.subtopics.length : 0;
    const msg = subCount > 0
      ? `Materi "${top.title}" memiliki ${subCount} submateri. Hapus materi ini beserta seluruh submaterinya?`
      : `Hapus materi "${top.title}"?`;
    if (!confirm(msg)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/team/control-center/topics/${top.id}`);
      const fresh = await api.get<TopicItem[]>('/team/control-center/topics', { force: true });
      setTopics(fresh);
      setNotice(`Materi "${top.title}" berhasil dihapus.`);
    } catch (err) {
      setError('Gagal menghapus materi: ' + errorMessage(err));
    }
  };

  const handleOpenCreateSubtopic = (parent: TopicItem) => {
    setError('');
    setNotice('');
    setActiveParentTopic(parent);
    setEditingSubtopic(null);
    const nextOrder = (parent.subtopics?.length || 0) + 1;
    setSubtopicForm({ topicId: parent.id, title: '', slug: '', order: nextOrder, patternsText: '' });
    setSubtopicModalOpen(true);
  };

  const handleOpenEditSubtopic = (parent: TopicItem, sub: { id: string; title: string; slug: string; order: number; patterns?: string[] }) => {
    setError('');
    setNotice('');
    setActiveParentTopic(parent);
    setEditingSubtopic({ ...sub, topicId: parent.id });
    setSubtopicForm({
      topicId: parent.id,
      title: sub.title,
      slug: sub.slug,
      order: sub.order,
      patternsText: Array.isArray(sub.patterns) ? sub.patterns.join('\n') : '',
    });
    setSubtopicModalOpen(true);
  };

  const handleSaveSubtopic = async (e: FormEvent) => {
    e.preventDefault();
    if (!subtopicForm.title.trim()) {
      setError('Judul Submateri wajib diisi.');
      return;
    }
    if (!subtopicForm.topicId) {
      setError('Materi Induk belum dipilih.');
      return;
    }
    setSubtopicSaving(true);
    setError('');
    setNotice('');
    try {
      const slug = subtopicForm.slug.trim() || subtopicForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const patterns = subtopicForm.patternsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const payload = {
        topicId: subtopicForm.topicId,
        title: subtopicForm.title.trim(),
        slug,
        order: Number(subtopicForm.order) || 1,
        patterns,
      };
      if (editingSubtopic) {
        await api.patch(`/team/control-center/subtopics/${editingSubtopic.id}`, payload);
      } else {
        await api.post('/team/control-center/subtopics', payload);
      }
      const fresh = await api.get<TopicItem[]>('/team/control-center/topics', { force: true });
      setTopics(fresh);
      setSubtopicModalOpen(false);
      setNotice(editingSubtopic ? `Submateri "${payload.title}" berhasil diperbarui.` : `Submateri "${payload.title}" berhasil ditambahkan.`);
    } catch (err) {
      setError('Gagal menyimpan submateri: ' + errorMessage(err));
    } finally {
      setSubtopicSaving(false);
    }
  };

  const handleDeleteSubtopic = async (subId: string, title: string) => {
    if (!confirm(`Hapus submateri "${title}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/team/control-center/subtopics/${subId}`);
      const fresh = await api.get<TopicItem[]>('/team/control-center/topics', { force: true });
      setTopics(fresh);
      setNotice(`Submateri "${title}" berhasil dihapus.`);
    } catch (err) {
      setError('Gagal menghapus submateri: ' + errorMessage(err));
    }
  };

  const generatedPrompt = React.useMemo(() => {
    if (autoBalanceEnabled && effectiveBalanceSlots.length > 0) {
      return buildAutoBalancedBatchPrompt({
        packageLabel: currentPackageLabel,
        slots: effectiveBalanceSlots,
        questionType: promptQuestionType,
        customInstruction: promptCustomTopic,
        difficultyRatio: difficultyComposition,
      });
    }

    const subtestBreakdown = activeSubtestEntries.length > 0
      ? activeSubtestEntries.map(([subId, count]) => {
          const subMeta = ALL_SUBTESTS.find((item) => item.id === subId);
          return `- ${subMeta?.label || subId}: ${count} butir soal`;
        }).join('\n')
      : '- Penalaran Matematika (PM): 5 butir soal';

    const targetSubtestNames = activeSubtestEntries.length > 0
      ? activeSubtestEntries.map(([subId]) => ALL_SUBTESTS.find((item) => item.id === subId)?.label || subId).join(', ')
      : 'Penalaran Matematika (PM)';

    const diffText = promptDifficulty === 'EASY'
      ? 'Mudah (Konseptual & Fundamental Dasar)'
      : promptDifficulty === 'HARD'
      ? 'Sulit (HOTS - High Order Thinking Skills, Analitis & Multi-Tahap)'
      : promptDifficulty === 'MIXED'
      ? `Campuran Berimbang (${normalizedDifficultyComposition.easyPct}% Mudah, ${normalizedDifficultyComposition.mediumPct}% Sedang, ${normalizedDifficultyComposition.hardPct}% Sulit HOTS)`
      : 'Sedang (Standar Resmi UTBK SNBT BPPP Kemendikbudristek)';

    const passageInstruction = promptIncludePassage
      ? '- Untuk subtes berbasis literasi/bahasa (PBM, PPU, LBI, LBE) atau soal kontekstual naratif, cantumkan wacana/stimulus bermutu pada field "narration".'
      : '- Soal dibuat langsung fokus pertanyaan (kosongkan string "narration" jika tidak memerlukan teks wacana panjang).';

    const trickInstruction = promptIncludeTricks
      ? '- Pada bagian "solution", WAJIB cantumkan "keyFormula" (rumus inti + kapan dipakainya), "quickTrick" (tips cepat 30 detik ala kakak tutor), serta array "steps" berjumlah FLEKSIBEL (2-6 langkah) memakai bahasa ringan yang gampang dipahami siswa SMA (jangan dipaksa selalu 3 langkah).'
      : '- Pada bagian "solution", sertakan array "steps" berjumlah FLEKSIBEL (2-6 langkah) menyesuaikan karakteristik soal dengan gaya bahasa tutor yang santai, ringan, dan mudah dipahami anak SMA.';

    let topicLine = '- Fokus Topik: Standar kisi-kisi resmi SNBT terbaru';
    if (selectedSubtopicMeta) {
      topicLine = `- Fokus Materi Kurikulum: ${selectedSubtopicMeta.topicTitle} › ${selectedSubtopicMeta.subtopicTitle} (${selectedSubtopicMeta.subtestLabel})`;
      if (selectedSubtopicMeta.patterns.length > 0) {
        topicLine += `\n- Pola Soal Kurikulum: ${selectedSubtopicMeta.patterns.join(' | ')}`;
      }
      if (promptCustomTopic.trim()) {
        topicLine += `\n- Catatan Spesifik Materi: ${promptCustomTopic.trim()}`;
      }
    } else if (promptCustomTopic.trim()) {
      topicLine = `- Fokus Topik / Kisi-kisi Khusus: ${promptCustomTopic.trim()}`;
    }

    const primarySubtestId = activeSubtestEntries[0]?.[0] || 'PENALARAN_MATEMATIKA';
    const sampleSubtopicName = selectedSubtopicMeta?.subtopicTitle || 'Aljabar & Persamaan';

    const questionTypeHeading = promptQuestionType === 'ISIAN_SINGKAT'
      ? 'SOAL ISIAN SINGKAT (SHORT ANSWER - STANDAR BPPP UTBK SNBT)'
      : promptQuestionType === 'CAMPURAN'
      ? 'KOMBINASI PILIHAN GANDA (A-E) DAN ISIAN SINGKAT (STANDAR RESMI UTBK SNBT TERBARU)'
      : 'SOAL PILIHAN GANDA 5 OPSI (A, B, C, D, E)';

    const typeSpecificRules = promptQuestionType === 'ISIAN_SINGKAT'
      ? `KETENTUAN KHUSUS PEMBUATAN SOAL ISIAN SINGKAT (STANDAR BPPP UTBK):
1. Target Subtes Resmi: Soal isian singkat resmi UTBK SNBT BPPP ditujukan untuk subtes Pengetahuan Kuantitatif (PK) dan Penalaran Matematika (PM).
2. Pertanyaan Menuntut Jawaban Pasti: Pertanyaan WAJIB dirumuskan secara eksplisit sehingga menghasilkan nilai akhir matematis tunggal dan pasti (tidak ambigu dan bukan berupa rentang jawaban).
3. PETUNJUK FORMAT MENJAWAB WAJIB DICANTUMKAN PADA TEKS SOAL:
   Pada akhir teks pertanyaan (field "content"), kamu WAJIB mencantumkan petunjuk format menjawab baku dalam tanda kurung siku berikut:
   "\\n\\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]"
4. Kunci Jawaban (field "correctAnswer"):
   Field "correctAnswer" HARUS diisi string angka murni (contoh: "42" atau "1250"), BUKAN kalimat dan TANPA satuan (jangan tulis "42 cm" atau "x = 42").
5. Field "options": Harus berupa array kosong [] (karena bertipe isian singkat).
6. Field "type": Bernilai "ISIAN_SINGKAT".`
      : promptQuestionType === 'CAMPURAN'
      ? `KETENTUAN TIPE SOAL CAMPURAN (PILIHAN GANDA & ISIAN SINGKAT):
1. Distribusi: Buat sekitar 70-80% butir bertipe "PILIHAN_GANDA" dan 20-30% butir bertipe "ISIAN_SINGKAT" (terutama pada subtes PK dan PM).
2. Untuk butir "PILIHAN_GANDA":
   - "type": "PILIHAN_GANDA"
   - "options": 5 opsi (A, B, C, D, E) dengan tepat 1 "isCorrect": true dan 4 pengecoh logis yang mengeksploitasi miskonsepsi umum siswa.
   - "correctAnswer": null
3. Untuk butir "ISIAN_SINGKAT":
   - "type": "ISIAN_SINGKAT"
   - Pada akhir "content", WAJIB sertakan: "\\n\\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 25]"
   - "correctAnswer": String angka bulat murni (contoh: "25") tanpa satuan dan tanpa desimal semu.
   - "options": Array kosong [].`
      : `KETENTUAN KHUSUS SOAL PILIHAN GANDA (A-E):
1. Opsi Jawaban: Tepat 5 pilihan ganda (A, B, C, D, E) pada array "options".
2. Tepat 1 opsi "isCorrect": true, dan 4 opsi lainnya "isCorrect": false.
3. Kualitas Pengecoh (Distraktor): 4 distraktor harus berasal dari miskonsepsi atau kesalahan hitung umum siswa (contoh: tanda aljabar terbalik, lupa mengalikan skalar, salah subtitusi), BUKAN angka asal.
4. "type": "PILIHAN_GANDA", dan "correctAnswer": null.`;

    return `Kamu adalah Guru & Tutor Pembahasan UTBK SNBT terbaik di Indonesia yang ahli menyusun soal berstandar resmi BPPP SNBT sekaligus menjelaskan jawabannya dengan bahasa yang santai, jelas, dan super gampang dipahami oleh anak SMA kelas 12.

TUGAS UTAMA:
Buatkan ${totalPromptCount} butir ${questionTypeHeading} yang 100% orisinal, terkalibrasi akurat, dan memenuhi standar kisi-kisi resmi BPPP SNBT 2024/2025/2026.

SPESIFIKASI & DISTRIBUSI SOAL:
${subtestBreakdown}
Total Keseluruhan: ${totalPromptCount} butir soal

PARAMETER SOAL:
- Target Subtes: ${targetSubtestNames}
- Tingkat Kesulitan: ${diffText}
${topicLine}
- Notasi Matematika/Sains: Seluruh rumus, variabel matematika, pecahan, dan persamaan WAJIB ditulis dengan format LaTeX inline yang valid (contoh: $f(x) = ax^2 + bx + c$, $\\frac{a}{b}$, $\\sqrt{D}$, $x \\le 4$).
- Kerapian Baris Teks Soal ("content" & "narration"): Gunakan newline ("\\n" dan "\\n\\n" dalam string JSON) untuk memisahkan paragraf serta daftar pernyataan (1), (2), (3), (4) agar setiap pernyataan turun ke baris baru dan mudah dibaca (contoh: "Pertanyaan?\\n\\n(1) ...\\n(2) ...\\n\\nPilih jawaban...").
${passageInstruction}
${trickInstruction}

${typeSpecificRules}

${SOLUTION_FORMATTING_RULES}

PRINSIP KOGNITIF & FORMAT MENJAWAB:
- Siswa tidak boleh dirugikan akibat format jawaban; format isian harus sangat jelas sehingga tidak ada kebingungan antara angka desimal vs bilangan bulat atau penggunaan satuan.
- Soal harus menguji daya nalar dan pemecahan masalah (Problem Solving), bukan sekadar mengingat rumus tanpa pemahaman konsep.

FORMAT KELUARAN (WAJIB BERUPA FILE .JSON):
- Output HARUS berupa file .json (buat dan berikan hasil akhir dalam bentuk file .json yang dapat diunduh, misalnya soal_utbk.json).
- Isi di dalam file .json HARUS berupa JSON murni yang valid (array of objects jika > 1 soal, atau single object jika 1 soal) tanpa teks pengantar, tanpa komentar, tanpa penjelasan di luar JSON, dan tanpa code fence markdown.
- Pastikan seluruh sintaks JSON valid (escape backslash LaTeX menjadi ganda seperti \\\\frac, \\\\sqrt, \\\\le di dalam string JSON agar file .json dapat langsung di-parse).

Struktur JSON yang WAJIB dipatuhi:
${totalPromptCount > 1 ? '[' : ''}
  {
    "subtest": "${primarySubtestId}",
    "subtopic": "${sampleSubtopicName}",
    "difficulty": "${promptDifficulty === 'MIXED' ? 'MEDIUM' : promptDifficulty}",
    "type": "${promptQuestionType === 'ISIAN_SINGKAT' ? 'ISIAN_SINGKAT' : 'PILIHAN_GANDA'}",
    "narration": "Teks wacana atau konteks bacaan jika ada (kosongkan string jika tidak ada)",
    "content": "${promptQuestionType === 'ISIAN_SINGKAT' ? 'Pertanyaan soal yang spesifik dan menuntut angka pasti...\\n\\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]' : 'Pertanyaan soal yang jelas, menuntut analisis nalar, dan tidak ambigu...'}",
    "points": 1,
    "correctAnswer": "${promptQuestionType === 'ISIAN_SINGKAT' ? '42' : null}",
    "options": ${promptQuestionType === 'ISIAN_SINGKAT' ? '[]' : `[
      { "content": "Pernyataan / opsi A", "isCorrect": false },
      { "content": "Pernyataan / opsi B (Kunci Jawaban)", "isCorrect": true },
      { "content": "Pernyataan / opsi C", "isCorrect": false },
      { "content": "Pernyataan / opsi D", "isCorrect": false },
      { "content": "Pernyataan / opsi E", "isCorrect": false }
    ]`},
    "solution": {
      "keyFormula": "Rumus inti yang dipakai + 1 kalimat sederhana kapan rumus ini digunakan",
      "quickTrick": "Tips cepat 30 detik ala kakak tutor (cara baca pola atau eliminasi opsi paling gampang)",
      "staticExplanation": "Ringkasan 1-2 kalimat santai kenapa opsi tersebut benar",
      "steps": [
        { "stepNumber": 1, "category": "Pahami Soal", "title": "Cari Tahu Apa yang Ditanya", "content": "Dari soal kita tahu:\\n- **Info 1:** ...\\n- **Info 2:** ...\\n\\n==Inti ide awal supaya langkah berikutnya terasa gampang.==" },
        { "stepNumber": 2, "category": "Tahap 1", "title": "Langkah Awal (Sesuaikan Judul)", "content": "Kalimat jembatan singkat kenapa kita hitung bagian ini:\\n$$...$$\\nDari sini ketemu **$x = ...$**." },
        { "stepNumber": 3, "category": "Tahap 2", "title": "Langkah Lanjutan (Tambah/Kurangi Step Sesuai Soal)", "content": "Sekarang tinggal masukkan angka tadi:\\n$$...$$\\nHasilnya langsung mengarah ke ==poin penentu jawaban==." },
        { "stepNumber": 4, "category": "Kesimpulan", "title": "Jadi Jawabannya...", "content": "Semua kondisi soal sudah terpenuhi oleh ==hasil/opsi akhir yang tepat==.\\n\\n✅ Jadi, jawaban yang benar adalah **...**." }
      ]
    }
  }
${totalPromptCount > 1 ? ']' : ''}`;
  }, [autoBalanceEnabled, effectiveBalanceSlots, currentPackageLabel, activeSubtestEntries, totalPromptCount, promptDifficulty, promptQuestionType, selectedSubtopicMeta, promptCustomTopic, promptIncludePassage, promptIncludeTricks]);

  const jsonValidation = React.useMemo(() => {
    if (!aiJsonInput.trim()) return null;
    try {
      const parsed = JSON.parse(aiJsonInput.trim());
      if (Array.isArray(parsed)) {
        return { valid: true, isArray: true, count: parsed.length, message: `${parsed.length} soal terdeteksi dalam format array` };
      } else if (parsed && typeof parsed === 'object') {
        return { valid: true, isArray: false, count: 1, message: '1 soal terdeteksi' };
      }
      return { valid: false, message: 'JSON harus berupa object atau array of objects' };
    } catch (err: any) {
      return { valid: false, message: err.message || 'Format JSON tidak valid' };
    }
  }, [aiJsonInput]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };
  const [filterSubtest, setFilterSubtest] = React.useState<string>('ALL');
  const [filterTarget, setFilterTarget] = React.useState<string>('ALL');
  const [filterBatch, setFilterBatch] = React.useState<string>('ALL');
  const [questionBatches, setQuestionBatches] = React.useState<QuestionBatchSummary[]>([]);
  const [importBatch, setImportBatch] = React.useState<string>('');
  const [totalQuestionsCount, setTotalQuestionsCount] = React.useState<number>(0);
  const [copiedQuestionId, setCopiedQuestionId] = React.useState<string | null>(null);
  const mergedQuestionBatches = React.useMemo(
    () => mergeBatchSummaries(questionBatches, questions),
    [questionBatches, questions],
  );

  // Form states
  const [tryoutForm, setTryoutForm] = React.useState<TryoutForm>(initialTryoutForm);
  const [packageForm, setPackageForm] = React.useState<PackageForm>(initialPackageForm);
  const [articleForm, setArticleForm] = React.useState<ArticleForm>(initialArticleForm);
  const [tryoutFormOpen, setTryoutFormOpen] = React.useState(false);
  const [packageFormOpen, setPackageFormOpen] = React.useState(false);
  const [articleFormOpen, setArticleFormOpen] = React.useState(false);
  const [editingTryout, setEditingTryout] = React.useState<string | null>(null);
  const [editingPackage, setEditingPackage] = React.useState<string | null>(null);
  const [editingArticle, setEditingArticle] = React.useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = React.useState<Article | null>(null);

  // Candidate Details Modal State
  const [selectedApplicant, setSelectedApplicant] = React.useState<CareerApplication | null>(null);
  const [applicantStatusDraft, setApplicantStatusDraft] = React.useState<CareerApplication['status']>('SUBMITTED');
  const [applicantNotesDraft, setApplicantNotesDraft] = React.useState('');
  const [savingApplicant, setSavingApplicant] = React.useState(false);

  const loadSection = React.useCallback(async (
    target: Section,
    query = '',
    force = false,
    filters?: { subtest?: string; target?: string; status?: string; batch?: string }
  ) => {
    const cachedUrl = target === 'tryouts' ? '/team/control-center/tryouts'
      : target === 'pricing' ? '/team/control-center/packages'
      : target === 'vouchers' ? '/team/control-center/vouchers'
      : target === 'discounts' ? '/team/control-center/discounts'
      : target === 'articles' ? '/team/control-center/articles'
      : target === 'payments' ? '/team/control-center/payments'
      : target === 'curriculum' ? '/team/control-center/topics'
      : '';
    if (!cachedUrl || !api.getCached(cachedUrl)) {
      setLoading(true);
    }
    setError('');
    try {
      if (target === 'tryouts') setTryouts(await api.get<Tryout[]>('/team/control-center/tryouts', { force }));
      if (target === 'pricing') setPackages(await api.get<Package[]>('/team/control-center/packages', { force }));
      if (target === 'vouchers') {
        const [vRes, uRes] = await Promise.all([
          api.get<Voucher[]>('/team/control-center/vouchers', { force }),
          users.length === 0 ? api.get<User[]>('/team/control-center/users', { force }).catch(() => []) : Promise.resolve(users),
        ]);
        setVouchers(vRes);
        if (users.length === 0 && uRes) setUsers(uRes);
      }
      if (target === 'discounts') {
        const [dRes, pRes] = await Promise.all([
          api.get<Discount[]>('/team/control-center/discounts', { force }),
          packages.length === 0 ? api.get<Package[]>('/team/control-center/packages', { force }) : Promise.resolve(packages),
        ]);
        setDiscounts(dRes);
        if (packages.length === 0) setPackages(pRes);
      }
      if (target === 'users') setUsers(await api.get<User[]>(`/team/control-center/users${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'articles') setArticles(await api.get<Article[]>(`/team/control-center/articles${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'careers') setApplications(await api.get<CareerApplication[]>(`/team/control-center/careers/applications${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'payments') {
        const activeStatus = filters?.status !== undefined ? filters.status : paymentStatusFilter;
        const queryParams = new URLSearchParams();
        if (query) queryParams.set('search', query);
        if (activeStatus && activeStatus !== 'ALL') queryParams.set('status', activeStatus);
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await api.get<{ summary: PaymentSummary; payments: PaymentLog[] }>(`/team/control-center/payments${qs}`, { force });
        setPaymentSummary(res.summary);
        setPayments(res.payments);
      }
      if (target === 'questions') {
        const activeSubtest = filters?.subtest !== undefined ? filters.subtest : filterSubtest;
        const activeTarget = filters?.target !== undefined ? filters.target : filterTarget;
        const activeBatch = filters?.batch !== undefined ? filters.batch : filterBatch;
        const queryParams = new URLSearchParams();
        if (query) queryParams.set('search', query);
        if (activeSubtest && activeSubtest !== 'ALL') queryParams.set('subtest', activeSubtest);
        if (activeTarget && activeTarget !== 'ALL') queryParams.set('target', activeTarget);
        if (activeBatch && activeBatch !== 'ALL') queryParams.set('batch', activeBatch);
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const [qRes, batchRes, topRes, tryoutRes] = await Promise.all([
          api.get<QuestionItem[]>(`/team/control-center/questions${qs}`, { force }),
          api.get<QuestionBatchSummary[]>('/team/control-center/questions/batches', { force }).catch(() => []),
          api.get<TopicItem[]>('/team/control-center/topics', { force }),
          tryouts.length === 0 ? api.get<Tryout[]>('/team/control-center/tryouts', { force }).catch(() => []) : Promise.resolve(null),
        ]);
        setQuestions(qRes);
        setQuestionBatches(Array.isArray(batchRes) ? batchRes : []);
        setTopics(topRes);
        if (tryoutRes && tryoutRes.length > 0) {
          setTryouts(tryoutRes);
        }
        if (
          !query &&
          (!activeSubtest || activeSubtest === 'ALL') &&
          (!activeTarget || activeTarget === 'ALL') &&
          (!activeBatch || activeBatch === 'ALL')
        ) {
          setTotalQuestionsCount(qRes.length);
        }
      }
      if (target === 'curriculum' || (target === 'practice' && topics.length === 0)) {
        const topRes = await api.get<TopicItem[]>('/team/control-center/topics', { force });
        setTopics(topRes);
      }
    } catch (cause) {
      const message = errorMessage(cause);
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [filterSubtest, filterTarget, filterBatch, paymentStatusFilter]);

  React.useEffect(() => {
    if (urlSec && ['tryouts', 'pricing', 'vouchers', 'discounts', 'users', 'articles', 'careers', 'payments', 'questions', 'practice', 'soal-asli', 'curriculum'].includes(urlSec)) {
      setSection(urlSec);
    } else if (!urlSec) {
      setSection('tryouts');
    }
  }, [urlSec]);

  React.useEffect(() => {
    void api.get<CurrentMember>('/team/me').then(setMember).catch((cause: unknown) => {
      if (errorMessage(cause) === 'SESSION_EXPIRED') window.location.assign(signInUrl());
    });
  }, []);

  React.useEffect(() => {
    if (section !== 'tryouts') {
      setManagingTryoutId(null);
    }
    void loadSection(section);
  }, [section, loadSection]);

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const isShort = questionForm.type === 'SHORT_ANSWER';

    if (isShort && !questionForm.correctAnswer.trim()) {
      alert('Kunci jawaban isian singkat wajib diisi!');
      setSaving(false);
      return;
    }

    if (questionForm.target === 'FOR_TRYOUT' && !questionForm.tryoutId) {
      alert('Pilih paket Tryout tujuan terlebih dahulu saat membuat soal Tryout!');
      setSaving(false);
      return;
    }

    // Auto-check if short answer question has format guidance
    let finalContent = questionForm.content.trim();
    if (isShort && !finalContent.includes('[PETUNJUK FORMAT')) {
      finalContent += '\n\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]';
    }

    const body = {
      subtest: questionForm.subtest,
      topicId: questionForm.topicId || null,
      subtopicId: questionForm.subtopicId || null,
      pattern: questionForm.pattern.trim() || null,
      batch: questionForm.batch.trim() || null,
      difficulty: questionForm.difficulty,
      type: isShort ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
      target: questionForm.target,
      status: editingQuestion
        ? (questionForm.status || 'DRAFT')
        : (questionForm.target === 'SOAL_ASLI' ? 'READY' : 'DRAFT'),
      tryoutId: questionForm.target === 'FOR_TRYOUT' ? (questionForm.tryoutId || null) : null,
      packageId: questionForm.target === 'SOAL_ASLI' ? (questionForm.packageId || null) : null,
      narration: questionForm.narration.trim() || null,
      content: finalContent,
      imageUrl: questionForm.imageUrl.trim() || null,
      points: Number(questionForm.points) || 1,
      correctAnswer: isShort ? questionForm.correctAnswer.trim() : null,
      options: isShort ? [] : questionForm.options.map((opt, i) => ({
        content: opt.content.trim(),
        isCorrect: opt.isCorrect,
        order: i + 1,
      })),
      keyFormula: questionForm.keyFormula.trim() || null,
      quickTrick: questionForm.quickTrick.trim() || null,
      staticExplanation: questionForm.staticExplanation.trim() || null,
      solutionSteps: questionForm.solutionSteps
        .filter((s) => s.title.trim() || s.content.trim())
        .map((s, i) => ({
          stepNumber: i + 1,
          category: s.category || `Langkah ${i + 1}`,
          title: s.title.trim(),
          content: s.content.trim(),
        })),
    };

    try {
      if (editingQuestion) await api.patch(`/team/control-center/questions/${editingQuestion}`, body);
      else await api.post('/team/control-center/questions', body);
      const destLabel =
        questionForm.target === 'FOR_PRACTICE'
          ? 'Draf Latihan'
          : questionForm.target === 'FOR_TRYOUT'
          ? 'Draf Tryout'
          : 'Draf Eksperimen (Bank Soal)';
      const successMessage = editingQuestion
        ? 'Perubahan soal berhasil disimpan.'
        : `Soal berhasil dibuat dan masuk ke ${destLabel}!`;
      setQuestionForm(initialQuestionForm);
      setEditingQuestion(null);
      setQuestionFormOpen(false);
      await loadSection('questions', '', true);
      void api.get<Tryout[]>('/team/control-center/tryouts', { force: true }).then(setTryouts).catch(() => {});
      setPracticeRefreshKey((k) => k + 1);
      setTryoutWorkspaceRefreshKey((k) => k + 1);
      setNotice(successMessage);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleQuestionWorkflow(
    item: QuestionItem,
    action: 'SUBMIT_QC' | 'APPROVE' | 'REQUEST_REVISION' | 'RESUBMIT_QC' | 'RETIRE' | 'RESTORE',
    extra?: { revisionNotes?: string; restoreStatus?: string },
  ) {
    setWorkflowBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const updated = await api.post<QuestionItem>(
        `/team/control-center/questions/${encodeURIComponent(item.id)}/workflow`,
        { action, ...extra },
      );
      setQuestions((prev) => prev.map((q) => (q.id === item.id ? { ...q, ...updated } : q)));
      if (previewQuestion?.id === item.id) {
        setPreviewQuestion((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      setPracticeRefreshKey((k) => k + 1);
      const actionLabels: Record<string, string> = {
        SUBMIT_QC: 'Soal dikirim ke Antrean QC (Sandbox).',
        APPROVE: 'Soal dinyatakan Lolos QC (Status: Ready)!',
        REQUEST_REVISION: 'Soal dikembalikan ke Kotak Revisi beserta catatan QC.',
        RESUBMIT_QC: 'Revisi disimpan & soal dikirim ulang ke Antrean QC.',
        RETIRE: 'Soal dinonaktifkan (Retired). Riwayat siswa tetap aman.',
        RESTORE: 'Soal dipulihkan kembali.',
      };
      setNotice(actionLabels[action] || 'Status soal diperbarui.');
      return updated;
    } catch (cause) {
      setError(errorMessage(cause));
      return null;
    } finally {
      setWorkflowBusyId(null);
    }
  }

  async function handleOpenInSandbox(item?: QuestionItem | null) {
    const busyKey = item?.id || '__QC_QUEUE__';
    setSandboxOpeningId(busyKey);
    setError('');
    const previewTab = window.open('about:blank', '_blank');
    if (previewTab) {
      previewTab.opener = null;
    }
    try {
      const session = await api.post<{ token: string; questionId: string | null }>(
        '/team/control-center/sandbox-preview',
        item?.id ? { questionId: item.id } : {},
      );
      const url = new URL('/sandbox', JITU_MAIN_URL);
      if (item?.id) {
        url.searchParams.set('questionId', item.id);
      }
      url.searchParams.set('token', session.token);

      if (previewTab && !previewTab.closed) {
        previewTab.location.href = url.toString();
      } else {
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      }
    } catch (cause) {
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      setError(errorMessage(cause));
    } finally {
      setSandboxOpeningId(null);
    }
  }

  async function confirmRevisionRequest() {
    if (!revisionModal.question || !revisionModal.notes.trim()) return;
    setRevisionModal((prev) => ({ ...prev, submitting: true }));
    const updated = await handleQuestionWorkflow(revisionModal.question, 'REQUEST_REVISION', {
      revisionNotes: revisionModal.notes.trim(),
    });
    setRevisionModal((prev) => ({ ...prev, submitting: false }));
    if (updated) {
      setRevisionModal({ open: false, question: null, notes: '', submitting: false });
      if (editingQuestion === updated.id) {
        setQuestionFormOpen(false);
        setEditingQuestion(null);
      }
    }
  }

  const selectedQuestionIdSet = React.useMemo(
    () => new Set(selectedQuestionIds),
    [selectedQuestionIds],
  );

  React.useEffect(() => {
    setSelectedQuestionIds([]);
    lastSelectedQuestionIdRef.current = null;
  }, [filterStatus]);

  React.useEffect(() => {
    const existingIds = new Set(questions.map((q) => q.id));
    setSelectedQuestionIds((prev) => {
      const next = prev.filter((id) => existingIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [questions]);

  const toggleQuestionSelection = React.useCallback((questionId: string, useShiftRange = false) => {
    const orderedIds = filteredQuestionIdsRef.current;
    if (useShiftRange && lastSelectedQuestionIdRef.current) {
      const startIdx = orderedIds.indexOf(lastSelectedQuestionIdRef.current);
      const endIdx = orderedIds.indexOf(questionId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = orderedIds.slice(from, to + 1);
        setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        lastSelectedQuestionIdRef.current = questionId;
        return;
      }
    }
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    );
    lastSelectedQuestionIdRef.current = questionId;
  }, []);

  const togglePageQuestionSelection = React.useCallback((pageIds: string[]) => {
    if (pageIds.length === 0) return;
    setSelectedQuestionIds((prev) => {
      const prevSet = new Set(prev);
      const allSelected = pageIds.every((id) => prevSet.has(id));
      if (allSelected) {
        const pageSet = new Set(pageIds);
        return prev.filter((id) => !pageSet.has(id));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  }, []);

  async function handleBulkMoveStatus(
    targetStatus: QuestionLifecycleStatus,
    revisionNotes?: string,
  ): Promise<boolean> {
    const ids = filteredQuestionIdsRef.current.filter((id) => selectedQuestionIdSet.has(id));
    if (ids.length === 0) return false;

    if (targetStatus !== 'READY') {
      const idSet = new Set(ids);
      const lockedCount = questions.filter((q) => idSet.has(q.id) && q.isLockedInTryout).length;
      if (lockedCount > 0) {
        const ok = window.confirm(
          `${lockedCount} dari ${ids.length} soal terpilih sedang terhubung ke Tryout aktif (NOT_STARTED / IN_PROGRESS). Tetap pindahkan statusnya?`,
        );
        if (!ok) return false;
      }
    }

    setBulkMovingStatus(targetStatus);
    setError('');
    setNotice('');
    try {
      const res = await api.post<{
        updatedCount: number;
        status: QuestionLifecycleStatus;
        updatedRows?: Array<{
          id: string;
          status: string;
          target: string;
          revisionNotes: string | null;
          reviewedBy: string | null;
          reviewedAt: string | null;
          isPracticeAssigned?: boolean;
        }>;
      }>('/team/control-center/questions/bulk-status', {
        questionIds: ids,
        status: targetStatus,
        ...(revisionNotes?.trim() ? { revisionNotes: revisionNotes.trim() } : {}),
      });

      if (Array.isArray(res.updatedRows) && res.updatedRows.length > 0) {
        const updatedMap = new Map(res.updatedRows.map((r) => [r.id, r]));
        setQuestions((prev) =>
          prev.map((q) => {
            const patch = updatedMap.get(q.id);
            return patch ? { ...q, ...patch, target: patch.target as QuestionItem['target'] } : q;
          }),
        );
      } else {
        await loadSection('questions', search, true);
      }

      setSelectedQuestionIds([]);
      lastSelectedQuestionIdRef.current = null;
      setPracticeRefreshKey((k) => k + 1);

      const statusLabels: Record<QuestionLifecycleStatus, string> = {
        DRAFT: 'Draf',
        QC_SANDBOX: 'Antrean QC',
        NEEDS_REVISION: 'Kotak Revisi',
        READY: 'Siap / Ready',
        RETIRED: 'Nonaktif',
      };
      setNotice(`${res.updatedCount ?? ids.length} soal berhasil dipindahkan ke status ${statusLabels[targetStatus]}.`);
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBulkMovingStatus(null);
    }
  }

  async function confirmBulkRevision() {
    setBulkRevisionModal((prev) => ({ ...prev, submitting: true }));
    const ok = await handleBulkMoveStatus('NEEDS_REVISION', bulkRevisionModal.notes);
    setBulkRevisionModal((prev) => ({ ...prev, submitting: false }));
    if (ok) {
      setBulkRevisionModal({ open: false, notes: '', submitting: false });
    }
  }

  async function deleteQuestionItem(item: QuestionItem) {
    if ((item.attemptCount ?? 0) > 0) {
      if (!window.confirm(`Soal ini sudah dikerjakan ${item.attemptCount}x oleh siswa sehingga tidak bisa dihapus permanen. Nonaktifkan (Retired) agar riwayat nilai siswa tetap aman?`)) {
        return;
      }
      await handleQuestionWorkflow(item, 'RETIRE');
      return;
    }
    if (!window.confirm(`Hapus permanen soal #${item.id.slice(0, 8)}? Aksi ini tidak bisa dibatalkan.`)) return;
    setDeletingId(item.id); setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/questions/${encodeURIComponent(item.id)}`);
      if (editingQuestion === item.id) {
        setQuestionForm(initialQuestionForm);
        setEditingQuestion(null);
        setQuestionFormOpen(false);
      }
      setQuestions((prev) => prev.filter((q) => q.id !== item.id));
      setPracticeRefreshKey((k) => k + 1);
      setNotice('Soal dihapus permanen.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDeletingId(null);
    }
  }

  function mapAiJsonToRequestBody(parsed: any, slotIdx = 0) {
    const fallbackSlot = autoBalanceEnabled ? effectiveBalanceSlots[slotIdx] : undefined;
    const subtestMap: Record<string, string> = {
      PENALARAN_MATEMATIKA: 'PENALARAN_MATEMATIKA',
      PM: 'PENALARAN_MATEMATIKA',
      PENALARAN_UMUM: 'PENALARAN_UMUM',
      PU: 'PENALARAN_UMUM',
      PEMAHAMAN_BACAAN_MENULIS: 'PEMAHAMAN_BACAAN_MENULIS',
      PEMAHAMAN_BACAAN: 'PEMAHAMAN_BACAAN_MENULIS',
      PBM: 'PEMAHAMAN_BACAAN_MENULIS',
      PENGETAHUAN_KUANTITATIF: 'PENGETAHUAN_KUANTITATIF',
      PK: 'PENGETAHUAN_KUANTITATIF',
      PENGETAHUAN_PEMAHAMAN_UMUM: 'PENGETAHUAN_PEMAHAMAN_UMUM',
      PENGETAHUAN_UMUM: 'PENGETAHUAN_PEMAHAMAN_UMUM',
      PPU: 'PENGETAHUAN_PEMAHAMAN_UMUM',
      LITERASI_INDONESIA: 'LITERASI_INDONESIA',
      LITERASI_BAHASA_INDONESIA: 'LITERASI_INDONESIA',
      LBI: 'LITERASI_INDONESIA',
      LITERASI_INGGRIS: 'LITERASI_INGGRIS',
      LITERASI_BAHASA_INGGRIS: 'LITERASI_INGGRIS',
      LBE: 'LITERASI_INGGRIS',
    };
    const rawSubtest = String(parsed.subtest || fallbackSlot?.subtest || 'PENALARAN_MATEMATIKA').toUpperCase().trim();
    const mappedSubtest = subtestMap[rawSubtest] || rawSubtest;

    let matchedTopicId: string | null = null;
    let matchedSubtopicId: string | null = null;

    if (parsed.subtopicId) {
      const explicitSubId = String(parsed.subtopicId).trim();
      for (const t of topics) {
        const sub = t.subtopics?.find((s) => s.id === explicitSubId);
        if (sub) {
          matchedSubtopicId = sub.id;
          matchedTopicId = t.id;
          break;
        }
      }
    }
    if (!matchedSubtopicId && parsed.subtopic) {
      const needle = String(parsed.subtopic).toLowerCase().trim();
      for (const t of topics) {
        const found = (t.subtopics || []).find(
          (s) => s.title.toLowerCase().includes(needle) || needle.includes(s.title.toLowerCase()),
        );
        if (found) {
          matchedSubtopicId = found.id;
          matchedTopicId = t.id;
          break;
        }
      }
    }
    if (!matchedSubtopicId && fallbackSlot?.subtopicId) {
      matchedSubtopicId = fallbackSlot.subtopicId;
      matchedTopicId = fallbackSlot.topicId || null;
    }

    const rawType = String(parsed.type || '').toUpperCase();
    const isShortAnswer = rawType.includes('ISIAN') || rawType.includes('SHORT') || (!parsed.options && Boolean(parsed.correctAnswer));
    const questionType = isShortAnswer ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE';

    let rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
    let opts = [0, 1, 2, 3, 4].map((i) => {
      const o = rawOptions[i];
      return {
        content: o ? String(o.content || '').trim() : '',
        isCorrect: o ? Boolean(o.isCorrect) : i === 0,
        order: i + 1,
      };
    });

    if (!isShortAnswer && !opts.some((o) => o.isCorrect)) {
      opts[0].isCorrect = true;
    }

    const sol = parsed.solution || {};
    const rawSteps = Array.isArray(parsed.solutionSteps)
      ? parsed.solutionSteps
      : Array.isArray(sol.steps)
      ? sol.steps
      : [];
    const solSteps = rawSteps.length > 0
      ? rawSteps.map((s: any, i: number) => ({
          stepNumber: i + 1,
          category: s.category || `Langkah ${i + 1}`,
          title: String(s.title || '').trim(),
          content: String(s.content || '').trim(),
        }))
      : [];

    const diff = String(parsed.difficulty || fallbackSlot?.difficulty || 'MEDIUM').toUpperCase();
    const validDiff = (diff === 'EASY' || diff === 'HARD') ? diff : 'MEDIUM';

    let content = String(parsed.content || '').trim();
    const correctAnswer = parsed.correctAnswer !== undefined && parsed.correctAnswer !== null ? String(parsed.correctAnswer).trim() : '';

    if (isShortAnswer && !content.includes('[PETUNJUK FORMAT')) {
      content += '\n\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]';
    }

    const keyFormula = parsed.keyFormula || sol.keyFormula;
    const quickTrick = parsed.quickTrick || sol.quickTrick;
    const staticExplanation = parsed.staticExplanation || sol.staticExplanation || sol.staticContent;

    return {
      subtest: mappedSubtest,
      topicId: matchedTopicId,
      subtopicId: matchedSubtopicId,
      batch: importBatch.trim() || (parsed.batch ? String(parsed.batch).trim() : null),
      difficulty: validDiff,
      type: questionType,
      target: createTarget,
      tryoutId: createTarget === 'FOR_TRYOUT' ? (createTryoutId || null) : null,
      status: 'DRAFT' as const,
      narration: parsed.narration ? String(parsed.narration).trim() : null,
      content,
      imageUrl: parsed.imageUrl ? String(parsed.imageUrl).trim() : null,
      points: Number(parsed.points) || 1,
      correctAnswer: isShortAnswer ? correctAnswer : null,
      options: isShortAnswer ? [] : opts,
      keyFormula: keyFormula ? String(keyFormula).trim() : null,
      quickTrick: quickTrick ? String(quickTrick).trim() : null,
      staticExplanation: staticExplanation ? String(staticExplanation).trim() : null,
      solutionSteps: solSteps,
    };
  }

  function applyAiJson() {
    if (createTarget === 'FOR_TRYOUT' && !createTryoutId) {
      setError('Pilih paket Tryout tujuan terlebih dahulu sebelum menerapkan soal Tryout.');
      return;
    }
    try {
      let parsed = JSON.parse(aiJsonInput.trim());
      if (Array.isArray(parsed)) parsed = parsed[0];
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format JSON tidak valid.');
      }

      const body = mapAiJsonToRequestBody(parsed, 0);

      setQuestionForm({
        subtest: body.subtest,
        topicId: body.topicId || '',
        subtopicId: body.subtopicId || '',
        pattern: '',
        batch: body.batch || '',
        difficulty: body.difficulty as any,
        type: body.type as any,
        target: createTarget,
        status: 'DRAFT',
        tryoutId: createTarget === 'FOR_TRYOUT' ? createTryoutId : '',
        packageId: '',
        narration: body.narration || '',
        content: body.content,
        imageUrl: body.imageUrl || '',
        points: String(body.points || 1),
        correctAnswer: body.correctAnswer || '',
        answerFormatGuide: 'Bilangan Bulat Non-Negatif (0-9999)',
        options: body.options && body.options.length > 0 ? body.options : initialQuestionForm.options,
        keyFormula: body.keyFormula || '',
        quickTrick: body.quickTrick || '',
        staticExplanation: body.staticExplanation || '',
        solutionSteps: body.solutionSteps.length > 0 ? body.solutionSteps : initialQuestionForm.solutionSteps,
      });

      setEditingQuestion(null);
      setImportBatch('');
      setAiImportOpen(false);
      setCreateMethodModalOpen(false);
      setQuestionFormOpen(true);
      setNotice(`Soal dari AI berhasil diterapkan ke form (${currentPackageLabel} · Status: Draf)! Silakan periksa dan simpan.`);
    } catch (err: any) {
      setError(`Gagal membaca JSON AI: ${err.message || 'Format tidak valid'}`);
    }
  }

  async function bulkImportQuestions() {
    if (createTarget === 'FOR_TRYOUT' && !createTryoutId) {
      setError('Pilih paket Tryout tujuan terlebih dahulu sebelum mengimpor soal Tryout.');
      return;
    }
    try {
      let parsed = JSON.parse(aiJsonInput.trim());
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
      if (parsed.length === 0) {
        throw new Error('Array JSON kosong.');
      }
      setImportingBulk(true);
      setError(''); setNotice('');
      let successCount = 0;
      for (let idx = 0; idx < parsed.length; idx++) {
        const body = mapAiJsonToRequestBody(parsed[idx], idx);
        await api.post('/team/control-center/questions', body);
        successCount++;
      }
      setAiJsonInput('');
      setImportBatch('');
      setCreateMethodModalOpen(false);
      await loadSection('questions', '', true);
      void api.get<Tryout[]>('/team/control-center/tryouts', { force: true }).then(setTryouts).catch(() => {});
      setPracticeRefreshKey((k) => k + 1);
      setTryoutWorkspaceRefreshKey((k) => k + 1);
      setNotice(`Berhasil mengimpor ${successCount} soal ke Draf ${currentPackageLabel}!`);
    } catch (err: any) {
      setError(`Gagal mengimpor soal: ${err.message || 'Format tidak valid'}`);
    } finally {
      setImportingBulk(false);
    }
  }

  function editQuestionItem(item: QuestionItem) {
    setEditingQuestion(item.id);
    setQuestionFormOpen(true);
    setError(''); setNotice('');
    const isShort = item.type === 'ISIAN_SINGKAT' || item.type === 'SHORT_ANSWER';
    const formOptions = item.options.length > 0
      ? item.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, order: o.order }))
      : initialQuestionForm.options;
    const formSteps = item.solution?.steps && item.solution.steps.length > 0
      ? item.solution.steps.map((s: any, idx: number) => ({
          stepNumber: Number(s.stepNumber ?? s.order ?? idx + 1),
          category: s.category || '',
          title: s.title || '',
          content: s.content || '',
        }))
      : initialQuestionForm.solutionSteps;

    let derivedTopicId = item.topicId || '';
    if (!derivedTopicId && item.subtopicId) {
      for (const t of topics) {
        if (t.subtopics?.some((s) => s.id === item.subtopicId)) {
          derivedTopicId = t.id;
          break;
        }
      }
    }

    setQuestionForm({
      subtest: item.subtest,
      topicId: derivedTopicId,
      subtopicId: item.subtopicId || '',
      pattern: item.pattern || '',
      batch: item.batch || '',
      difficulty: item.difficulty,
      type: isShort ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
      target: item.target || 'DRAFT',
      status: item.status || 'DRAFT',
      tryoutId: item.tryoutId || '',
      packageId: item.packageId || '',
      narration: item.narration || '',
      content: item.content,
      imageUrl: item.imageUrl || '',
      points: String(item.points || 1),
      correctAnswer: item.correctAnswer || '',
      answerFormatGuide: 'Bilangan Bulat Non-Negatif (0-9999)',
      options: formOptions,
      keyFormula: item.solution?.keyFormula || '',
      quickTrick: item.solution?.quickTrick || '',
      staticExplanation: item.solution?.staticContent || '',
      solutionSteps: formSteps,
    });
  }

  function applyRevisionJsonToForm(data: Record<string, any>) {
    setQuestionForm((prev) => {
      const nextOptions = Array.isArray(data.options) && data.options.length > 0
        ? data.options.map((o: any, idx: number) => ({
            content: String(o?.content || ''),
            isCorrect: Boolean(o?.isCorrect),
            order: Number(o?.order) || idx + 1,
          }))
        : prev.options;

      const rawSteps = Array.isArray(data.solutionSteps)
        ? data.solutionSteps
        : Array.isArray(data.steps)
        ? data.steps
        : null;
      const nextSteps = rawSteps && rawSteps.length > 0
        ? rawSteps.map((s: any, idx: number) => ({
            stepNumber: Number(s?.stepNumber) || idx + 1,
            category: String(s?.category || `Langkah ${idx + 1}`),
            title: String(s?.title || `Langkah ${idx + 1}`),
            content: String(s?.content || ''),
          }))
        : prev.solutionSteps;

      return {
        ...prev,
        narration: typeof data.narration === 'string' ? data.narration : prev.narration,
        content: typeof data.content === 'string' && data.content.trim() ? data.content : prev.content,
        correctAnswer: typeof data.correctAnswer === 'string' ? data.correctAnswer : prev.correctAnswer,
        options: nextOptions,
        keyFormula: typeof data.keyFormula === 'string' ? data.keyFormula : prev.keyFormula,
        quickTrick: typeof data.quickTrick === 'string' ? data.quickTrick : prev.quickTrick,
        staticExplanation:
          typeof data.staticExplanation === 'string'
            ? data.staticExplanation
            : typeof data.staticContent === 'string'
            ? data.staticContent
            : prev.staticExplanation,
        solutionSteps: nextSteps,
      };
    });
  }

  async function handleSaveAndResubmitQc() {
    if (!editingQuestion) return;
    setSaving(true);
    setError('');
    setNotice('');
    const isShort = questionForm.type === 'SHORT_ANSWER';
    const body = {
      subtest: questionForm.subtest,
      topicId: questionForm.topicId || null,
      subtopicId: questionForm.subtopicId || null,
      pattern: questionForm.pattern.trim() || null,
      batch: questionForm.batch.trim() || null,
      difficulty: questionForm.difficulty,
      type: isShort ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
      target: questionForm.target,
      tryoutId: questionForm.target === 'FOR_TRYOUT' ? (questionForm.tryoutId || null) : null,
      packageId: questionForm.target === 'SOAL_ASLI' ? (questionForm.packageId || null) : null,
      narration: questionForm.narration.trim() || null,
      content: questionForm.content.trim(),
      imageUrl: questionForm.imageUrl.trim() || null,
      points: Number(questionForm.points) || 1,
      correctAnswer: isShort ? questionForm.correctAnswer.trim() : null,
      options: isShort
        ? []
        : questionForm.options.map((opt, i) => ({
            content: opt.content.trim(),
            isCorrect: opt.isCorrect,
            order: i + 1,
          })),
      keyFormula: questionForm.keyFormula.trim() || null,
      quickTrick: questionForm.quickTrick.trim() || null,
      staticExplanation: questionForm.staticExplanation.trim() || null,
      solutionSteps: questionForm.solutionSteps
        .filter((s) => s.title.trim() || s.content.trim())
        .map((s, i) => ({
          stepNumber: i + 1,
          category: s.category || `Langkah ${i + 1}`,
          title: s.title.trim(),
          content: s.content.trim(),
        })),
    };

    try {
      await api.patch(`/team/control-center/questions/${editingQuestion}`, body);
      await api.post(`/team/control-center/questions/${encodeURIComponent(editingQuestion)}/workflow`, {
        action: 'RESUBMIT_QC',
      });
      setQuestionForm(initialQuestionForm);
      setEditingQuestion(null);
      setQuestionFormOpen(false);
      await loadSection('questions', '', true);
      setPracticeRefreshKey((k) => k + 1);
      setNotice('Hasil revisi disimpan & soal dikirim ulang ke Antrean QC (Sandbox)!');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function saveTryout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = {
      title: tryoutForm.title.trim(),
      description: tryoutForm.description.trim() || null,
      solutionPrice: Number(tryoutForm.solutionPrice),
      batch: tryoutForm.batch,
      releaseDate: new Date(`${tryoutForm.releaseDate}T00:00:00`).toISOString(),
      scheduledStart: new Date(tryoutForm.scheduledStart).toISOString(),
      scheduledEnd: new Date(tryoutForm.scheduledEnd).toISOString(),
      isPublic: tryoutForm.isPublic,
      referralCode: tryoutForm.referralCode.trim() || null,
    };
    try {
      if (editingTryout) await api.patch(`/team/control-center/tryouts/${editingTryout}`, body);
      else await api.post('/team/control-center/tryouts', body);
      const successMessage = editingTryout ? 'Tryout updated.' : 'Tryout created.';
      setTryoutForm(initialTryoutForm); setEditingTryout(null); setTryoutFormOpen(false);
      await loadSection('tryouts', '', true);
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  async function savePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = { name: packageForm.name.trim(), tokenAmount: Number(packageForm.tokenAmount), price: Number(packageForm.price), isActive: packageForm.isActive };
    try {
      if (editingPackage) await api.patch(`/team/control-center/packages/${editingPackage}`, body);
      else await api.post('/team/control-center/packages', body);
      const successMessage = editingPackage ? 'Package updated.' : 'Package created.';
      setPackageForm(initialPackageForm); setEditingPackage(null); setPackageFormOpen(false);
      await loadSection('pricing', '', true);
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  async function saveDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = {
      name: discountForm.name.trim(),
      type: discountForm.type,
      value: Number(discountForm.value),
      startDate: new Date(discountForm.startDate).toISOString(),
      endDate: new Date(discountForm.endDate).toISOString(),
      packageId: discountForm.packageId.trim() || null,
      badgeText: discountForm.badgeText.trim() || 'DISKON SPESIAL',
      badgeStyle: discountForm.badgeStyle || 'RED_FIRE',
      isActive: discountForm.isActive,
    };
    try {
      if (editingDiscount) await api.patch(`/team/control-center/discounts/${editingDiscount}`, body);
      else await api.post('/team/control-center/discounts', body);
      const successMessage = editingDiscount ? 'Discount updated.' : 'Discount created.';
      setDiscountForm(initialDiscountForm);
      setEditingDiscount(null);
      setDiscountFormOpen(false);
      await loadSection('discounts', '', true);
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  function editDiscountItem(item: Discount) {
    setEditingDiscount(item.id);
    setDiscountForm({
      name: item.name,
      type: item.type,
      value: String(item.value),
      startDate: dateInput(item.startDate),
      endDate: dateInput(item.endDate),
      packageId: item.packageId || '',
      badgeText: item.badgeText || 'DISKON 25%',
      badgeStyle: item.badgeStyle || 'RED_FIRE',
      isActive: item.isActive,
    });
    setDiscountFormOpen(true);
    setError(''); setNotice('');
  }

  async function toggleDiscountActive(item: Discount) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/discounts/${item.id}`, { isActive: !item.isActive });
      await loadSection('discounts', '', true);
      setNotice(`Discount "${item.name}" ${!item.isActive ? 'activated' : 'paused'}.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  async function deleteDiscountItem(item: Discount) {
    if (!window.confirm(`Are you sure you want to delete discount campaign "${item.name}"?`)) return;
    setDeletingId(item.id);
    setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/discounts/${item.id}`);
      await loadSection('discounts', '', true);
      setNotice(`Discount "${item.name}" deleted.`);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setDeletingId(null); }
  }

  async function saveVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = {
      code: voucherForm.code.trim().toUpperCase(),
      discountPercent: Number(voucherForm.discountPercent),
      commissionPercent: Number(voucherForm.commissionPercent || 0),
      issuedToUserId: voucherForm.issuedToUserId.trim() || null,
      issuedToName: voucherForm.issuedToName.trim() || null,
      issuedToEmail: voucherForm.issuedToEmail.trim() || null,
      maxDiscount: voucherForm.maxDiscount.trim() ? Number(voucherForm.maxDiscount) : null,
      minPurchase: Number(voucherForm.minPurchase || 0),
      maxUsage: voucherForm.maxUsage.trim() ? Number(voucherForm.maxUsage) : null,
      expiresAt: voucherForm.expiresAt ? new Date(voucherForm.expiresAt).toISOString() : null,
      description: voucherForm.description.trim() || null,
      referrerName: voucherForm.referrerName.trim() || voucherForm.issuedToName.trim() || null,
      isActive: voucherForm.isActive,
    };
    try {
      if (editingVoucher) await api.patch(`/team/control-center/vouchers/${editingVoucher}`, body);
      else await api.post('/team/control-center/vouchers', body);
      const successMessage = editingVoucher ? 'Kode Referal diperbarui.' : 'Kode Referal berhasil dibuat.';
      setVoucherForm(initialVoucherForm);
      setEditingVoucher(null);
      setVoucherFormOpen(false);
      await loadSection('vouchers', '', true);
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  function editVoucherItem(item: Voucher) {
    setEditingVoucher(item.id);
    setVoucherForm({
      code: item.code,
      discountPercent: String(item.discountPercent),
      commissionPercent: String(item.commissionPercent ?? 0),
      issuedToUserId: item.issuedToUserId || '',
      issuedToName: item.issuedToName || item.resolvedIssuedToName || '',
      issuedToEmail: item.issuedToEmail || item.resolvedIssuedToEmail || '',
      maxDiscount: item.maxDiscount ? String(item.maxDiscount) : '',
      minPurchase: String(item.minPurchase || 0),
      maxUsage: item.maxUsage ? String(item.maxUsage) : '',
      expiresAt: item.expiresAt ? dateInput(item.expiresAt) : '',
      description: item.description || '',
      referrerName: item.referrerName || item.resolvedIssuedToName || '',
      isActive: item.isActive,
    });
    setVoucherFormOpen(true);
    setError(''); setNotice('');
  }

  async function toggleVoucherActive(item: Voucher) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/vouchers/${item.id}`, { isActive: !item.isActive });
      await loadSection('vouchers', '', true);
      setNotice(`Voucher "${item.code}" ${!item.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  async function deleteVoucherItem(item: Voucher) {
    if (!window.confirm(`Hapus kode voucher/referal "${item.code}"?`)) return;
    setDeletingId(item.id);
    setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/vouchers/${item.id}`);
      await loadSection('vouchers', '', true);
      setNotice(`Voucher "${item.code}" berhasil dihapus.`);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setDeletingId(null); }
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = {
      title: articleForm.title.trim(),
      slug: articleForm.slug.trim() || autoSlug(articleForm.title),
      category: articleForm.category.trim() || 'UTBK-SNBT',
      tags: articleForm.tags.trim(),
      authorName: articleForm.authorName.trim() || 'Tim Jitu PTN',
      status: articleForm.status,
      readTimeMinutes: Number(articleForm.readTimeMinutes) || 3,
      coverImageUrl: articleForm.coverImageUrl.trim() || null,
      summary: articleForm.summary.trim() || null,
      content: articleForm.content.trim(),
    };
    try {
      if (editingArticle) {
        await api.patch(`/team/control-center/articles/${editingArticle}`, body);
      } else {
        await api.post('/team/control-center/articles', body);
      }
      const successMessage = editingArticle ? 'Article updated.' : 'Article created.';
      setArticleForm(initialArticleForm);
      setEditingArticle(null);
      setArticleFormOpen(false);
      await loadSection('articles', search, true);
      setNotice(successMessage);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticleItem(item: Article) {
    if (!window.confirm(`Are you sure you want to delete article "${item.title}"?`)) return;
    setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/articles/${item.id}`);
      await loadSection('articles', search, true);
      setNotice(`Article "${item.title}" deleted.`);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function deleteTryoutItem(item: Tryout) {
    if (!window.confirm(`Delete tryout "${item.title}"? Tryouts with exam content or student history cannot be deleted.`)) return;
    setDeletingId(item.id); setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/tryouts/${encodeURIComponent(item.id)}`);
      if (editingTryout === item.id) {
        setTryoutForm(initialTryoutForm);
        setEditingTryout(null);
        setTryoutFormOpen(false);
      }
      if (managingTryoutId === item.id) {
        setManagingTryoutId(null);
      }
      await loadSection('tryouts', '', true);
      setNotice(`Tryout "${item.title}" deleted.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDeletingId(null);
    }
  }

  async function deletePackageItem(item: Package) {
    if (!window.confirm(`Delete package "${item.name}"? Packages with payment history cannot be deleted; deactivate those instead.`)) return;
    setDeletingId(item.id); setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/packages/${encodeURIComponent(item.id)}`);
      if (editingPackage === item.id) {
        setPackageForm(initialPackageForm);
        setEditingPackage(null);
        setPackageFormOpen(false);
      }
      await loadSection('pricing', '', true);
      setNotice(`Package "${item.name}" deleted.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDeletingId(null);
    }
  }

  function editTryout(item: Tryout) {
    setEditingTryout(item.id); setTryoutFormOpen(true); setError(''); setNotice('');
    setTryoutForm({
      title: item.title, description: item.description ?? '', solutionPrice: String(item.solutionPrice), batch: item.batch,
      releaseDate: item.releaseDate.slice(0, 10), scheduledStart: dateInput(item.scheduledStart), scheduledEnd: dateInput(item.scheduledEnd),
      isPublic: item.isPublic, referralCode: item.referralCode ?? ''
    });
  }

  function editPackage(item: Package) {
    setEditingPackage(item.id); setPackageFormOpen(true); setError(''); setNotice('');
    setPackageForm({ name: item.name, tokenAmount: String(item.tokenAmount), price: String(item.price), isActive: item.isActive });
  }

  function editArticleItem(item: Article) {
    setEditingArticle(item.id);
    setArticleFormOpen(true);
    setError('');
    setNotice('');
    setArticleForm({
      title: item.title,
      slug: item.slug,
      category: item.category,
      tags: item.tags,
      authorName: item.authorName,
      status: item.status,
      readTimeMinutes: String(item.readTimeMinutes),
      coverImageUrl: item.coverImageUrl ?? '',
      summary: item.summary ?? '',
      content: item.content,
    });
  }

  async function toggleBanUser(targetUser: User) {
    const newBannedState = !targetUser.isBanned;
    const actionText = newBannedState ? 'Ban' : 'Unban';
    if (!window.confirm(`${actionText} user "${targetUser.name || targetUser.email}"? ${newBannedState ? 'Akun ini tidak akan bisa login atau menggunakan layanan Jitu.' : 'Akun ini akan dipulihkan kembali.'}`)) return;
    setBanningUserId(targetUser.id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/team/control-center/users/${targetUser.id}`, { isBanned: newBannedState });
      setUsers((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, isBanned: newBannedState } : u));
      if (selectedUserForModal?.id === targetUser.id) {
        setSelectedUserForModal((prev) => prev ? { ...prev, isBanned: newBannedState } : null);
      }
      setNotice(`User ${targetUser.email} has been ${newBannedState ? 'banned' : 'unbanned'}.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBanningUserId(null);
    }
  }

  async function deleteUserItem(targetUser: User) {
    if (!window.confirm(`PERMANENTLY DELETE user "${targetUser.name || targetUser.email}"? Tindakan ini akan menghapus semua sesi, transaksi, saldo koin, dan data pengerjaan tryout secara permanen. Tidak dapat dibatalkan.`)) return;
    setDeletingUserId(targetUser.id);
    setError('');
    setNotice('');
    try {
      await api.delete(`/team/control-center/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      if (selectedUserForModal?.id === targetUser.id) {
        setUserModalOpen(false);
        setSelectedUserForModal(null);
      }
      setNotice(`User ${targetUser.email} has been permanently deleted.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleConfirmSandboxToggle() {
    if (!sandboxConfirmModal.user) return;
    const targetUser = sandboxConfirmModal.user;
    const nextSandboxState = sandboxConfirmModal.targetState;

    setSandboxConfirmModal((prev) => ({ ...prev, loading: true }));
    setError('');
    setNotice('');
    try {
      await api.patch(`/team/control-center/users/${targetUser.id}`, {
        isSandbox: nextSandboxState,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isSandbox: nextSandboxState } : u))
      );
      if (selectedUserForModal?.id === targetUser.id) {
        setSelectedUserForModal((prev) => (prev ? { ...prev, isSandbox: nextSandboxState } : null));
      }

      setNotice(
        nextSandboxState
          ? `User "${targetUser.name || targetUser.email}" berhasil dipindahkan ke Sandbox.`
          : `Akses Sandbox user "${targetUser.name || targetUser.email}" berhasil dicabut (kembali ke User Biasa).`
      );
      setSandboxConfirmModal({ isOpen: false, user: null, targetState: true, loading: false });
    } catch (cause) {
      setError(errorMessage(cause));
      setSandboxConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  }

  async function updateApplicationStatus(item: CareerApplication, status: CareerApplication['status']) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/careers/applications/${encodeURIComponent(item.id)}`, { status });
      await loadSection('careers', search); setNotice(`Application status updated for ${item.fullName}.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  function openApplicantModal(item: CareerApplication) {
    setSelectedApplicant(item);
    setApplicantStatusDraft(item.status);
    setApplicantNotesDraft(item.adminNotes ?? '');
    setError('');
    setNotice('');
  }

  async function saveApplicantReview() {
    if (!selectedApplicant) return;
    setSavingApplicant(true);
    setError('');
    setNotice('');
    try {
      const updated = await api.patch<CareerApplication>(
        `/team/control-center/careers/applications/${encodeURIComponent(selectedApplicant.id)}`,
        { status: applicantStatusDraft, adminNotes: applicantNotesDraft }
      );
      setSelectedApplicant(updated);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setNotice(`Saved review & status for ${updated.fullName}.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSavingApplicant(false);
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadSection(section, search.trim());
  }

  // TANSTACK TABLE COLUMNS FOR TRYOUTS
  const tryoutColumns = React.useMemo(() => [
    tryoutColHelper.accessor('title', {
      header: 'Tryout',
      cell: ({ row }) => {
        const qCount = Number(row.original.questionCount ?? 0);
        const readyCount = Number(row.original.readyQuestionCount ?? 0);
        const durMins = Number(row.original.totalDurationMinutes ?? 195);
        const curation = (row.original.curationStatus || 'DRAFT').toUpperCase();
        const isPublished = curation === 'PUBLISHED';
        const allReady = qCount > 0 && readyCount >= qCount;
        return (
          <div>
            <strong>{row.original.title}</strong>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="pill"
                style={{
                  background: isPublished ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: isPublished ? '#34d399' : '#fbbf24',
                  border: isPublished ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {isPublished ? 'Published (Live)' : 'Draf Paket'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: allReady ? 'rgba(16, 185, 129, 0.14)' : qCount > 0 ? 'rgba(56, 189, 248, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: allReady ? '#34d399' : qCount > 0 ? '#7dd3fc' : '#fbbf24',
                  border: allReady ? '1px solid rgba(16, 185, 129, 0.32)' : qCount > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {readyCount}/{qCount} Siap · {durMins}m
              </span>
              <small className="text-[var(--muted-fg)]">
                #{row.original.code} · {row.original.isPublic ? 'Public' : 'Private'}
              </small>
            </div>
          </div>
        );
      },
    }),
    tryoutColHelper.accessor('batch', {
      header: 'Batch',
      cell: ({ getValue }) => <span className="font-semibold text-xs">{getValue()}</span>,
    }),
    tryoutColHelper.accessor('scheduledStart', {
      header: 'Schedule',
      cell: ({ row }) => (
        <div>
          <span>{formatDate(row.original.scheduledStart)}</span>
          <small className="block text-[var(--muted-fg)]">Ends {formatDate(row.original.scheduledEnd)}</small>
        </div>
      ),
    }),
    tryoutColHelper.accessor('solutionPrice', {
      header: 'Solution Price',
      cell: ({ getValue }) => <span>{getValue()} coins</span>,
    }),
    tryoutColHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => (
        <span className="control-status">{String(getValue()).replaceAll('_', ' ')}</span>
      ),
    }),
    tryoutColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const curation = (row.original.curationStatus || 'DRAFT').toUpperCase();
        const isPublished = curation === 'PUBLISHED';
        const isBusy = tryoutWorkflowBusyId === row.original.id;
        const qCount = Number(row.original.questionCount ?? 0);
        const readyCount = Number(row.original.readyQuestionCount ?? 0);
        const allReady = qCount > 0 && readyCount >= qCount;

        return (
          <div className="table-action-group" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="table-action-btn"
              style={{
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#7dd3fc',
                background: 'rgba(56, 189, 248, 0.08)',
              }}
              onClick={() => {
                setTryoutFormOpen(false);
                setEditingTryout(null);
                setError('');
                setNotice('');
                setManagingTryoutId(row.original.id);
              }}
              title="Kelola soal, QC per soal, timer subtes, dan publish tryout ini"
            >
              <Layers className="action-icon" /> Kelola Soal
            </button>

            <button
              type="button"
              className="table-action-btn"
              disabled={isBusy || qCount <= 0}
              onClick={() => void openTryoutSandboxPreview(row.original)}
              style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' }}
              title={qCount <= 0 ? 'Tambahkan minimal 1 soal dulu' : 'Uji simulasi full paket Tryout di Sandbox'}
            >
              <ExternalLink className="action-icon" /> Sandbox
            </button>

            {!isPublished ? (
              <button
                type="button"
                className="table-action-btn"
                disabled={isBusy || !allReady}
                title={
                  qCount <= 0
                    ? 'Isi minimal 1 soal terlebih dahulu'
                    : !allReady
                    ? `Masih ada soal belum Siap (${readyCount}/${qCount} Siap). Selesaikan QC di Kelola Soal.`
                    : 'Publish Paket Tryout ke halaman siswa'
                }
                onClick={() => void runTryoutWorkflow(row.original, 'APPROVE')}
                style={{
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.08)',
                }}
              >
                <QcCheckIcon className="action-icon" /> Publish
              </button>
            ) : (
              <button
                type="button"
                className="table-action-btn"
                disabled={isBusy}
                onClick={() => void runTryoutWorkflow(row.original, 'UNPUBLISH')}
                style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
              >
                <QcRestoreIcon className="action-icon" /> Tarik ke Draf
              </button>
            )}

            <button
              type="button"
              className="table-action-btn"
              onClick={() => editTryout(row.original)}
              title="Edit tryout"
            >
              <Edit className="action-icon" /> Edit
            </button>
            <button
              type="button"
              className="table-action-btn table-action-btn-danger"
              onClick={() => void deleteTryoutItem(row.original)}
              disabled={deletingId === row.original.id}
              aria-label={`Delete tryout ${row.original.title}`}
              title="Delete tryout"
            >
              <Trash2 className="action-icon" /> {deletingId === row.original.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        );
      },
    }),
  ], [deletingId, editingTryout, managingTryoutId, tryoutWorkflowBusyId]);

  // TANSTACK TABLE COLUMNS FOR PRICING
  const packageColumns = React.useMemo(() => [
    packageColHelper.accessor('name', {
      header: 'Package',
      cell: ({ getValue }) => <strong>{getValue()}</strong>,
    }),
    packageColHelper.accessor('tokenAmount', {
      header: 'Coins',
      cell: ({ getValue }) => <span>{getValue()}</span>,
    }),
    packageColHelper.accessor('price', {
      header: 'Price (IDR)',
      cell: ({ getValue }) => <span>{currency.format(getValue())}</span>,
    }),
    packageColHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`control-status ${getValue() ? 'status-accepted' : 'status-submitted'}`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
    }),
    packageColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="table-action-group">
          <button
            type="button"
            className="table-action-btn"
            onClick={() => editPackage(row.original)}
            title="Edit package"
          >
            <Edit className="action-icon" /> Edit
          </button>
          <button
            type="button"
            className="table-action-btn table-action-btn-danger"
            onClick={() => void deletePackageItem(row.original)}
            disabled={deletingId === row.original.id}
            aria-label={`Delete package ${row.original.name}`}
            title={row.original.paymentCount ? 'Has payment history; deactivate it instead' : 'Delete package'}
          >
            <Trash2 className="action-icon" /> {deletingId === row.original.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    }),
  ], [deletingId, editingPackage]);

  // TANSTACK TABLE COLUMNS FOR DISCOUNTS
  const discountColumns = React.useMemo(() => [
    discountColHelper.accessor('name', {
      header: 'Campaign & Badge',
      cell: ({ row }) => {
        const d = row.original;
        const IconComp = getBadgeIcon(d.badgeStyle);
        return (
          <div className="flex items-center gap-3">
            <span className={`discount-badge-base ${getBadgeClass(d.badgeStyle)} shrink-0`}>
              <IconComp className="w-3 h-3" />
              {d.badgeText}
            </span>
            <div>
              <strong className="block font-semibold text-[13px]">{d.name}</strong>
              <small className="block text-[var(--muted-fg)] text-xs">
                {d.packageName ? `Package: ${d.packageName}` : 'All packages & Pass'}
              </small>
            </div>
          </div>
        );
      },
    }),
    discountColHelper.accessor('value', {
      header: 'Discount Value',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <span className="cell-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Tag className="cell-accessory-icon" />
            {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `${currency.format(d.value)} OFF`}
          </span>
        );
      },
    }),
    discountColHelper.accessor('startDate', {
      header: 'Active Period',
      cell: ({ row }) => {
        const d = row.original;
        const now = Date.now();
        const start = new Date(d.startDate).getTime();
        const end = new Date(d.endDate).getTime();
        const isExpired = now > end;
        const isScheduled = now < start;
        return (
          <div className="cell-stack">
            <span className="cell-primary" style={{ fontWeight: 500 }}>{formatDate(d.startDate)} – {formatDate(d.endDate)}</span>
            <small className="cell-meta-row">
              <Calendar className="cell-accessory-icon" />
              {isExpired ? 'Expired' : isScheduled ? 'Scheduled (Starts soon)' : 'Active now'}
            </small>
          </div>
        );
      },
    }),
    discountColHelper.accessor('issuedByName', {
      header: 'Issued By',
      cell: ({ row }) => {
        const d = row.original;
        const issuedByName = d.issuedByName || 'Admin';
        const issuedByEmail = d.issuedByEmail || '-';
        return (
          <div className="cell-stack">
            <span className="cell-primary font-medium">{issuedByName}</span>
            <span className="cell-meta-row">{issuedByEmail}</span>
          </div>
        );
      },
    }),
    discountColHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => {
        const d = row.original;
        const now = Date.now();
        const isExpired = now > new Date(d.endDate).getTime();
        const isScheduled = now < new Date(d.startDate).getTime();
        const statusLabel = !d.isActive ? 'Paused' : isExpired ? 'Expired' : isScheduled ? 'Scheduled' : 'Active';
        const statusClass = !d.isActive ? 'status-submitted' : isExpired ? 'status-submitted' : isScheduled ? 'status-under-review' : 'status-accepted';
        return (
          <span className={`control-status ${statusClass}`}>
            {statusLabel}
          </span>
        );
      },
    }),
    discountColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="table-action-group">
            <button
              type="button"
              className="table-action-btn"
              onClick={() => void toggleDiscountActive(d)}
              title={d.isActive ? 'Pause discount' : 'Activate discount'}
            >
              {d.isActive ? 'Pause' : 'Activate'}
            </button>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => editDiscountItem(d)}
              title="Edit discount"
            >
              <Edit className="action-icon" /> Edit
            </button>
            <button
              type="button"
              className="table-action-btn table-action-btn-danger"
              onClick={() => void deleteDiscountItem(d)}
              disabled={deletingId === d.id}
              aria-label={`Delete discount ${d.name}`}
            >
              <Trash2 className="action-icon" /> {deletingId === d.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        );
      },
    }),
  ], [deletingId]);

  // TANSTACK TABLE COLUMNS FOR USERS
  const userColumns = React.useMemo(() => [
    userColHelper.accessor('name', {
      header: 'User',
      cell: ({ row }) => {
        const u = row.original;
        const avatarSrc = u.image || getCartoonAvatarUrl(u.email || u.name || u.id);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" src={avatarSrc} alt={u.name || 'User'} />
            <div className="user-cell-info">
              <strong className="user-cell-name">
                {u.name || 'Anonymous'}
                {u.emailVerified && (
                  <span title="Email verified" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <CheckCircle2 className="cell-accessory-icon" />
                  </span>
                )}
              </strong>
              <small className="user-cell-email">{u.email}</small>
            </div>
          </div>
        );
      },
    }),
    userColHelper.accessor('isBanned', {
      header: 'Status',
      cell: ({ getValue }) => {
        const banned = getValue();
        return (
          <span className={`control-status ${banned ? 'status-rejected' : 'status-accepted'}`}>
            {banned ? <XCircle /> : <CheckCircle2 />}
            {banned ? 'Banned' : 'Active'}
          </span>
        );
      },
    }),
    userColHelper.accessor('isSandbox', {
      header: 'Sandbox Access',
      cell: ({ row }) => {
        const u = row.original;
        const isSandbox = Boolean(u.isSandbox);
        return (
          <label
            className="inline-flex items-center gap-2 cursor-pointer select-none"
            onClick={(e) => e.stopPropagation()}
            title={isSandbox ? 'Klik untuk mencabut status Sandbox user ini' : 'Klik untuk memindahkan user ini ke Sandbox'}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
              checked={isSandbox}
              onChange={() => {
                setSandboxConfirmModal({
                  isOpen: true,
                  user: u,
                  targetState: !isSandbox,
                  loading: false,
                });
              }}
            />
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isSandbox
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-muted-fg'
              }`}
            >
              {isSandbox ? (
                <>
                  <FlaskConical className="w-3 h-3" />
                  Tester Active
                </>
              ) : (
                'Masuk Sandbox'
              )}
            </span>
          </label>
        );
      },
    }),
    userColHelper.accessor('target', {
      header: 'Target PTN',
      cell: ({ getValue }) => <span className="text-xs">{getValue() || '—'}</span>,
    }),
    userColHelper.accessor('tokenBalance', {
      header: 'Coins & Streak',
      cell: ({ row }) => (
        <div className="cell-stack">
          <span className="cell-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Coins className="cell-accessory-icon" />
            {row.original.tokenBalance} coins
          </span>
          {row.original.currentStreak !== undefined && (
            <small className="cell-meta-row">
              <Flame className="cell-accessory-icon" />
              {row.original.currentStreak} hari
            </small>
          )}
        </div>
      ),
    }),
    userColHelper.accessor('createdAt', {
      header: 'Joined',
      cell: ({ getValue }) => (
        <span className="cell-meta-row">
          <Calendar className="cell-accessory-icon" />
          {formatDate(getValue())}
        </span>
      ),
    }),
    userColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const u = row.original;
        const isSelf = member?.email === u.email;
        return (
          <div className="table-action-group justify-end">
            <button
              type="button"
              className="table-action-btn"
              onClick={() => {
                setSelectedUserForModal(u);
                setUserModalOpen(true);
              }}
              title="View user details"
            >
              <Eye className="action-icon" /> View
            </button>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => void toggleBanUser(u)}
              disabled={isSelf || banningUserId === u.id}
              title={u.isBanned ? 'Unban user' : 'Ban user'}
            >
              <Ban className="action-icon" />
              {banningUserId === u.id ? '...' : u.isBanned ? 'Unban' : 'Ban'}
            </button>
            <button
              type="button"
              className="table-action-btn table-action-btn-danger"
              onClick={() => void deleteUserItem(u)}
              disabled={isSelf || deletingUserId === u.id}
              title="Delete user"
            >
              <Trash2 className="action-icon" />
              {deletingUserId === u.id ? '...' : 'Delete'}
            </button>
          </div>
        );
      },
    }),
  ], [member, banningUserId, deletingUserId]);

  // TANSTACK TABLE COLUMNS FOR PAYMENTS
  const paymentColumns = React.useMemo(() => [
    paymentColHelper.accessor('orderId', {
      header: 'Order ID',
      cell: ({ row }) => {
        const method = (row.original.paymentMethod || 'QRIS').replace('_STATIC', '');
        const isQris = method.toUpperCase().includes('QRIS');
        return (
          <div className="cell-stack">
            <strong className="cell-mono">{row.original.orderId}</strong>
            <small className="cell-meta-row">
              {isQris ? <QrCode className="cell-accessory-icon" /> : <CreditCard className="cell-accessory-icon" />}
              <span>{method}</span>
            </small>
          </div>
        );
      },
    }),
    paymentColHelper.accessor('user', {
      header: 'User',
      cell: ({ row }) => {
        const u = row.original.user;
        if (!u) {
          return <span className="cell-meta-row">Deleted User</span>;
        }
        const avatarSrc = u.image || getCartoonAvatarUrl(u.email || u.name || u.id);
        return (
          <button
            type="button"
            className="user-cell-btn"
            onClick={() => {
              setSelectedUserForModal(u);
              setUserModalOpen(true);
            }}
            title="View user details"
          >
            <Avatar size="sm" src={avatarSrc} alt={u.name || 'User'} />
            <div className="user-cell-info">
              <strong className="user-cell-name">{u.name || 'User'}</strong>
              <small className="user-cell-email">{u.email}</small>
            </div>
          </button>
        );
      },
    }),
    paymentColHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ row }) => {
        const pkgName = row.original.tokenPackage?.name?.trim() || '';
        const isPass = row.original.tokenAmount >= 999 || pkgName.toLowerCase().includes('pass');
        const coinLabel = `${row.original.tokenAmount} ${row.original.tokenAmount === 1 ? 'coin' : 'coins'}`;
        const hasDistinctPkgName = pkgName && !/^\d+\s*coins?$/i.test(pkgName);
        return (
          <div className="cell-stack">
            <strong className="cell-primary">{currency.format(row.original.amount)}</strong>
            <small className="cell-meta-row">
              {isPass ? (
                <>
                  <Ticket className="cell-accessory-icon" />
                  <span>{pkgName || 'PTN Premium Pass'}</span>
                </>
              ) : (
                <>
                  <Coins className="cell-accessory-icon" />
                  <span>{hasDistinctPkgName ? `${coinLabel} · ${pkgName}` : coinLabel}</span>
                </>
              )}
            </small>
          </div>
        );
      },
    }),
    paymentColHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const st = getValue();
        let badgeClass = 'status-pending';
        let label = 'Waiting / Pending';
        let IconComp = Clock;
        if (st === 'CONFIRMED') {
          badgeClass = 'status-accepted';
          label = 'Confirmed';
          IconComp = CheckCircle2;
        } else if (st === 'CANCELLED') {
          badgeClass = 'status-rejected';
          label = 'Cancelled';
          IconComp = XCircle;
        } else if (st === 'DECLINED') {
          badgeClass = 'status-rejected';
          label = 'Declined';
          IconComp = AlertCircle;
        }
        return (
          <span className={`control-status ${badgeClass}`}>
            <IconComp />
            {label}
          </span>
        );
      },
    }),
    paymentColHelper.accessor('createdAt', {
      header: 'Date & Time',
      cell: ({ getValue }) => {
        const d = new Date(getValue());
        return (
          <div className="cell-stack">
            <span className="cell-primary" style={{ fontWeight: 500 }}>{dateLabel.format(d)}</span>
            <small className="cell-meta-row">
              <Clock className="cell-accessory-icon" />
              <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </small>
          </div>
        );
      },
    }),
    paymentColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const u = row.original.user;
        if (!u) return null;
        return (
          <div className="table-action-group justify-end">
            <button
              type="button"
              className="table-action-btn"
              onClick={() => {
                setSelectedUserForModal(u);
                setUserModalOpen(true);
              }}
              title="View user details"
            >
              <Eye className="action-icon" /> View User
            </button>
          </div>
        );
      },
    }),
  ], []);

  // TANSTACK TABLE COLUMNS FOR VOUCHERS & REFERRALS
  const voucherColumns = React.useMemo(() => [
    voucherColHelper.accessor('code', {
      header: 'Kode Referal',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag className="cell-accessory-icon" />
              <strong className="cell-mono font-bold tracking-wider">{v.code}</strong>
              <button
                type="button"
                className="copy-mini-btn"
                title="Salin kode"
                onClick={() => void handleCopyCode(v.code)}
              >
                {copiedCode === v.code ? (
                  <Check style={{ width: 12, height: 12 }} />
                ) : (
                  <Copy style={{ width: 12, height: 12 }} />
                )}
              </button>
            </div>
            {v.description && (
              <small className="cell-meta-row truncate max-w-[220px]" title={v.description}>
                {v.description}
              </small>
            )}
          </div>
        );
      },
    }),
    voucherColHelper.accessor('discountPercent', {
      header: 'Diskon & Komisi',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack">
            <div className="cell-meta-row">
              <Percent className="cell-accessory-icon" />
              <strong>Diskon: {v.discountPercent}%</strong>
            </div>
            <div className="cell-meta-row">
              <Coins className="cell-accessory-icon" />
              <span>Komisi: {v.commissionPercent}%</span>
            </div>
            {v.maxDiscount ? (
              <small className="cell-meta-row text-[10.5px]">
                Maks Rp {v.maxDiscount.toLocaleString('id-ID')}
              </small>
            ) : null}
          </div>
        );
      },
    }),
    voucherColHelper.accessor('issuedToName', {
      header: 'Issued To (Pemilik)',
      cell: ({ row }) => {
        const v = row.original;
        const name = v.resolvedIssuedToName || v.issuedToName || v.referrerName || 'Umum / Promo';
        const email = v.resolvedIssuedToEmail || v.issuedToEmail || '-';
        const avatarSrc = v.resolvedIssuedToImage || getCartoonAvatarUrl(email !== '-' ? email : name);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" src={avatarSrc} alt={name} />
            <div className="user-cell-info">
              <strong className="user-cell-name truncate max-w-[160px]" title={name}>
                {name}
              </strong>
              <small className="user-cell-email truncate max-w-[160px]" title={email}>
                {email}
              </small>
            </div>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('issuedByName', {
      header: 'Issued By (Pembuat)',
      cell: ({ row }) => {
        const v = row.original;
        const name = v.issuedByName || 'Admin';
        const email = v.issuedByEmail || '-';
        return (
          <div className="cell-stack">
            <strong className="text-xs truncate max-w-[140px]" title={name}>
              {name}
            </strong>
            <small className="cell-meta-row truncate max-w-[140px]" title={email}>
              {email}
            </small>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('totalUsed', {
      header: () => <div className="text-center">Total Used</div>,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack items-center text-center">
            <strong className="cell-mono text-xs">{v.totalUsed}x</strong>
            <small className="cell-meta-row text-[10.5px]">
              kuota: {v.maxUsage ? `${v.maxUsage}x` : '∞'}
            </small>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('totalRevenue', {
      header: () => <div className="text-right">Total Revenue</div>,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack items-end text-right">
            <strong className="cell-mono text-xs">
              Rp {(v.totalRevenue || 0).toLocaleString('id-ID')}
            </strong>
            <small className="cell-meta-row text-[10px]">bruto</small>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('totalCommission', {
      header: () => <div className="text-right">Total Komisi</div>,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack items-end text-right">
            <strong className="cell-mono text-xs">
              Rp {(v.totalCommission || 0).toLocaleString('id-ID')}
            </strong>
            <small className="cell-meta-row text-[10px]">hak mitra</small>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('netRevenue', {
      header: () => <div className="text-right">Net Platform</div>,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="cell-stack items-end text-right">
            <strong className="cell-mono text-xs font-bold">
              Rp {(v.netRevenue || 0).toLocaleString('id-ID')}
            </strong>
            <small className="cell-meta-row text-[10px]">bersih</small>
          </div>
        );
      },
    }),
    voucherColHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => {
        const v = row.original;
        const isExpired = v.expiresAt ? new Date(v.expiresAt) < new Date() : false;
        const isLimitReached = v.maxUsage ? v.totalUsed >= v.maxUsage : false;
        if (isExpired) {
          return (
            <span className="control-status status-pending">
              <Clock />
              <span>Kedaluwarsa</span>
            </span>
          );
        }
        if (!v.isActive) {
          return (
            <span className="control-status status-rejected">
              <XCircle />
              <span>Nonaktif</span>
            </span>
          );
        }
        if (isLimitReached) {
          return (
            <span className="control-status status-pending">
              <AlertCircle />
              <span>Habis</span>
            </span>
          );
        }
        return (
          <span className="control-status status-accepted">
            <CheckCircle2 />
            <span>Aktif</span>
          </span>
        );
      },
    }),
    voucherColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="table-action-group justify-end">
            <button
              type="button"
              className="table-action-btn"
              onClick={() => void toggleVoucherActive(v)}
              title={v.isActive ? 'Nonaktifkan kode' : 'Aktifkan kode'}
            >
              {v.isActive ? 'Matikan' : 'Nyalakan'}
            </button>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => editVoucherItem(v)}
              title="Edit kode referal"
            >
              <Edit className="action-icon" /> Edit
            </button>
            <button
              type="button"
              className="table-action-btn table-action-btn-danger"
              onClick={() => void deleteVoucherItem(v)}
              disabled={deletingId === v.id}
              title="Hapus kode referal"
            >
              <Trash2 className="action-icon" />
            </button>
          </div>
        );
      },
    }),
  ], [copiedCode, deletingId]);

  const filteredVouchers = React.useMemo(() => {
    let list = vouchers;
    const now = new Date();
    if (voucherFilter === 'ACTIVE') {
      list = list.filter((v) => v.isActive && (!v.expiresAt || new Date(v.expiresAt) >= now));
    } else if (voucherFilter === 'INACTIVE') {
      list = list.filter((v) => !v.isActive);
    } else if (voucherFilter === 'EXPIRED') {
      list = list.filter((v) => v.expiresAt && new Date(v.expiresAt) < now);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.code.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.resolvedIssuedToName && v.resolvedIssuedToName.toLowerCase().includes(q)) ||
        (v.issuedToName && v.issuedToName.toLowerCase().includes(q)) ||
        (v.issuedToEmail && v.issuedToEmail.toLowerCase().includes(q))
      );
    }
    return list;
  }, [vouchers, voucherFilter, search]);

  // TANSTACK TABLE COLUMNS FOR ARTICLES
  const articleColumns = React.useMemo(() => [
    articleColHelper.accessor('title', {
      header: 'Article',
      cell: ({ row }) => (
        <div className="article-thumbnail-cell">
          {row.original.coverImageUrl ? (
            <img src={row.original.coverImageUrl} alt="" className="article-thumb-img" />
          ) : (
            <div className="article-thumb-img flex items-center justify-center text-lg">
              📰
            </div>
          )}
          <div>
            <strong>{row.original.title}</strong>
            <small className="block text-[var(--muted-fg)]">/{row.original.slug}</small>
          </div>
        </div>
      ),
    }),
    articleColHelper.accessor('category', {
      header: 'Category & Tags',
      cell: ({ row }) => (
        <div>
          <span className="article-badge-category">{row.original.category}</span>
          {row.original.tags && (
            <small className="block text-[var(--muted-fg)] text-[11px] truncate max-w-[180px]">
              {row.original.tags}
            </small>
          )}
        </div>
      ),
    }),
    articleColHelper.accessor('authorName', {
      header: 'Author',
      cell: ({ getValue }) => <span>{getValue()}</span>,
    }),
    articleColHelper.accessor('viewsCount', {
      header: 'Views',
      cell: ({ getValue }) => <span>{getValue().toLocaleString()}</span>,
    }),
    articleColHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`applicant-status-badge ${getValue() === 'PUBLISHED' ? 'status-accepted' : 'status-submitted'}`}>
          {getValue()}
        </span>
      ),
    }),
    articleColHelper.accessor('publishedAt', {
      header: 'Published',
      cell: ({ getValue }) => <span>{getValue() ? formatDate(getValue()) : 'Draft'}</span>,
    }),
    articleColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="table-action-group">
          <button
            type="button"
            className="table-action-btn"
            onClick={() => setPreviewArticle(row.original)}
            title="Preview article"
          >
            <Eye className="action-icon" /> Preview
          </button>
          <button
            type="button"
            className="table-action-btn"
            onClick={() => editArticleItem(row.original)}
            title="Edit article"
          >
            <Edit className="action-icon" /> Edit
          </button>
          <button
            type="button"
            className="table-action-btn table-action-btn-danger"
            onClick={() => void deleteArticleItem(row.original)}
            title="Delete article"
          >
            <Trash2 className="action-icon" /> Delete
          </button>
        </div>
      ),
    }),
  ], []);

  // Helper for Question ID naming convention: JITU-[SUBTEST]-[DIFF]-[TYPE]-[ID_SUFFIX]
  const formatQuestionCode = React.useCallback((q: Partial<QuestionItem>) => {
    const subtestMap: Record<string, string> = {
      PENGETAHUAN_KUANTITATIF: 'PK',
      PENALARAN_UMUM: 'PU',
      PEMAHAMAN_BACAAN_MENULIS: 'PBM',
      PENGETAHUAN_PEMAHAMAN_UMUM: 'PPU',
      LITERASI_INDONESIA: 'LBI',
      LITERASI_INGGRIS: 'LBE',
      PENALARAN_MATEMATIKA: 'PM',
      PK: 'PK',
      PU: 'PU',
      PBM: 'PBM',
      PPU: 'PPU',
      LBI: 'LBI',
      LBE: 'LBE',
      PM: 'PM',
    };
    const subtestCode = subtestMap[q.subtest || ''] || (q.subtest ? q.subtest.slice(0, 3).toUpperCase() : 'GEN');

    const diffMap: Record<string, string> = {
      EASY: 'EZ',
      MEDIUM: 'MD',
      HARD: 'HD',
    };
    const diffCode = diffMap[q.difficulty || ''] || 'MD';

    const isShort = q.type === 'ISIAN_SINGKAT' || q.type === 'SHORT_ANSWER';
    const isComplex = q.type === 'COMPLEX_MULTIPLE_CHOICE';
    const typeCode = isShort ? 'IS' : isComplex ? 'PGK' : 'PG';

    const idClean = (q.id || '').replace(/[^a-zA-Z0-9]/g, '');
    const idSuffix = idClean.length >= 4 ? idClean.slice(-4).toUpperCase() : '0001';

    return `JITU-${subtestCode}-${diffCode}-${typeCode}-${idSuffix}`;
  }, []);

  // TANSTACK TABLE COLUMNS FOR QUESTIONS (Minimal, Sleek Border Color-Coded)
  const questionColumns = React.useMemo(() => [
    questionColHelper.display({
      id: 'select',
      header: ({ table }) => {
        const pageIds = table.getRowModel().rows.map((r) => r.original.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedQuestionIdSet.has(id));
        const someSelected = pageIds.some((id) => selectedQuestionIdSet.has(id));
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              aria-label="Pilih semua soal di halaman ini"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={() => togglePageQuestionSelection(pageIds)}
              style={{ width: '15px', height: '15px', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const q = row.original;
        const checked = selectedQuestionIdSet.has(q.id);
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              aria-label={`Pilih soal ${formatQuestionCode(q)}`}
              checked={checked}
              onMouseDown={(e) => {
                shiftSelectPendingRef.current = e.shiftKey;
              }}
              onChange={() => {
                const useShift = shiftSelectPendingRef.current;
                shiftSelectPendingRef.current = false;
                toggleQuestionSelection(q.id, useShift);
              }}
              style={{ width: '15px', height: '15px', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>
        );
      },
    }),
    questionColHelper.accessor('id', {
      header: 'ID Soal',
      cell: ({ row }) => {
        const code = formatQuestionCode(row.original);
        const isCopied = copiedQuestionId === row.original.id;
        const cleanBatch = row.original.batch?.trim() || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <span
                className="font-mono text-xs font-semibold text-zinc-100 tracking-wide select-all"
                style={{ whiteSpace: 'nowrap' }}
                title={`ID Database: ${row.original.id}`}
              >
                {code}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void navigator.clipboard.writeText(code);
                  setCopiedQuestionId(row.original.id);
                  setTimeout(() => setCopiedQuestionId(null), 1500);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  borderRadius: '6px',
                  border: isCopied ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isCopied ? '#34d399' : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover:!text-white hover:!border-white/30 hover:!bg-white/10 shrink-0"
                title={isCopied ? 'Tersalin!' : 'Salin ID Soal'}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {cleanBatch ? (
              <span
                title={`Batch: ${cleanBatch}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  fontSize: '10.5px',
                  fontWeight: 550,
                  letterSpacing: '0.01em',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  background: 'rgba(251, 191, 36, 0.08)',
                  color: '#fbbf24',
                  whiteSpace: 'nowrap',
                }}
              >
                <Layers style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                {cleanBatch}
              </span>
            ) : (
              <span
                style={{
                  fontSize: '10.5px',
                  color: '#52525b',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                }}
              >
                Tanpa Batch
              </span>
            )}
          </div>
        );
      },
    }),
    questionColHelper.accessor('target', {
      header: 'Lifecycle & Distribusi',
      cell: ({ row }) => {
        const q = row.original;
        const statusBadge = getQuestionStatusBadge(q.status);
        const val = q.target;
        const attempts = Number(q.attemptCount || 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${statusBadge.border}`,
                background: statusBadge.bg,
                color: statusBadge.color,
                whiteSpace: 'nowrap',
              }}
              title={q.revisionNotes || undefined}
            >
              {statusBadge.label}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {(q.isPracticeAssigned || val === 'FOR_PRACTICE') && (
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' }}>
                  Latihan Aktif
                </span>
              )}
              {(q.tryoutId || val === 'FOR_TRYOUT') && (
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: '#7dd3fc' }}>
                  {q.tryoutId
                    ? `Tryout: ${q.tryoutTitle || 'Terplot'}${q.isLockedInTryout ? ' 🔒' : q.tryoutStatus === 'FINISHED' ? ' (Selesai)' : ''}`
                    : 'Pool Tryout'}
                </span>
              )}
              {attempts > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--muted-fg)' }}>
                  · {attempts} jawaban
                </span>
              )}
            </div>
          </div>
        );
      },
    }),
    questionColHelper.accessor('type', {
      header: 'Tipe Soal',
      cell: ({ row }) => {
        const isShort = row.original.type === 'ISIAN_SINGKAT' || row.original.type === 'SHORT_ANSWER';
        const isComplex = row.original.type === 'COMPLEX_MULTIPLE_CHOICE';

        let label = 'Pilihan Ganda';
        let borderColor = 'rgba(148, 163, 184, 0.35)';
        let bgColor = 'rgba(148, 163, 184, 0.06)';
        let textColor = '#cbd5e1';

        if (isShort) {
          label = 'Isian Singkat';
          borderColor = 'rgba(245, 158, 11, 0.45)';
          bgColor = 'rgba(245, 158, 11, 0.08)';
          textColor = '#fcd34d';
        } else if (isComplex) {
          label = 'Pilihan Ganda Kompleks';
          borderColor = 'rgba(20, 184, 166, 0.45)';
          bgColor = 'rgba(20, 184, 166, 0.08)';
          textColor = '#5eead4';
        }

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 550,
              letterSpacing: '0.01em',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        );
      },
    }),
    questionColHelper.accessor('difficulty', {
      header: 'Kesulitan',
      cell: ({ getValue }) => {
        const d = getValue();
        let label = 'Sedang';
        let borderColor = 'rgba(245, 158, 11, 0.45)';
        let bgColor = 'rgba(245, 158, 11, 0.08)';
        let textColor = '#fcd34d';
        let dotColor = '#fbbf24';

        if (d === 'EASY') {
          label = 'Mudah';
          borderColor = 'rgba(16, 185, 129, 0.45)';
          bgColor = 'rgba(16, 185, 129, 0.08)';
          textColor = '#6ee7b7';
          dotColor = '#34d399';
        } else if (d === 'HARD') {
          label = 'Sulit';
          borderColor = 'rgba(244, 63, 94, 0.45)';
          bgColor = 'rgba(244, 63, 94, 0.08)';
          textColor = '#fda4af';
          dotColor = '#f43f5e';
        }

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 550,
              letterSpacing: '0.01em',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: dotColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        );
      },
    }),
    questionColHelper.display({
      id: 'tagging',
      header: 'Materi & Tagging',
      cell: ({ row }) => {
        const item = row.original;
        const subtestMeta = ALL_SUBTESTS.find((s) => s.id === item.subtest);
        const subtestLabel = subtestMeta?.shortLabel || item.subtest || '—';
        const topic = item.topicTitle || null;
        const subtopic = item.subtopicTitle || null;
        const pattern = item.pattern || null;
        const hasTag = Boolean(topic || subtopic || pattern);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtestLabel}
              </span>
              {topic && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topic}
                </span>
              )}
            </div>
            {hasTag ? (
              <div style={{ fontSize: '11px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {subtopic && <span>› {subtopic}</span>}
                {pattern && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      color: '#d4d4d8',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      padding: '0 5px',
                    }}
                  >
                    {pattern}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#52525b', fontStyle: 'italic' }}>
                Belum ditagging
              </span>
            )}
          </div>
        );
      },
    }),
    questionColHelper.display({
      id: 'actions',
      header: () => <div style={{ width: '152px', marginLeft: 'auto', textAlign: 'left' }}>Aksi & QC</div>,
      cell: ({ row }) => {
        const q = row.original;
        const status = (q.status || 'DRAFT').toUpperCase();
        const busy = workflowBusyId === q.id;
        const hasAttempts = Number(q.attemptCount || 0) > 0;

        return (
          <div className="table-action-stack">
            {status === 'DRAFT' && (
              <button
                type="button"
                className="table-action-btn"
                style={{ color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)' }}
                disabled={busy}
                onClick={() => void handleQuestionWorkflow(q, 'SUBMIT_QC')}
                title="Ajukan soal ini ke Antrean QC Sandbox"
              >
                <QcSendIcon className="action-icon" /> {busy ? '…' : 'Ajukan QC'}
              </button>
            )}

            {status === 'QC_SANDBOX' && (
              <>
                <button
                  type="button"
                  className="table-action-btn"
                  style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                  disabled={busy || sandboxOpeningId === q.id}
                  onClick={() => void handleOpenInSandbox(q)}
                  title="Buka tampilan soal & pembahasan di Main Sandbox"
                >
                  <ExternalLink className="action-icon" /> {sandboxOpeningId === q.id ? 'Membuka…' : 'Buka di Sandbox'}
                </button>
                <button
                  type="button"
                  className="table-action-btn"
                  style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                  disabled={busy}
                  onClick={() => void handleQuestionWorkflow(q, 'APPROVE')}
                  title="Lolos QC -> Ubah ke Status Ready"
                >
                  <QcCheckIcon className="action-icon" /> {busy ? '…' : 'Lolos QC'}
                </button>
                <button
                  type="button"
                  className="table-action-btn"
                  style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.35)' }}
                  disabled={busy}
                  onClick={() =>
                    setRevisionModal({ open: true, question: q, notes: q.revisionNotes || '', submitting: false })
                  }
                  title="Tolak & kembalikan ke Kotak Revisi"
                >
                  <QcAlertIcon className="action-icon" /> Revisi
                </button>
              </>
            )}

            {status === 'RETIRED' && (
              <button
                type="button"
                className="table-action-btn"
                style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                disabled={busy}
                onClick={() => void handleQuestionWorkflow(q, 'RESTORE', { restoreStatus: 'READY' })}
                title="Pulihkan ke Status Ready"
              >
                <QcRestoreIcon className="action-icon" /> Pulihkan
              </button>
            )}

            <button
              type="button"
              className="table-action-btn"
              onClick={() => {
                setPreviewQuestion(q);
                setPreviewSlideIdx(0);
              }}
              title="Lihat Detail Soal & Pembahasan"
            >
              <Eye className="action-icon" /> Detail
            </button>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => editQuestionItem(q)}
              title={status === 'NEEDS_REVISION' ? 'Perbaiki Revisi (Prompt LLM / Manual)' : 'Edit Soal'}
            >
              <Edit className="action-icon" /> {status === 'NEEDS_REVISION' ? 'Revisi' : 'Edit'}
            </button>

            {hasAttempts ? (
              status !== 'RETIRED' && (
                <button
                  type="button"
                  className="table-action-btn"
                  style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                  disabled={busy}
                  onClick={() => void handleQuestionWorkflow(q, 'RETIRE')}
                  title="Sudah dijawab siswa -> Nonaktifkan (Retired) tanpa menghapus riwayat"
                >
                  <QcArchiveIcon className="action-icon" /> Nonaktifkan
                </button>
              )
            ) : (
              <button
                type="button"
                className="table-action-btn table-action-btn-danger"
                onClick={() => void deleteQuestionItem(q)}
                disabled={deletingId === q.id}
                title="Hapus Permanen (0 jawaban siswa)"
              >
                <Trash2 className="action-icon" /> {deletingId === q.id ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        );
      },
    }),
  ], [copiedQuestionId, deletingId, workflowBusyId, sandboxOpeningId, formatQuestionCode, selectedQuestionIdSet, togglePageQuestionSelection, toggleQuestionSelection]);

  const questionStatusCounts = React.useMemo(() => {
    const counts = {
      ALL: questions.length,
      DRAFT: 0,
      QC_SANDBOX: 0,
      NEEDS_REVISION: 0,
      READY: 0,
      RETIRED: 0,
    };
    for (const q of questions) {
      const s = (q.status || 'DRAFT').toUpperCase();
      if (s === 'DRAFT') counts.DRAFT++;
      else if (s === 'QC_SANDBOX') counts.QC_SANDBOX++;
      else if (s === 'NEEDS_REVISION') counts.NEEDS_REVISION++;
      else if (s === 'READY') counts.READY++;
      else if (s === 'RETIRED') counts.RETIRED++;
    }
    return counts;
  }, [questions]);

  // DYNAMIC CLIENT-SIDE & SERVER-SIDE FILTERED QUESTIONS
  const filteredQuestions = React.useMemo(() => {
    let list = questions;

    // 0. Lifecycle Status Filter
    if (filterStatus && filterStatus !== 'ALL') {
      list = list.filter((q) => (q.status || 'DRAFT').toUpperCase() === filterStatus);
    }

    // 1. Subtest Filter
    if (filterSubtest && filterSubtest !== 'ALL') {
      const norm = (s: string) => (s || '').toUpperCase().replace(/\s+/g, '_');
      const targetSub = norm(filterSubtest);
      list = list.filter((q) => {
        const qSub = norm(q.subtest || '');
        if (targetSub === 'PENALARAN_UMUM' || targetSub === 'PU') return qSub === 'PENALARAN_UMUM' || qSub === 'PU';
        if (targetSub === 'PENGETAHUAN_KUANTITATIF' || targetSub === 'PK') return qSub === 'PENGETAHUAN_KUANTITATIF' || qSub === 'PK';
        if (targetSub === 'PEMAHAMAN_BACAAN_MENULIS' || targetSub === 'PEMAHAMAN_BACAAN' || targetSub === 'PBM') {
          return qSub === 'PEMAHAMAN_BACAAN_MENULIS' || qSub === 'PEMAHAMAN_BACAAN' || qSub === 'PBM';
        }
        if (targetSub === 'PENGETAHUAN_PEMAHAMAN_UMUM' || targetSub === 'PENGETAHUAN_UMUM' || targetSub === 'PPU') {
          return qSub === 'PENGETAHUAN_PEMAHAMAN_UMUM' || qSub === 'PENGETAHUAN_UMUM' || qSub === 'PPU';
        }
        if (targetSub === 'LITERASI_INDONESIA' || targetSub === 'LBI') return qSub === 'LITERASI_INDONESIA' || qSub === 'LBI';
        if (targetSub === 'LITERASI_INGGRIS' || targetSub === 'LBE') return qSub === 'LITERASI_INGGRIS' || qSub === 'LBE';
        if (targetSub === 'PENALARAN_MATEMATIKA' || targetSub === 'PM') return qSub === 'PENALARAN_MATEMATIKA' || qSub === 'PM';
        return qSub.includes(targetSub);
      });
    }

    // 2. Status / Target Filter
    if (filterTarget && filterTarget !== 'ALL') {
      list = list.filter((q) => {
        const t = (q.target || 'DRAFT').toUpperCase();
        if (filterTarget === 'FOR_PRACTICE') return t === 'FOR_PRACTICE' || t === 'PRACTICE';
        if (filterTarget === 'FOR_TRYOUT') return t === 'FOR_TRYOUT' || t === 'TRYOUT';
        if (filterTarget === 'SOAL_ASLI') return t === 'SOAL_ASLI' || t === 'ARSIP';
        return t === filterTarget;
      });
    }

    // 2b. Batch Filter
    if (filterBatch && filterBatch !== 'ALL') {
      if (filterBatch === '__NONE__') {
        list = list.filter((q) => !q.batch || !q.batch.trim());
      } else {
        list = list.filter((q) => (q.batch || '').trim() === filterBatch);
      }
    }

    // 3. Search Filter
    if (search && search.trim()) {
      const qLower = search.trim().toLowerCase();
      list = list.filter((q) => {
        const code = formatQuestionCode(q).toLowerCase();
        const content = (q.content || '').toLowerCase();
        const narration = (q.narration || '').toLowerCase();
        const subtest = (q.subtest || '').toLowerCase();
        const topic = (q.topicTitle || '').toLowerCase();
        const subtopic = (q.subtopicTitle || '').toLowerCase();
        const batch = (q.batch || '').toLowerCase();
        const tryout = (q.tryoutTitle || '').toLowerCase();
        const pkg = (q.packageTitle || '').toLowerCase();
        const id = (q.id || '').toLowerCase();
        return (
          code.includes(qLower) ||
          content.includes(qLower) ||
          narration.includes(qLower) ||
          subtest.includes(qLower) ||
          topic.includes(qLower) ||
          subtopic.includes(qLower) ||
          batch.includes(qLower) ||
          tryout.includes(qLower) ||
          pkg.includes(qLower) ||
          id.includes(qLower)
        );
      });
    }

    return list;
  }, [questions, filterStatus, filterSubtest, filterTarget, filterBatch, search, formatQuestionCode]);

  filteredQuestionIdsRef.current = filteredQuestions.map((q) => q.id);

  const selectedVisibleQuestions = React.useMemo(
    () => filteredQuestions.filter((q) => selectedQuestionIdSet.has(q.id)),
    [filteredQuestions, selectedQuestionIdSet],
  );

  // TANSTACK TABLE COLUMNS FOR CAREERS
  const careerColumns = React.useMemo(() => [
    careerColHelper.accessor('fullName', {
      header: 'Applicant',
      cell: ({ row }) => (
        <div>
          <strong>{row.original.fullName}</strong>
          <small className="block text-[var(--muted-fg)]">
            {row.original.email} · {row.original.university}
          </small>
        </div>
      ),
    }),
    careerColHelper.accessor('primaryRole', {
      header: 'Role Applied',
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    careerColHelper.accessor('primaryDivision', {
      header: 'Division',
      cell: ({ getValue }) => <span>{getValue()}</span>,
    }),
    careerColHelper.accessor('createdAt', {
      header: 'Applied Date',
      cell: ({ getValue }) => <span>{formatDate(getValue())}</span>,
    }),
    careerColHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <ComboboxSelect
          value={row.original.status}
          onValueChange={(val) => void updateApplicationStatus(row.original, val as CareerApplication['status'])}
          options={[
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'Under Review', value: 'UNDER_REVIEW' },
            { label: 'Interview', value: 'INTERVIEW' },
            { label: 'Accepted', value: 'ACCEPTED' },
            { label: 'Rejected', value: 'REJECTED' },
          ]}
          triggerClassName={`h-7 text-xs w-[125px] font-semibold status-${row.original.status.toLowerCase()}`}
        />
      ),
    }),
    careerColHelper.display({
      id: 'candidateDetails',
      header: () => <div className="text-right">Candidate Details</div>,
      cell: ({ row }) => (
        <div className="table-action-group">
          <button
            type="button"
            className="table-action-btn"
            onClick={() => openApplicantModal(row.original)}
            title="View candidate details"
          >
            View details <ExternalLink className="action-icon" />
          </button>
        </div>
      ),
    }),
  ], []);

  const maxRevenue = Math.max(1, ...(summary?.monthlyRevenue.map(({ revenue }) => revenue) ?? []));

  return (
    <div className="page-content control-center-page">
      {error && <div className="inline-message error" role="alert">{error}</div>}
      {notice && <div className="inline-message control-success" role="status">{notice}</div>}

      {(section === 'users' || section === 'careers' || section === 'articles' || section === 'payments' || section === 'vouchers') && (
        <form className="control-search" onSubmit={submitSearch}>
          <input
            className="field-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              section === 'users'
                ? 'Search users by name or email...'
                : section === 'careers'
                ? 'Search applicants by name, email, university, or position...'
                : section === 'payments'
                ? 'Search payments by Order ID, user name, or email...'
                : section === 'vouchers'
                ? 'Cari kode referal, pemilik, atau email...'
                : 'Search articles by title, category, or author...'
            }
            aria-label="Search"
          />
          <button className="button button-secondary" type="submit" disabled={loading}>
            Search
          </button>
        </form>
      )}

      {/* SECTION 1: TRYOUTS DATA TABLE & PER-TRYOUT QUESTION POOL MANAGER */}
      {section === 'tryouts' && managingTryoutId && (
        <TryoutQuestionsSection
          key={tryoutWorkspaceRefreshKey}
          tryoutId={managingTryoutId}
          jituMainUrl={JITU_MAIN_URL}
          onBack={() => setManagingTryoutId(null)}
          onEditQuestion={(q) => editQuestionItem(q as unknown as QuestionItem)}
          onOpenCreateForTryout={(tid) => {
            setEditingQuestion(null);
            setImportBatch('');
            setCreateTarget('FOR_TRYOUT');
            setCreateTryoutId(tid);
            setCreateMethodView('SELECT');
            setIsPromptAdjusterOpen(false);
            setCreateMethodModalOpen(true);
            setError('');
            setNotice('');
          }}
          onQuestionsChanged={() => void loadSection('tryouts', '', true)}
          onNotice={setNotice}
          onError={setError}
        />
      )}

      {section === 'tryouts' && !managingTryoutId && (
        <section className="control-panel" aria-labelledby="tryout-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="tryout-heading">Tryout management</h2>
              <p>Create tryouts and update their schedule, visibility, and solution price.</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setEditingTryout(null);
                setTryoutForm(initialTryoutForm);
                setTryoutFormOpen(true);
                setError('');
                setNotice('');
              }}
            >
              New tryout
            </button>
          </div>

          {tryoutFormOpen && (
            <form className="control-edit-form" onSubmit={saveTryout}>
              <h3>{editingTryout ? 'Edit tryout' : 'Create tryout'}</h3>
              <div className="control-form-grid">
                <label className="field-label">
                  Title
                  <input
                    className="field-input"
                    required
                    minLength={2}
                    value={tryoutForm.title}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, title: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Batch
                  <ComboboxSelect
                    value={tryoutForm.batch}
                    onValueChange={(val) => setTryoutForm({ ...tryoutForm, batch: val as TryoutForm['batch'] })}
                    options={[
                      { label: 'SNBT', value: 'SNBT' },
                      { label: 'Mandiri', value: 'MANDIRI' },
                    ]}
                    triggerClassName="w-full h-9"
                  />
                </label>
                <label className="field-label">
                  Solution price (coins)
                  <input
                    className="field-input"
                    type="number"
                    required
                    min="0"
                    value={tryoutForm.solutionPrice}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, solutionPrice: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Release date
                  <input
                    className="field-input"
                    type="date"
                    required
                    value={tryoutForm.releaseDate}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, releaseDate: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Starts at
                  <input
                    className="field-input"
                    type="datetime-local"
                    required
                    value={tryoutForm.scheduledStart}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, scheduledStart: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Ends at
                  <input
                    className="field-input"
                    type="datetime-local"
                    required
                    value={tryoutForm.scheduledEnd}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, scheduledEnd: event.target.value })}
                  />
                </label>
                <label className="field-label control-form-wide">
                  Description
                  <textarea
                    className="field-input"
                    rows={3}
                    value={tryoutForm.description}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, description: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Referral code
                  <input
                    className="field-input"
                    value={tryoutForm.referralCode}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, referralCode: event.target.value })}
                  />
                </label>
                <label className="control-check">
                  <input
                    type="checkbox"
                    checked={tryoutForm.isPublic}
                    onChange={(event) => setTryoutForm({ ...tryoutForm, isPublic: event.target.checked })}
                  />{' '}
                  Public tryout
                </label>
              </div>
              <div className="control-form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setTryoutForm(initialTryoutForm);
                    setEditingTryout(null);
                    setTryoutFormOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingTryout ? 'Save changes' : 'Create tryout'}
                </button>
              </div>
            </form>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}
          >
            {(
              [
                { id: 'ALL', label: `Semua (${tryouts.length})` },
                { id: 'DRAFT', label: `Draf (${tryoutStatusCounts.DRAFT})` },
                { id: 'PUBLISHED', label: `Published (${tryoutStatusCounts.PUBLISHED})` },
              ] as const
            ).map((tab) => {
              const active = tryoutStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTryoutStatusFilter(tab.id)}
                  className="pill"
                  style={{
                    cursor: 'pointer',
                    background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#93c5fd' : 'var(--muted-fg)',
                    border: active ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid var(--border)',
                    fontWeight: active ? 700 : 500,
                    padding: '5px 12px',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="control-empty">Loading tryouts…</div>
          ) : error ? null : (
            <DataTable
              columns={tryoutColumns}
              data={filteredTryouts}
              emptyMessage="Tidak ada tryout pada filter status ini."
            />
          )}
        </section>
      )}

      {/* SECTION: QUESTIONS (BANK SOAL & CREATION FLOW) */}
      {section === 'questions' && (
        <section className="control-panel" aria-labelledby="question-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="question-heading">Bank Soal & Kurikulum</h2>
              <p>Buat soal untuk Latihan, Tryout, atau Eksperimen — seluruh soal baru masuk sebagai Draf siap QC.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setEditingQuestion(null);
                  setImportBatch('');
                  setCreateTarget('DRAFT');
                  setCreateTryoutId('');
                  setCreateMethodView('SELECT');
                  setIsPromptAdjusterOpen(false);
                  setCreateMethodModalOpen(true);
                  setError('');
                  setNotice('');
                }}
              >
                + Buat Soal Baru
              </button>
            </div>
          </div>

          {/* LIFECYCLE STATUS TABS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[
              { id: 'ALL', label: 'Semua', count: questionStatusCounts.ALL, tone: 'default' },
              { id: 'DRAFT', label: 'Draf', count: questionStatusCounts.DRAFT, tone: 'amber' },
              { id: 'QC_SANDBOX', label: 'Antrean QC', count: questionStatusCounts.QC_SANDBOX, tone: 'blue' },
              { id: 'NEEDS_REVISION', label: 'Kotak Revisi', count: questionStatusCounts.NEEDS_REVISION, tone: 'rose' },
              { id: 'READY', label: 'Siap / Ready', count: questionStatusCounts.READY, tone: 'emerald' },
              { id: 'RETIRED', label: 'Nonaktif', count: questionStatusCounts.RETIRED, tone: 'zinc' },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              const isRevisionAlert = tab.id === 'NEEDS_REVISION' && tab.count > 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`filter-btn ${active ? 'is-active' : ''}`}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    ...(isRevisionAlert && !active
                      ? { borderColor: 'rgba(244, 63, 94, 0.5)', color: '#fb7185', background: 'rgba(244, 63, 94, 0.08)' }
                      : {}),
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: isRevisionAlert
                        ? '#f43f5e'
                        : active
                        ? 'rgba(0, 0, 0, 0.25)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isRevisionAlert ? '#fff' : 'inherit',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
            {filterStatus === 'QC_SANDBOX' && questionStatusCounts.QC_SANDBOX > 0 && (
              <button
                type="button"
                className="button button-secondary"
                disabled={sandboxOpeningId === '__QC_QUEUE__'}
                onClick={() => void handleOpenInSandbox(null)}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#c084fc',
                  borderColor: 'rgba(168, 85, 247, 0.45)',
                  background: 'rgba(168, 85, 247, 0.10)',
                }}
                title="Buka semua antrean QC di Main Sandbox"
              >
                <ExternalLink style={{ width: 13, height: 13 }} />
                <span>{sandboxOpeningId === '__QC_QUEUE__' ? 'Membuka…' : 'Buka di Sandbox'}</span>
              </button>
            )}
          </div>

          {/* QUESTION TOOLBAR & FILTERS */}
          <div className="control-filter-toolbar">
            <div className="control-filter-items">
              <div className="control-filter-search">
                <Search className="control-filter-search-icon" />
                <input
                  type="text"
                  className="control-filter-search-input"
                  placeholder="Cari soal atau kurikulum..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="control-filter-group">
                <span className="control-filter-label">Subtes</span>
                <ComboboxSelect
                  value={filterSubtest}
                  onValueChange={(val) => setFilterSubtest(val)}
                  options={[
                    { label: 'Semua Subtes', value: 'ALL' },
                    { label: 'Pengetahuan Kuantitatif', value: 'PENGETAHUAN_KUANTITATIF' },
                    { label: 'Penalaran Umum', value: 'PENALARAN_UMUM' },
                    { label: 'Pemahaman Bacaan & Menulis', value: 'PEMAHAMAN_BACAAN_MENULIS' },
                    { label: 'Pengetahuan & Pemahaman Umum', value: 'PENGETAHUAN_PEMAHAMAN_UMUM' },
                    { label: 'Literasi Bahasa Indonesia', value: 'LITERASI_INDONESIA' },
                    { label: 'Literasi Bahasa Inggris', value: 'LITERASI_INGGRIS' },
                    { label: 'Penalaran Matematika', value: 'PENALARAN_MATEMATIKA' },
                  ]}
                  triggerClassName="min-w-[190px]"
                />
              </div>

              <div className="control-filter-group">
                <span className="control-filter-label">Distribusi</span>
                <ComboboxSelect
                  value={filterTarget}
                  onValueChange={(val) => setFilterTarget(val)}
                  options={[
                    { label: 'Semua Target', value: 'ALL' },
                    { label: 'Bank Soal Umum', value: 'BANK' },
                    { label: 'Draft', value: 'DRAFT' },
                    { label: 'Sandbox (QC)', value: 'SANDBOX' },
                    { label: 'Latihan', value: 'FOR_PRACTICE' },
                    { label: 'Pool / Tryout', value: 'FOR_TRYOUT' },
                  ]}
                  triggerClassName="min-w-[160px]"
                />
              </div>

              <div className="control-filter-group">
                <span className="control-filter-label">Batch</span>
                <ComboboxSelect
                  value={filterBatch}
                  onValueChange={(val) => setFilterBatch(val)}
                  searchable={true}
                  options={[
                    { label: 'Semua Batch', value: 'ALL' },
                    { label: 'Tanpa Batch', value: '__NONE__' },
                    ...mergedQuestionBatches.map((item) => ({
                      label:
                        typeof item.count === 'number' && item.count > 0
                          ? `${item.batch} (${item.count})`
                          : item.batch,
                      value: item.batch,
                    })),
                  ]}
                  triggerClassName="min-w-[170px]"
                />
              </div>

              {(filterStatus !== 'ALL' || filterSubtest !== 'ALL' || filterTarget !== 'ALL' || filterBatch !== 'ALL' || Boolean(search.trim())) && (
                <button
                  type="button"
                  className="control-filter-reset"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setFilterSubtest('ALL');
                    setFilterTarget('ALL');
                    setFilterBatch('ALL');
                    setSearch('');
                  }}
                  title="Reset filter"
                >
                  <X className="action-icon" /> Reset
                </button>
              )}
            </div>

            <div className="control-filter-count-badge">
              {(filterStatus !== 'ALL' || filterSubtest !== 'ALL' || filterTarget !== 'ALL' || filterBatch !== 'ALL' || Boolean(search.trim())) ? (
                <span>Menampilkan {filteredQuestions.length} dari {questions.length} soal</span>
              ) : (
                <span>{questions.length} soal terdaftar</span>
              )}
            </div>
          </div>

          {/* QUESTION CREATION / EDIT MODAL (Sleek, Modern, High-Focus) */}
          {questionFormOpen && (
            <div
              className="modal-overlay"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1100,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
              onClick={() => {
                if (!saving) {
                  setQuestionFormOpen(false);
                  setEditingQuestion(null);
                  setQuestionForm(initialQuestionForm);
                }
              }}
            >
              <div
                className="modal-dialog"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '980px',
                  width: '100%',
                  maxHeight: '92vh',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#121215',
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                }}
              >
                <form
                  onSubmit={saveQuestion}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    maxHeight: '92vh',
                    overflow: 'hidden',
                  }}
                >
                  {/* MODAL HEADER (Sticky) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--border)',
                      background: '#16161a',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                          {editingQuestion ? 'Edit Soal' : 'Buat Soal Baru (Input Manual)'}
                        </span>
                        {editingQuestion && (() => {
                          const item = questions.find((q) => q.id === editingQuestion);
                          return item ? (
                            <span className="font-mono text-xs font-bold text-zinc-300 bg-white/[0.06] border border-white/10 px-2.5 py-0.5 rounded">
                              {formatQuestionCode(item)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-fg)' }}>
                        {editingQuestion
                          ? 'Perbarui parameter kurikulum, narasi stimulus, kunci jawaban, dan pembahasan bertahap.'
                          : 'Lengkapi wacana, pertanyaan, kunci jawaban, serta slide deck solusi interaktif.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => {
                        if (!saving) {
                          setQuestionFormOpen(false);
                          setEditingQuestion(null);
                          setQuestionForm(initialQuestionForm);
                        }
                      }}
                      aria-label="Tutup"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted-fg)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* MODAL BODY (Scrollable) */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                    }}
                  >
                    {/* 1. TUJUAN SOAL (3 OPSI) + STATUS LIFECYCLE */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <span>🎯</span> Tujuan Penempatan Soal <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const statusBadge = getQuestionStatusBadge(editingQuestion ? questionForm.status : 'DRAFT');
                            return (
                              <span
                                className="pill"
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: statusBadge.bg,
                                  color: statusBadge.color,
                                  border: `1px solid ${statusBadge.border}`,
                                }}
                              >
                                Status: {statusBadge.label}
                              </span>
                            );
                          })()}
                          {questionForm.target === 'SOAL_ASLI' && (
                            <span
                              className="pill"
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: 'rgba(129, 140, 248, 0.14)',
                                color: '#c7d2fe',
                                border: '1px solid rgba(129, 140, 248, 0.35)',
                              }}
                            >
                              Arsip Soal Asli
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          {
                            id: 'FOR_PRACTICE',
                            label: 'Latihan (Global · 1 Paket)',
                            desc: 'Langsung masuk daftar Draf di tab Latihan tanpa perlu pilih paket.',
                            border: '#10b981',
                            activeBg: 'rgba(16, 185, 129, 0.15)',
                            activeText: '#a7f3d0',
                          },
                          {
                            id: 'FOR_TRYOUT',
                            label: 'Tryout (Multi-Paket)',
                            desc: 'Wajib pilih paket Tryout tujuan; masuk sebagai Draf di paket tersebut.',
                            border: '#38bdf8',
                            activeBg: 'rgba(56, 189, 248, 0.15)',
                            activeText: '#bae6fd',
                          },
                          {
                            id: 'DRAFT',
                            label: 'Eksperimen (Bank Soal)',
                            desc: 'Disimpan di Bank Soal sebagai Draf; bisa QC atau dipindah ke paket nanti.',
                            border: '#f59e0b',
                            activeBg: 'rgba(245, 158, 11, 0.14)',
                            activeText: '#fde68a',
                          },
                        ].map((item) => {
                          const isSelected =
                            item.id === 'DRAFT'
                              ? questionForm.target !== 'FOR_PRACTICE' &&
                                questionForm.target !== 'FOR_TRYOUT' &&
                                questionForm.target !== 'SOAL_ASLI'
                              : questionForm.target === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setQuestionForm({
                                  ...questionForm,
                                  target: item.id as any,
                                  tryoutId: item.id === 'FOR_TRYOUT' ? questionForm.tryoutId : '',
                                  status: editingQuestion ? questionForm.status : 'DRAFT',
                                })
                              }
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                border: isSelected ? `1.5px solid ${item.border}` : '1px solid rgba(255, 255, 255, 0.08)',
                                background: isSelected ? item.activeBg : 'rgba(255, 255, 255, 0.02)',
                                color: isSelected ? item.activeText : '#9ca3af',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                <div
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    border: isSelected ? `2px solid ${item.border}` : '1.5px solid #6b7280',
                                    background: isSelected ? item.border : 'transparent',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? item.activeText : '#e5e7eb' }}>
                                  {item.label}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: isSelected ? item.activeText : '#9ca3af', marginTop: '4px', lineHeight: 1.35 }}>
                                {item.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {!editingQuestion && (
                        <p className="text-[11px] text-zinc-400 m-0">
                          Semua soal baru otomatis masuk dengan status <strong>Draf</strong> agar aman dikurasi dan di-QC di tabel tujuan sebelum tayang ke siswa.
                        </p>
                      )}

                      {/* Sub-selection for FOR_TRYOUT (REQUIRED) */}
                      {questionForm.target === 'FOR_TRYOUT' && (
                        <div className="pt-3 border-t border-zinc-800 mt-2">
                          <label className="text-xs font-semibold text-sky-300 block mb-1">
                            Pilih Paket Tryout Tujuan <span className="text-red-400">*</span>
                          </label>
                          <ComboboxSelect
                            value={questionForm.tryoutId}
                            onValueChange={(val) => setQuestionForm({ ...questionForm, tryoutId: val })}
                            placeholder="-- Pilih paket Tryout tujuan --"
                            options={tryouts.map((t) => ({
                              label: `${t.title} (#${t.code}) · ${t.readyQuestionCount ?? 0}/${t.questionCount ?? 0} Siap · ${t.batch || 'SNBT'}`,
                              value: t.id,
                            }))}
                            triggerClassName="w-full h-9"
                          />
                          <p className="text-[11px] text-zinc-400 mt-1 m-0">
                            Soal akan langsung terikat sebagai Draf di dalam <strong>Tryouts → Kelola Soal</strong> pada paket yang dipilih (anti-bocor antar paket).
                          </p>
                        </div>
                      )}

                      {/* Sub-selection for SOAL_ASLI (existing archive edits) */}
                      {questionForm.target === 'SOAL_ASLI' && (
                        <div className="pt-3 border-t border-zinc-800 mt-2">
                          <label className="text-xs font-semibold text-indigo-300 block mb-1">
                            Paket Arsip Soal (UTBK/SNBT)
                          </label>
                          <input
                            type="text"
                            className="field-input text-xs w-full"
                            placeholder="Contoh: Soal Asli UTBK SNBT 2024 Pengetahuan Kuantitatif"
                            value={questionForm.packageId}
                            onChange={(e) => setQuestionForm({ ...questionForm, packageId: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {/* KOTAK REVISI HYBRID BANNER (LLM PROMPT + PASTE JSON + MANUAL) */}
                    {editingQuestion && (() => {
                      const editedObj = questions.find((q) => q.id === editingQuestion);
                      if (!editedObj || (editedObj.status !== 'NEEDS_REVISION' && !editedObj.revisionNotes)) return null;
                      return (
                        <KotakRevisiBanner
                          questionId={editedObj.id}
                          revisionNotes={editedObj.revisionNotes}
                          reviewedBy={editedObj.reviewedBy}
                          reviewedAt={editedObj.reviewedAt}
                          formState={{
                            subtest: questionForm.subtest,
                            difficulty: questionForm.difficulty,
                            type: questionForm.type,
                            narration: questionForm.narration,
                            content: questionForm.content,
                            correctAnswer: questionForm.correctAnswer,
                            options: questionForm.options,
                            keyFormula: questionForm.keyFormula,
                            quickTrick: questionForm.quickTrick,
                            staticExplanation: questionForm.staticExplanation,
                            solutionSteps: questionForm.solutionSteps,
                          }}
                          onApplyRevisionJson={applyRevisionJsonToForm}
                          onResubmitQc={() => void handleSaveAndResubmitQc()}
                          submittingQc={saving}
                        />
                      );
                    })()}

                    {/* 2. KURIKULUM & FORMAT */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                      }}
                      className="space-y-3.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                            Subtes SNBT <span className="text-red-400">*</span>
                          </label>
                          <ComboboxSelect
                            value={questionForm.subtest}
                            onValueChange={(val) => {
                              setQuestionForm({ ...questionForm, subtest: val, subtopicId: '' });
                            }}
                            options={[
                              { label: 'Pengetahuan Kuantitatif', value: 'PENGETAHUAN_KUANTITATIF' },
                              { label: 'Penalaran Umum', value: 'PENALARAN_UMUM' },
                              { label: 'Pemahaman Bacaan & Menulis', value: 'PEMAHAMAN_BACAAN_MENULIS' },
                              { label: 'Pengetahuan & Pemahaman Umum', value: 'PENGETAHUAN_PEMAHAMAN_UMUM' },
                              { label: 'Literasi Bahasa Indonesia', value: 'LITERASI_INDONESIA' },
                              { label: 'Literasi Bahasa Inggris', value: 'LITERASI_INGGRIS' },
                              { label: 'Penalaran Matematika', value: 'PENALARAN_MATEMATIKA' },
                            ]}
                            triggerClassName="w-full h-9"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                            Topik & Subtopik (Kurikulum)
                          </label>
                          <ComboboxSelect
                            value={questionForm.subtopicId}
                            onValueChange={(val) => setQuestionForm({ ...questionForm, subtopicId: val })}
                            options={[
                              { label: 'Pilih Subtopik...', value: '' },
                              ...topics
                                .filter((t) => t.subtest === questionForm.subtest)
                                .flatMap((t) =>
                                  t.subtopics.map((s) => ({
                                    label: `${t.title} › ${s.title}`,
                                    value: s.id,
                                  }))
                                ),
                            ]}
                            triggerClassName="w-full h-9"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                            Tingkat Kesulitan <span className="text-red-400">*</span>
                          </label>
                          <ComboboxSelect
                            value={questionForm.difficulty}
                            onValueChange={(val) => setQuestionForm({ ...questionForm, difficulty: val as QuestionForm['difficulty'] })}
                            options={[
                              { label: 'Mudah (Easy)', value: 'EASY' },
                              { label: 'Sedang (Medium)', value: 'MEDIUM' },
                              { label: 'Sulit (Hard / HOTS)', value: 'HARD' },
                            ]}
                            triggerClassName="w-full h-9"
                          />
                        </div>
                      </div>

                      {/* Batch Pengelompokan Soal */}
                      <div className="pt-2 border-t border-zinc-800">
                        <QuestionBatchField
                          value={questionForm.batch}
                          onChange={(nextBatch) => setQuestionForm({ ...questionForm, batch: nextBatch })}
                          existingBatches={mergedQuestionBatches}
                          helperText="Pilih batch yang sudah ada atau buat batch baru agar soal mudah difilter saat QC, curation Latihan, maupun pemantauan Bank Soal."
                        />
                      </div>

                      {/* Format Tipe Soal: Pilihan Ganda vs Isian Singkat */}
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block">
                            Tipe Format Soal <span className="text-red-400">*</span>
                          </label>
                          <span className="text-[11px] text-zinc-400">
                            Isian Singkat hanya diujikan pada subtes PK dan Penalaran Matematika
                          </span>
                        </div>

                        <div className="inline-flex rounded-lg border border-zinc-700/80 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setQuestionForm({ ...questionForm, type: 'MULTIPLE_CHOICE' })}
                            style={{
                              padding: '5px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: 'none',
                              background: questionForm.type === 'MULTIPLE_CHOICE' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                              color: questionForm.type === 'MULTIPLE_CHOICE' ? '#93c5fd' : '#9ca3af',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            🔘 Pilihan Ganda (A-E)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionForm({
                                ...questionForm,
                                type: 'SHORT_ANSWER',
                                answerFormatGuide: questionForm.answerFormatGuide || 'Bilangan Bulat Non-Negatif (0-9999)',
                              });
                            }}
                            style={{
                              padding: '5px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: 'none',
                              background: questionForm.type === 'SHORT_ANSWER' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                              color: questionForm.type === 'SHORT_ANSWER' ? '#fcd34d' : '#9ca3af',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            ✍️ Isian Singkat (BPPP)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. KONTEN & STIMULUS */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                      }}
                      className="space-y-3.5"
                    >
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Teks Wacana / Stimulus Soal <span className="text-[11px] text-zinc-400 font-normal">(Opsional)</span>
                        </label>
                        <textarea
                          className="field-input text-xs w-full"
                          rows={2}
                          placeholder="Wacana bacaan panjang, pengantar narasi cerita, artikel kontekstual, atau data tabel..."
                          value={questionForm.narration}
                          onChange={(e) => setQuestionForm({ ...questionForm, narration: e.target.value })}
                          style={{ minHeight: '65px' }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-300 block">
                            Teks Pertanyaan Soal <span className="text-red-400">*</span>
                          </label>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Mendukung LaTeX: $x^2 + y^2 = r^2$
                          </span>
                        </div>
                        <textarea
                          className="field-input text-xs w-full font-sans leading-relaxed"
                          rows={4}
                          required
                          placeholder="Tuliskan pertanyaan inti soal di sini..."
                          value={questionForm.content}
                          onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                          style={{ minHeight: '90px' }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            URL Gambar Diagram / Grafik <span className="text-[11px] text-zinc-400 font-normal">(Opsional)</span>
                          </label>
                          <input
                            type="text"
                            className="field-input text-xs w-full"
                            placeholder="https://... (URL gambar ilustrasi jika ada)"
                            value={questionForm.imageUrl}
                            onChange={(e) => setQuestionForm({ ...questionForm, imageUrl: e.target.value })}
                          />
                        </div>
                        {questionForm.imageUrl.trim() && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                            <img
                              src={questionForm.imageUrl.trim()}
                              alt="Preview Diagram"
                              className="h-10 w-16 object-contain rounded bg-black/40 border border-zinc-700"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <span className="text-[11px] text-zinc-400 truncate">Preview Gambar Terpasang</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. KUNCI JAWABAN */}
                    {questionForm.type === 'SHORT_ANSWER' ? (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span>✍️</span> Kunci Jawaban Isian Singkat
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                            Standar Resmi BPPP SNBT
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="text-xs font-semibold text-zinc-200 block mb-1">
                              Kunci Nilai Angka Akhir <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              className="field-input font-mono text-sm font-bold tracking-wider w-full"
                              placeholder="Contoh: 42 atau 1500"
                              required={questionForm.type === 'SHORT_ANSWER'}
                              value={questionForm.correctAnswer}
                              onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                            />
                            <span className="text-[11px] text-zinc-400 block mt-1">
                              Tuliskan angka definitif tanpa satuan atau variabel (contoh: <code>42</code>, bukan <code>42 cm</code>).
                            </span>
                          </div>

                          <div className="flex flex-col justify-between">
                            <label className="text-xs font-semibold text-zinc-200 block mb-1">
                              Format Petunjuk Resmi
                            </label>
                            <button
                              type="button"
                              className="button button-secondary text-xs h-9 flex items-center justify-center gap-1.5"
                              onClick={() => {
                                let content = questionForm.content.trim();
                                const guideTag = `[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: ${questionForm.correctAnswer || '42'}]`;
                                if (content.includes('[PETUNJUK FORMAT:')) {
                                  content = content.replace(/\[PETUNJUK FORMAT:[^\]]+\]/g, guideTag);
                                } else {
                                  content = content ? `${content}\n\n${guideTag}` : guideTag;
                                }
                                setQuestionForm({ ...questionForm, content });
                              }}
                            >
                              <span>⚡ Sisipkan Format ke Teks Soal</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                            Pilihan Jawaban (A-E)
                          </span>
                          <span className="text-xs text-zinc-400">
                            Klik huruf lingkaran untuk menandai kunci benar
                          </span>
                        </div>

                        <div className="space-y-2">
                          {questionForm.options.map((opt, idx) => {
                            const letters = ['A', 'B', 'C', 'D', 'E'];
                            const letter = letters[idx] || String(idx + 1);
                            const isKey = opt.isCorrect;
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: isKey ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                                  background: isKey ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = questionForm.options.map((o, i) => ({
                                      ...o,
                                      isCorrect: i === idx,
                                    }));
                                    setQuestionForm({ ...questionForm, options: newOpts });
                                  }}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: isKey ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                                    background: isKey ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                                    color: isKey ? '#ffffff' : '#9ca3af',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={`Tandai ${letter} sebagai Kunci Jawaban Benar`}
                                >
                                  {letter}
                                </button>
                                <input
                                  type="text"
                                  className="field-input flex-1 text-xs"
                                  placeholder={`Isi pilihan ${letter}... (dukung LaTeX $...$)`}
                                  required={questionForm.type === 'MULTIPLE_CHOICE'}
                                  value={opt.content}
                                  onChange={(e) => {
                                    const newOpts = [...questionForm.options];
                                    newOpts[idx] = { ...newOpts[idx], content: e.target.value };
                                    setQuestionForm({ ...questionForm, options: newOpts });
                                  }}
                                />
                                {isKey && (
                                  <span className="text-[11px] font-bold text-emerald-400 shrink-0 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                                    ✓ Kunci Benar
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. SOLUTION DECK & PEMBAHASAN */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                      }}
                      className="space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Solution Deck & Pembahasan Bertahap
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-0.5 m-0">
                            Disajikan sebagai slide interaktif yang membimbing pemahaman siswa langkah demi langkah.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="button button-secondary text-xs h-7 px-2.5"
                          onClick={() => {
                            const nextNum = questionForm.solutionSteps.length + 1;
                            setQuestionForm({
                              ...questionForm,
                              solutionSteps: [
                                ...questionForm.solutionSteps,
                                { stepNumber: nextNum, category: 'EKSEKUSI', title: '', content: '' },
                              ],
                            });
                          }}
                        >
                          + Tambah Slide Langkah
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-purple-300 block mb-1">
                            📐 Rumus Kunci (Key Formula)
                          </label>
                          <input
                            type="text"
                            className="field-input text-xs w-full font-mono"
                            placeholder="e.g. A = \frac{1}{2} \times a \times t"
                            value={questionForm.keyFormula}
                            onChange={(e) => setQuestionForm({ ...questionForm, keyFormula: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-amber-300 block mb-1">
                            💡 Trik Jitu 10 Detik (Quick Trick)
                          </label>
                          <input
                            type="text"
                            className="field-input text-xs w-full"
                            placeholder="Cara cepat eliminasi opsi / pola trik kilat..."
                            value={questionForm.quickTrick}
                            onChange={(e) => setQuestionForm({ ...questionForm, quickTrick: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Steps List */}
                      <div className="space-y-2.5 pt-1">
                        {questionForm.solutionSteps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              background: 'rgba(255, 255, 255, 0.02)',
                            }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30">
                                  Slide {sIdx + 1}
                                </span>
                                <span className="text-xs text-zinc-400">
                                  {sIdx === 0 ? 'Tahap Analisis' : sIdx === 1 ? 'Tahap Eksekusi' : 'Tahap Kesimpulan'}
                                </span>
                              </div>
                              {questionForm.solutionSteps.length > 1 && (
                                <button
                                  type="button"
                                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                  onClick={() => {
                                    const newSteps = questionForm.solutionSteps.filter((_, i) => i !== sIdx);
                                    setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                                  }}
                                >
                                  Hapus Slide
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                className="field-input text-xs"
                                placeholder="Kategori (e.g. IDENTIFIKASI)"
                                value={step.category}
                                onChange={(e) => {
                                  const newSteps = [...questionForm.solutionSteps];
                                  newSteps[sIdx] = { ...newSteps[sIdx], category: e.target.value };
                                  setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                                }}
                              />
                              <input
                                type="text"
                                className="field-input text-xs sm:col-span-2"
                                placeholder="Judul langkah (e.g. Analisis Variabel dan Rumus Utama)"
                                value={step.title}
                                onChange={(e) => {
                                  const newSteps = [...questionForm.solutionSteps];
                                  newSteps[sIdx] = { ...newSteps[sIdx], title: e.target.value };
                                  setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                                }}
                              />
                            </div>

                            <textarea
                              className="field-input text-xs w-full"
                              rows={2}
                              placeholder="Uraian penjelasan detail slide ini (Mendukung Markdown & rumus LaTeX)..."
                              value={step.content}
                              onChange={(e) => {
                                const newSteps = [...questionForm.solutionSteps];
                                newSteps[sIdx] = { ...newSteps[sIdx], content: e.target.value };
                                setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-400 block mb-1">
                          Penjelasan Statis Lengkap (Versi Utuh / PDF Export)
                        </label>
                        <textarea
                          className="field-input text-xs w-full"
                          rows={2}
                          placeholder="Versi teks penjelasan konvensional tanpa per-slide..."
                          value={questionForm.staticExplanation}
                          onChange={(e) => setQuestionForm({ ...questionForm, staticExplanation: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MODAL FOOTER (Sticky) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 24px',
                      borderTop: '1px solid var(--border)',
                      background: '#16161a',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary text-xs h-9 px-4"
                      onClick={() => {
                        setQuestionForm(initialQuestionForm);
                        setEditingQuestion(null);
                        setQuestionFormOpen(false);
                      }}
                    >
                      Batal
                    </button>

                    <div className="flex items-center gap-3 flex-wrap">
                      {error && <span className="text-xs text-red-400">{error}</span>}
                      {editingQuestion && questionForm.status === 'NEEDS_REVISION' && (
                        <button
                          type="button"
                          className="button button-secondary text-xs h-9 px-4"
                          style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#60a5fa', fontWeight: 700 }}
                          disabled={saving}
                          onClick={() => void handleSaveAndResubmitQc()}
                        >
                          {saving ? 'Mengirim…' : 'Simpan & Kirim Ulang ke QC'}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="button button-primary text-xs h-9 px-5"
                        style={{ color: '#000000', fontWeight: 650 }}
                        disabled={saving}
                      >
                        {saving ? 'Menyimpan…' : editingQuestion ? 'Simpan Perubahan' : 'Buat Soal'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* BULK MULTI-SELECT ACTION BAR */}
          {!loading && selectedVisibleQuestions.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '10px 14px',
                marginBottom: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                background: 'rgba(251, 191, 36, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fbbf24',
                  }}
                >
                  <CheckCircle2 style={{ width: 15, height: 15 }} />
                  <span>{selectedVisibleQuestions.length} soal dipilih</span>
                </span>

                {selectedVisibleQuestions.length < filteredQuestions.length && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      fontSize: '11px',
                      borderColor: 'rgba(251, 191, 36, 0.4)',
                      color: '#fde68a',
                    }}
                    onClick={() => setSelectedQuestionIds(filteredQuestions.map((q) => q.id))}
                  >
                    Pilih semua ({filteredQuestions.length})
                  </button>
                )}

                <button
                  type="button"
                  className="button button-secondary"
                  style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    lastSelectedQuestionIdRef.current = null;
                  }}
                >
                  Batal pilih
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-fg)', marginRight: '2px' }}>
                  Pindahkan ke:
                </span>
                {(
                  [
                    { status: 'DRAFT', label: 'Draf', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)', bg: 'rgba(245, 158, 11, 0.12)' },
                    { status: 'QC_SANDBOX', label: 'Antrean QC', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)', bg: 'rgba(59, 130, 246, 0.12)' },
                    { status: 'NEEDS_REVISION', label: 'Kotak Revisi', color: '#fb7185', border: 'rgba(244, 63, 94, 0.35)', bg: 'rgba(244, 63, 94, 0.12)' },
                    { status: 'READY', label: 'Siap / Ready', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)', bg: 'rgba(16, 185, 129, 0.12)' },
                    { status: 'RETIRED', label: 'Nonaktif', color: '#a1a1aa', border: 'rgba(113, 113, 122, 0.4)', bg: 'rgba(113, 113, 122, 0.14)' },
                  ] as const
                ).map((item) => {
                  const allAlreadyInStatus = selectedVisibleQuestions.every(
                    (q) => (q.status || 'DRAFT').toUpperCase() === item.status,
                  );
                  const isMovingThis = bulkMovingStatus === item.status;
                  const disabled = Boolean(bulkMovingStatus) || allAlreadyInStatus;
                  return (
                    <button
                      key={item.status}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (item.status === 'NEEDS_REVISION') {
                          setBulkRevisionModal({ open: true, notes: '', submitting: false });
                        } else {
                          void handleBulkMoveStatus(item.status);
                        }
                      }}
                      style={{
                        height: '28px',
                        padding: '0 10px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: allAlreadyInStatus ? 0.4 : 1,
                        border: `1px solid ${item.border}`,
                        background: item.bg,
                        color: item.color,
                        transition: 'opacity 0.15s ease',
                      }}
                      title={
                        allAlreadyInStatus
                          ? `Semua soal terpilih sudah berstatus ${item.label}`
                          : `Pindahkan ${selectedVisibleQuestions.length} soal ke ${item.label}`
                      }
                    >
                      {isMovingThis ? 'Memindahkan…' : item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTIONS DATA TABLE */}
          {loading ? (
            <div className="control-empty">Loading questions…</div>
          ) : (
            <DataTable
              columns={questionColumns}
              data={filteredQuestions}
              isRowSelected={(row) => selectedQuestionIdSet.has(row.id)}
              emptyMessage="Belum ada soal yang sesuai dengan kriteria filter atau pencarian."
            />
          )}
        </section>
      )}

      {/* SECTION: LATIHAN (PRACTICE POOL MANAGER & QUESTION PICKER) */}
      {section === 'practice' && (
        <PracticeSection
          key={practiceRefreshKey}
          jituMainUrl={JITU_MAIN_URL}
          curriculumTopics={topics as any}
          onEditQuestion={(q) => editQuestionItem(q as unknown as QuestionItem)}
          onOpenCreateForPractice={() => {
            setEditingQuestion(null);
            setImportBatch('');
            setCreateTarget('FOR_PRACTICE');
            setCreateTryoutId('');
            setCreateMethodView('SELECT');
            setIsPromptAdjusterOpen(false);
            setCreateMethodModalOpen(true);
            setError('');
            setNotice('');
          }}
          onQuestionsChanged={() => void loadSection('questions', '', true)}
          onNotice={setNotice}
          onError={setError}
        />
      )}

      {/* SECTION: ARSIP SOAL (HISTORICAL READ-ONLY PACKAGES & SOLUTION ENRICHMENT) */}
      {section === 'soal-asli' && (
        <SoalAsliSection
          onNotice={setNotice}
          onError={setError}
        />
      )}

      {/* SECTION: CURRICULUM (MATERI & STRUKTUR KURIKULUM) */}
      {section === 'curriculum' && (() => {
        const normalizedQuery = curriculumSearch.trim().toLowerCase();

        const filteredTopics = topics
          .filter((t) => curriculumSubtestFilter === 'ALL' || t.subtest === curriculumSubtestFilter)
          .filter((t) => {
            if (!normalizedQuery) return true;
            if (t.title.toLowerCase().includes(normalizedQuery) || t.slug.toLowerCase().includes(normalizedQuery)) {
              return true;
            }
            return (t.subtopics || []).some((sub) =>
              sub.title.toLowerCase().includes(normalizedQuery) ||
              sub.slug.toLowerCase().includes(normalizedQuery) ||
              (Array.isArray(sub.patterns) && sub.patterns.some((pat) => pat.toLowerCase().includes(normalizedQuery)))
            );
          });

        const filteredSubtopicsCount = filteredTopics.reduce((acc, t) => acc + (t.subtopics?.length || 0), 0);
        const allFilteredCollapsed = filteredTopics.length > 0 && filteredTopics.every((t) => Boolean(collapsedTopicIds[t.id]));

        return (
          <section className="control-panel" aria-labelledby="curriculum-heading">
            <div className="section-heading control-panel-heading">
              <div>
                <h2 id="curriculum-heading">Materi &amp; Struktur Kurikulum</h2>
                <p>
                  Kelola taksonomi kurikulum bertingkat (Subtes › Materi Utama › Submateri › Pola Soal) untuk kalibrasi Bank Soal &amp; AI Generator.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button button-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#000000',
                    fontWeight: 650,
                  }}
                  onClick={() => handleOpenCreateTopic()}
                >
                  <Plus style={{ width: 14, height: 14, color: '#000000', strokeWidth: 2.5 }} />
                  <span style={{ color: '#000000', fontWeight: 650 }}>Tambah Materi Utama</span>
                </button>
              </div>
            </div>

            {/* Search & Action Toolbar */}
            <div className="control-filter-toolbar">
              <div className="control-filter-items">
                <div className="control-filter-search">
                  <Search className="control-filter-search-icon" />
                  <input
                    type="text"
                    className="control-filter-search-input"
                    placeholder="Cari materi utama, submateri, atau pola soal..."
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                  />
                </div>

                {filteredTopics.length > 0 && (
                  <button
                    type="button"
                    className="table-action-btn"
                    style={{ height: '34px', padding: '0 12px' }}
                    onClick={() => {
                      if (allFilteredCollapsed) {
                        setCollapsedTopicIds({});
                      } else {
                        const next: Record<string, boolean> = {};
                        filteredTopics.forEach((t) => {
                          next[t.id] = true;
                        });
                        setCollapsedTopicIds(next);
                      }
                    }}
                  >
                    <Layers className="action-icon" />
                    <span>{allFilteredCollapsed ? 'Buka Semua Submateri' : 'Ringkas Semua Kartu'}</span>
                  </button>
                )}

                {(curriculumSubtestFilter !== 'ALL' || curriculumSearch.trim() !== '') && (
                  <button
                    type="button"
                    className="control-filter-reset"
                    onClick={() => {
                      setCurriculumSubtestFilter('ALL');
                      setCurriculumSearch('');
                    }}
                    title="Reset filter"
                  >
                    <X className="action-icon" /> Reset
                  </button>
                )}
              </div>

              <div className="control-filter-count-badge">
                <span>{filteredTopics.length}</span>
                <span>materi utama ({filteredSubtopicsCount} submateri)</span>
              </div>
            </div>

            {/* Subtest Filter Tabs */}
            <div className="payment-filter-bar" style={{ marginTop: 0, marginBottom: '18px' }}>
              <div className="payment-filter-tabs">
                <button
                  type="button"
                  className={`payment-filter-tab ${curriculumSubtestFilter === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setCurriculumSubtestFilter('ALL')}
                >
                  <BookOpen />
                  <span>Semua Subtes ({topics.length})</span>
                </button>
                {ALL_SUBTESTS.map((sub) => {
                  const count = topics.filter((t) => t.subtest === sub.id).length;
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      className={`payment-filter-tab ${curriculumSubtestFilter === sub.id ? 'is-active' : ''}`}
                      onClick={() => setCurriculumSubtestFilter(sub.id)}
                      title={sub.label}
                    >
                      <span>{sub.code} · {sub.shortLabel} ({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics Grid */}
            {loading && topics.length === 0 ? (
              <div className="control-empty">Memuat struktur materi &amp; kurikulum…</div>
            ) : filteredTopics.length === 0 ? (
              <div className="curriculum-empty-state">
                <div className="curriculum-empty-icon">
                  <BookOpen style={{ width: 24, height: 24 }} />
                </div>
                <h3>
                  {normalizedQuery ? 'Materi Tidak Ditemukan' : 'Belum Ada Materi Terdaftar'}
                </h3>
                <p>
                  {normalizedQuery
                    ? `Tidak ada materi, submateri, atau pola soal yang cocok dengan kata kunci "${curriculumSearch}".`
                    : curriculumSubtestFilter === 'ALL'
                    ? 'Belum ada materi kurikulum yang ditambahkan. Buat materi pertama untuk mulai membangun bank soal terstruktur.'
                    : `Belum ada materi untuk subtes ${ALL_SUBTESTS.find((s) => s.id === curriculumSubtestFilter)?.label || curriculumSubtestFilter}.`}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {normalizedQuery && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setCurriculumSearch('')}
                    >
                      Hapus Pencarian
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#000000',
                      fontWeight: 650,
                    }}
                    onClick={() => handleOpenCreateTopic(curriculumSubtestFilter)}
                  >
                    <Plus style={{ width: 14, height: 14, color: '#000000', strokeWidth: 2.5 }} />
                    <span style={{ color: '#000000', fontWeight: 650 }}>Tambah Materi Utama</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="curriculum-grid">
                {filteredTopics.map((top) => {
                  const subMeta = ALL_SUBTESTS.find((s) => s.id === top.subtest);
                  const subCount = top.subtopics ? top.subtopics.length : 0;
                  const patternCount = (top.subtopics || []).reduce(
                    (acc, s) => acc + (Array.isArray(s.patterns) ? s.patterns.length : 0),
                    0
                  );
                  const isCollapsed = Boolean(collapsedTopicIds[top.id]) && !normalizedQuery;

                  return (
                    <div key={top.id} className="curriculum-topic-card">
                      <div className="curriculum-topic-header">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="curriculum-pill-row">
                            <span className="curriculum-meta-pill">
                              <BookOpen style={{ width: 11, height: 11, color: 'var(--muted-fg)' }} />
                              <span>{subMeta ? `${subMeta.code} · ${subMeta.shortLabel}` : top.subtest}</span>
                            </span>
                            <span className="curriculum-meta-pill-muted">
                              Urutan #{top.order}
                            </span>
                            <span className="curriculum-meta-pill-muted">
                              <Layers style={{ width: 11, height: 11 }} />
                              <span>{subCount} submateri</span>
                            </span>
                            <span className="curriculum-meta-pill-muted">
                              <ListChecks style={{ width: 11, height: 11 }} />
                              <span>{patternCount} pola</span>
                            </span>
                          </div>
                          <h3 className="curriculum-topic-title">
                            {top.title}
                          </h3>
                          <span className="curriculum-topic-slug">
                            slug: {top.slug}
                          </span>
                        </div>

                        <div className="curriculum-card-actions">
                          <button
                            type="button"
                            className="button-icon-subtle"
                            title="Tambah Submateri"
                            onClick={() => handleOpenCreateSubtopic(top)}
                          >
                            <Plus style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            type="button"
                            className="button-icon-subtle"
                            title="Edit Materi Utama"
                            onClick={() => handleOpenEditTopic(top)}
                          >
                            <Edit style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            type="button"
                            className="button-icon-subtle button-icon-subtle-danger"
                            title="Hapus Materi Utama"
                            onClick={() => handleDeleteTopic(top)}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>

                      {/* Subtopics List Section */}
                      <div className="curriculum-subtopics-section">
                        <div className="curriculum-subtopics-toolbar">
                          <button
                            type="button"
                            className="curriculum-collapse-toggle"
                            onClick={() =>
                              setCollapsedTopicIds((prev) => ({
                                ...prev,
                                [top.id]: !prev[top.id],
                              }))
                            }
                          >
                            <Layers style={{ width: 12, height: 12 }} />
                            <span>Daftar Submateri ({subCount})</span>
                            <span className="curriculum-collapse-hint">
                              {isCollapsed ? 'Tampilkan ▾' : 'Sembunyikan ▴'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="table-action-btn"
                            style={{ height: '26px', padding: '0 9px', fontSize: '11px' }}
                            onClick={() => handleOpenCreateSubtopic(top)}
                          >
                            <Plus style={{ width: 11, height: 11 }} />
                            <span>Tambah Submateri</span>
                          </button>
                        </div>

                        {!isCollapsed && (
                          subCount === 0 ? (
                            <div className="curriculum-subtopic-empty">
                              <span>Belum ada submateri terdaftar pada materi ini.</span>
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleOpenCreateSubtopic(top)}
                              >
                                <Plus style={{ width: 11, height: 11 }} />
                                <span>Buat Submateri Pertama</span>
                              </button>
                            </div>
                          ) : (
                            <div className="curriculum-subtopics-list">
                              {top.subtopics.map((sub) => {
                                const subPatterns = Array.isArray(sub.patterns) ? sub.patterns : [];
                                return (
                                  <div key={sub.id} className="curriculum-subtopic-row">
                                    <div className="curriculum-subtopic-head">
                                      <div className="curriculum-subtopic-title-wrap">
                                        <span className="curriculum-subtopic-order">{sub.order}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                          <span className="curriculum-subtopic-title">
                                            {sub.title}
                                          </span>
                                          <span className="curriculum-subtopic-meta">
                                            {sub.slug}
                                            {subPatterns.length > 0 ? ` • ${subPatterns.length} pola soal` : ' • belum ada pola soal'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="curriculum-card-actions">
                                        <button
                                          type="button"
                                          className="button-icon-subtle"
                                          title="Edit Submateri & Pola Soal"
                                          onClick={() => handleOpenEditSubtopic(top, sub)}
                                        >
                                          <Edit style={{ width: 12, height: 12 }} />
                                        </button>
                                        <button
                                          type="button"
                                          className="button-icon-subtle button-icon-subtle-danger"
                                          title="Hapus Submateri"
                                          onClick={() => handleDeleteSubtopic(sub.id, sub.title)}
                                        >
                                          <Trash2 style={{ width: 12, height: 12 }} />
                                        </button>
                                      </div>
                                    </div>

                                    {subPatterns.length > 0 && (
                                      <div className="curriculum-pattern-list">
                                        {subPatterns.map((pat, idx) => (
                                          <span key={idx} className="curriculum-pattern-chip">
                                            <ListChecks />
                                            <span>{pat}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* SECTION 2: PRICING DATA TABLE */}
      {section === 'pricing' && (
        <section className="control-panel" aria-labelledby="pricing-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="pricing-heading">Pricing & packages</h2>
              <p>Update coin package prices and availability for Jitu Shop.</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setEditingPackage(null);
                setPackageForm(initialPackageForm);
                setPackageFormOpen(true);
                setError('');
                setNotice('');
              }}
            >
              New package
            </button>
          </div>

          {packageFormOpen && (
            <form className="control-edit-form" onSubmit={savePackage}>
              <h3>{editingPackage ? 'Edit package' : 'Create package'}</h3>
              <div className="control-form-grid">
                <label className="field-label">
                  Package name
                  <input
                    className="field-input"
                    required
                    minLength={2}
                    value={packageForm.name}
                    onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Coin amount
                  <input
                    className="field-input"
                    type="number"
                    required
                    min="1"
                    value={packageForm.tokenAmount}
                    onChange={(event) => setPackageForm({ ...packageForm, tokenAmount: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Price (IDR)
                  <input
                    className="field-input"
                    type="number"
                    required
                    min="0"
                    value={packageForm.price}
                    onChange={(event) => setPackageForm({ ...packageForm, price: event.target.value })}
                  />
                </label>
                <label className="control-check">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(event) => setPackageForm({ ...packageForm, isActive: event.target.checked })}
                  />{' '}
                  Available for purchase
                </label>
              </div>
              <div className="control-form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setPackageForm(initialPackageForm);
                    setEditingPackage(null);
                    setPackageFormOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingPackage ? 'Save changes' : 'Create package'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="control-empty">Loading packages…</div>
          ) : error ? null : (
            <DataTable
              columns={packageColumns}
              data={packages}
              emptyMessage="No packages found."
            />
          )}
        </section>
      )}

      {/* SECTION: VOUCHERS & REFERRAL CODES */}
      {section === 'vouchers' && (
        <section className="control-panel" aria-labelledby="vouchers-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="vouchers-heading">Kode Referal & Program Mitra</h2>
              <p>Kelola program referal mitra, persentase komisi, potongan diskon pembeli, dan pantau performa omset secara real-time.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{vouchers.length} kode terdaftar</span>
              <button
                className="button button-primary button-referral-create"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#000000',
                  fontWeight: 650,
                }}
                onClick={() => {
                  setEditingVoucher(null);
                  setVoucherForm(initialVoucherForm);
                  setVoucherFormOpen(true);
                  setError('');
                  setNotice('');
                }}
              >
                <Plus style={{ width: 14, height: 14, color: '#000000', strokeWidth: 2.5 }} />
                <span style={{ color: '#000000', fontWeight: 650 }}>Buat Kode Referal</span>
              </button>
            </div>
          </div>

          {/* Status Filters Bar */}
          <div className="payment-filter-bar">
            <div className="payment-filter-tabs" role="tablist" aria-label="Filter referal berdasarkan status">
              {[
                { id: 'ALL', label: 'Semua Kode', count: vouchers.length },
                {
                  id: 'ACTIVE',
                  label: 'Aktif',
                  count: vouchers.filter((v) => v.isActive && (!v.expiresAt || new Date(v.expiresAt) >= new Date())).length,
                },
                {
                  id: 'INACTIVE',
                  label: 'Nonaktif',
                  count: vouchers.filter((v) => !v.isActive).length,
                },
                {
                  id: 'EXPIRED',
                  label: 'Kedaluwarsa',
                  count: vouchers.filter((v) => v.expiresAt && new Date(v.expiresAt) < new Date()).length,
                },
              ].map((st) => {
                const isActive = voucherFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setVoucherFilter(st.id)}
                    className={`payment-filter-tab ${isActive ? 'is-active' : ''}`}
                  >
                    <span>{st.label}</span>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>({st.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vouchers DataTable */}
          {loading ? (
            <div className="control-empty">Memuat data kode referal…</div>
          ) : error ? null : (
            <DataTable
              columns={voucherColumns}
              data={filteredVouchers}
              emptyMessage="Belum ada kode referal yang sesuai kriteria pencarian atau filter."
            />
          )}
        </section>
      )}

      {/* SECTION: DISCOUNTS DATA TABLE & LIVE PREVIEW */}
      {section === 'discounts' && (
        <section className="control-panel" aria-labelledby="discounts-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="discounts-heading">Discounts & Promo Badges</h2>
              <p>Kelola event diskon, tentukan periode aktif, pasang badge visual khusus, dan pantau live preview tampilan kartu Shop.</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setEditingDiscount(null);
                const now = new Date();
                const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                setDiscountForm({
                  ...initialDiscountForm,
                  startDate: now.toISOString().slice(0, 16),
                  endDate: oneWeekLater.toISOString().slice(0, 16),
                });
                setDiscountFormOpen(true);
                setError('');
                setNotice('');
              }}
            >
              + Create discount
            </button>
          </div>

          {discountFormOpen && (
            <div className="control-edit-form" style={{ marginBottom: '24px' }}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    {editingDiscount ? 'Edit Discount Campaign' : 'Create New Discount Campaign'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                    Atur detail diskon di kiri. Tampilan badge dan harga di kanan otomatis ter-update secara real-time.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary text-xs"
                  onClick={() => {
                    setDiscountForm(initialDiscountForm);
                    setEditingDiscount(null);
                    setDiscountFormOpen(false);
                  }}
                >
                  <X className="w-3.5 h-3.5" /> Close Form
                </button>
              </div>

              <div className="space-y-8">
                {/* FORM INPUTS */}
                <form onSubmit={saveDiscount} className="space-y-5 bg-[var(--card)] p-5 sm:p-6 rounded-xl border border-[var(--border)]">
                  {/* Campaign Name & Discount Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="field-label sm:col-span-2">
                      <span className="font-semibold text-xs text-[var(--foreground)]">Nama Kampanye Promo</span>
                      <input
                        className="field-input"
                        required
                        placeholder="e.g. Flash Sale UTBK 2026, Promo Ramadhan"
                        value={discountForm.name}
                        onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                      />
                    </label>

                    <label className="field-label">
                      <span className="font-semibold text-xs text-[var(--foreground)]">Tipe Diskon</span>
                      <select
                        className="field-input"
                        value={discountForm.type}
                        onChange={(e) => {
                          const newType = e.target.value as 'PERCENTAGE' | 'FIXED';
                          const defaultVal = newType === 'PERCENTAGE' ? '25' : '15000';
                          const defaultBadge = newType === 'PERCENTAGE' ? `DISKON ${defaultVal}%` : `HEMAT ${parseInt(defaultVal, 10)/1000}RB`;
                          setDiscountForm({ ...discountForm, type: newType, value: defaultVal, badgeText: defaultBadge });
                        }}
                      >
                        <option value="PERCENTAGE">Persentase (%)</option>
                        <option value="FIXED">Nominal Tetap (Rp / IDR)</option>
                      </select>
                    </label>

                    <label className="field-label">
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {discountForm.type === 'PERCENTAGE' ? 'Besar Diskon (%)' : 'Besar Potongan (Rp)'}
                      </span>
                      <input
                        className="field-input"
                        type="number"
                        required
                        min="1"
                        max={discountForm.type === 'PERCENTAGE' ? '99' : '1000000'}
                        value={discountForm.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoBadge = discountForm.type === 'PERCENTAGE'
                            ? `DISKON ${val}%`
                            : `HEMAT ${Math.round((Number(val) || 0) / 1000)}RB`;
                          setDiscountForm({ ...discountForm, value: val, badgeText: autoBadge });
                        }}
                      />
                    </label>
                  </div>

                  {/* Target Package & Period Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-1">
                    <label className="field-label lg:col-span-4">
                      <span className="font-semibold text-xs text-[var(--foreground)]">Attach ke Paket / Produk</span>
                      <select
                        className="field-input"
                        value={discountForm.packageId}
                        onChange={(e) => setDiscountForm({ ...discountForm, packageId: e.target.value })}
                      >
                        <option value="">Semua Paket (All Packages &amp; PTN Premium Pass)</option>
                        <option value="pass">Khusus PTN Premium Pass</option>
                        {packages.filter(p => !p.name.toLowerCase().includes('pass')).map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({pkg.tokenAmount} coin) - Rp{pkg.price.toLocaleString('id-ID')}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-[var(--muted-fg)] mt-1">
                        Pilih &quot;Semua Paket&quot; agar promo berlaku global, atau pilih target paket tertentu.
                      </span>
                    </label>

                    <label className="field-label lg:col-span-4">
                      <span className="font-semibold text-xs text-[var(--foreground)]">Waktu Mulai</span>
                      <input
                        className="field-input"
                        type="datetime-local"
                        required
                        value={discountForm.startDate}
                        onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                      />
                    </label>

                    <label className="field-label lg:col-span-4">
                      <span className="font-semibold text-xs text-[var(--foreground)]">Waktu Berakhir</span>
                      <input
                        className="field-input"
                        type="datetime-local"
                        required
                        value={discountForm.endDate}
                        onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                      />
                    </label>
                  </div>

                  {/* Quick duration presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-[var(--muted-fg)] mr-1">Preset Durasi:</span>
                    {[
                      { label: '+3 Hari', days: 3 },
                      { label: '+7 Hari', days: 7 },
                      { label: '+14 Hari', days: 14 },
                      { label: '+30 Hari', days: 30 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--muted-bg)] border border-[var(--border)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                        onClick={() => {
                          const now = new Date();
                          const future = new Date(now.getTime() + preset.days * 24 * 60 * 60 * 1000);
                          setDiscountForm({
                            ...discountForm,
                            startDate: now.toISOString().slice(0, 16),
                            endDate: future.toISOString().slice(0, 16),
                          });
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Badge Design Section */}
                  <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          Desain Badge Promo (Warna &amp; Teks)
                        </span>
                        <p className="text-[11px] text-[var(--muted-fg)] m-0">
                          Pilih gaya visual badge dan ketik teks stiker yang langsung terpasang di atas kartu landing page.
                        </p>
                      </div>

                      <div className="w-full sm:w-72">
                        <input
                          className="field-input text-xs font-bold"
                          placeholder="Teks Badge (e.g. FLASH SALE, DISKON 25%)"
                          maxLength={24}
                          value={discountForm.badgeText}
                          onChange={(e) => setDiscountForm({ ...discountForm, badgeText: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Quick Badge Text Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-[var(--muted-fg)] mr-1">Rekomendasi Teks:</span>
                      {[
                        'DISKON 25%',
                        'DISKON 35%',
                        'DISKON 50%',
                        'HEMAT 20RB',
                        'FLASH SALE',
                        'BEST DEAL',
                        'PROMO SPESIAL',
                        'LIMITED TIME',
                      ].map((badgeSuggestion) => (
                        <button
                          key={badgeSuggestion}
                          type="button"
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--muted-bg)] border border-[var(--border)] hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                          onClick={() => setDiscountForm({ ...discountForm, badgeText: badgeSuggestion })}
                        >
                          {badgeSuggestion}
                        </button>
                      ))}
                    </div>

                    {/* 5 Badge Styles */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                      {BADGE_STYLES.map((style) => {
                        const IconComponent = style.icon;
                        const isSelected = discountForm.badgeStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            className={`p-2.5 rounded-lg border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10 shadow-xs ring-1 ring-blue-500'
                                : 'border-[var(--border)] bg-[var(--muted-bg)] hover:border-[var(--line-strong)]'
                            }`}
                            onClick={() => setDiscountForm({ ...discountForm, badgeStyle: style.id })}
                          >
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${style.gradient}`}>
                              <IconComponent className="w-3 h-3" />
                              {style.label}
                            </span>
                            <span className="text-[10px] text-[var(--muted-fg)] font-medium flex items-center justify-between">
                              <span>{style.label}</span>
                              {isSelected && <span className="text-blue-500 font-bold">✓ Terpilih</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Footer: Active status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
                    <label className="control-check">
                      <input
                        type="checkbox"
                        checked={discountForm.isActive}
                        onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                      />
                      <span className="text-xs font-medium">Aktifkan promo ini langsung saat disimpan</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        className="button button-secondary text-xs"
                        type="button"
                        onClick={() => {
                          setDiscountForm(initialDiscountForm);
                          setEditingDiscount(null);
                          setDiscountFormOpen(false);
                        }}
                      >
                        Batal
                      </button>
                      <button className="button button-primary text-xs" type="submit" disabled={saving}>
                        {saving ? 'Menyimpan…' : editingDiscount ? 'Simpan Perubahan' : 'Buat Promo & Pasang Badge'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* RIGHT: INTERACTIVE LIVE PREVIEW PANE */}
                <div className="discount-preview-pane">
                  <div className="discount-preview-pane-header">
                    <div className="discount-preview-pane-title">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span>Live Card Preview</span>
                    </div>
                    <div className="preview-view-toggle">
                      <button
                        type="button"
                        className={`preview-view-btn ${previewMode === 'all' ? 'is-active' : ''}`}
                        onClick={() => setPreviewMode('all')}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Landing Page (Semua)</span>
                      </button>
                      <button
                        type="button"
                        className={`preview-view-btn ${previewMode === 'pass' ? 'is-active' : ''}`}
                        onClick={() => setPreviewMode('pass')}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>PTN Premium Pass</span>
                      </button>
                      <button
                        type="button"
                        className={`preview-view-btn ${previewMode === 'coins' ? 'is-active' : ''}`}
                        onClick={() => setPreviewMode('coins')}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Card Coin</span>
                      </button>
                    </div>
                  </div>

                  {/* Calculations for Previews */}
                  {(() => {
                    const discountVal = Number(discountForm.value) || 0;
                    const isPercentage = discountForm.type === 'PERCENTAGE';

                    // Pass Card Calculations (Base: Rp 55.000)
                    const passBasePrice = 55000;
                    const passDiscountedPrice = isPercentage
                      ? Math.max(1000, Math.round(passBasePrice * (1 - discountVal / 100)))
                      : Math.max(1000, passBasePrice - discountVal);
                    const passSavings = passBasePrice - passDiscountedPrice;
                    const appliesToPass = !discountForm.packageId || packages.find(p => p.id === discountForm.packageId)?.name.toLowerCase().includes('pass');

                    // Coin Card Calculations (Base: 3 coin = Rp 39.000)
                    const coinPkgTarget = packages.find(p => p.id === discountForm.packageId && !p.name.toLowerCase().includes('pass'))
                      || packages.find(p => p.tokenAmount === 3)
                      || { id: 'fallback-3-coin', name: '3 coin', tokenAmount: 3, price: 39000, isActive: true };
                    const coinBasePrice = coinPkgTarget.price;
                    const coinDiscountedPrice = isPercentage
                      ? Math.max(1000, Math.round(coinBasePrice * (1 - discountVal / 100)))
                      : Math.max(1000, coinBasePrice - discountVal);
                    const coinSavings = coinBasePrice - coinDiscountedPrice;
                    const appliesToCoin = !discountForm.packageId || discountForm.packageId === coinPkgTarget.id;

                    const ActiveIcon = getBadgeIcon(discountForm.badgeStyle);
                    const campaignTitle = discountForm.name.trim() || 'Nama Campaign Promo';

                    return (
                      <div className="space-y-8">
                        {/* 1. PTN PREMIUM PASS CARD PREVIEW */}
                        {(previewMode === 'all' || previewMode === 'pass') && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                Preview PTN Premium Pass (Sesuai Landing Page)
                              </span>
                              {!appliesToPass && (
                                <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                  (Hanya berlaku di paket terpilih)
                                </span>
                              )}
                            </div>

                          <div className="group relative w-full rounded-2xl bg-gradient-to-r from-[#143485] via-[#1D4ED8] to-[#163372] text-white p-6 sm:p-8 lg:p-9 border border-blue-400/40 shadow-xl shadow-blue-950/20 hover:border-blue-300/70 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 overflow-hidden">
                            {/* 1. Sweeping Ambient Shimmer Light Beam Animation */}
                            <div
                              aria-hidden="true"
                              className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none animate-pass-shimmer"
                            />

                            {/* 2. Pulsing Ambient Glowing Orbs */}
                            <div
                              aria-hidden="true"
                              className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl animate-pulse [animation-duration:4s] pointer-events-none"
                            />
                            <div
                              aria-hidden="true"
                              className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-yellow-400/10 blur-3xl animate-pulse [animation-duration:6s] pointer-events-none"
                            />

                            {/* 3. Hand-drawn Yellow & Light Blue Doodle Accessories (Animated, no collision) */}
                            {/* Doodle 1: Light Blue Loop Swirl (Top-Left corner) */}
                            <svg
                              aria-hidden="true"
                              className="hidden sm:block absolute top-2 left-[2.5%] w-13 h-11 text-blue-300/60 pointer-events-none drop-shadow-xs rotate-[-15deg] animate-doodle-2"
                              viewBox="0 0 68 48"
                              fill="none"
                            >
                              <path
                                d="M6 34C18 18 24 8 14 6C4 4 8 22 24 24C40 26 48 12 62 10"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            {/* Doodle 2: Yellow Ribbon Loop Swirl */}
                            <svg
                              aria-hidden="true"
                              className="hidden md:block absolute top-2 left-[57%] -translate-x-1/2 w-14 h-12 text-[#FFD13B]/80 pointer-events-none drop-shadow-xs rotate-[8deg] animate-doodle-1"
                              viewBox="0 0 68 48"
                              fill="none"
                            >
                              <path
                                d="M8 38C22 34 38 18 30 8C22 -2 12 14 30 22C48 30 58 16 66 10"
                                stroke="currentColor"
                                strokeWidth="2.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            {/* Doodle 3: Light Blue Spring Curl */}
                            <svg
                              aria-hidden="true"
                              className="hidden lg:block absolute -bottom-1.5 left-[42%] w-14 h-12 text-blue-200/50 pointer-events-none drop-shadow-xs rotate-[8deg] animate-doodle-1"
                              viewBox="0 0 68 48"
                              fill="none"
                            >
                              <path
                                d="M6 26C16 12 24 14 26 22C28 30 20 32 18 24C16 14 32 16 44 26C54 34 60 26 64 18"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            {/* Doodle 4: Second Yellow Accessory */}
                            <svg
                              aria-hidden="true"
                              className="hidden md:block absolute -bottom-2 right-[27%] w-15 h-13 text-[#FFD13B]/85 pointer-events-none drop-shadow-xs rotate-[16deg] animate-doodle-2"
                              viewBox="0 0 68 48"
                              fill="none"
                            >
                              <path
                                d="M6 34C18 18 24 8 14 6C4 4 8 22 24 24C40 26 48 12 62 10"
                                stroke="currentColor"
                                strokeWidth="2.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            {/* Doodle 5: Yellow Sparkle Star */}
                            <svg
                              aria-hidden="true"
                              className="absolute top-4 right-10 w-5 h-5 text-[#FFD13B]/75 pointer-events-none animate-pulse [animation-duration:3s]"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                            </svg>

                            {/* Doodle 6: Light Blue Underline Swoop */}
                            <svg
                              aria-hidden="true"
                              className="hidden lg:block absolute bottom-1 left-[3%] w-16 h-8 text-blue-300/40 pointer-events-none"
                              viewBox="0 0 80 36"
                              fill="none"
                            >
                              <path
                                d="M6 18C20 22 34 24 46 16C54 10 52 2 44 6C36 10 42 22 56 20C68 18 72 12 76 10"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
                              {/* Left: Info, Floating Golden Pass Ticket & Benefits */}
                              <div className="space-y-4 max-w-2xl">
                                {/* Title with Golden Pass Ticket Icon */}
                                <div className="flex items-center gap-3.5 sm:gap-4">
                                  {/* Animated Floating Golden Ticket */}
                                  <div className="w-14 h-12 sm:w-16 sm:h-14 lg:w-20 lg:h-16 shrink-0 relative select-none animate-ticket-float transition-transform duration-300 group-hover:scale-105">
                                    <Image
                                      src="/icons/golden-pass-ticket.png"
                                      alt="Tiket Golden Pass PTN Premium Pass"
                                      fill
                                      className="object-contain select-none pointer-events-none drop-shadow-md"
                                      priority
                                    />
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-yellow-300 border border-yellow-300/30 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                                        <Sparkles className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                                        {campaignTitle}
                                      </span>
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs ${getBadgeGradient(discountForm.badgeStyle)}`}>
                                        <ActiveIcon className="w-3 h-3" />
                                        {discountForm.badgeText || 'PROMO DISKON'}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFD13B] text-black text-[10px] font-black uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3 fill-black" />
                                        Rekomendasi
                                      </span>
                                    </div>

                                    <h3 className="text-[28px] sm:text-[34px] lg:text-[38px] xl:text-[42px] font-black text-white tracking-tight leading-tight flex flex-wrap items-center gap-2.5">
                                      <span>PTN</span>
                                      <span className="relative inline-block font-black select-none">
                                        <span className="bg-[#FFD13B] text-black px-2.5 sm:px-3 py-0.5 rounded-xs inline-block shadow-sm">
                                          PREMIUM PASS
                                        </span>
                                      </span>
                                    </h3>
                                  </div>
                                </div>

                                {/* 3 Checkmark Benefits */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                                  <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-blue-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                    <span>Bebas akses pembahasan tryout tanpa coins</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-blue-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                    <span>Materi & latihan soal unlimited</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-blue-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                    <span>Analisis skor IRT & ranking nasional</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Price & CTA Button with Continuous Spinning Border Beam Animation */}
                              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-4 shrink-0 pt-4 lg:pt-0 border-t border-blue-400/30 lg:border-t-0">
                                <div className="text-left lg:text-right">
                                  {appliesToPass && passSavings > 0 ? (
                                    <div className="flex items-center lg:justify-end gap-2 mb-1">
                                      <span className="text-sm line-through text-blue-200/80 font-bold tabular-nums">
                                        Rp{passBasePrice.toLocaleString('id-ID')}
                                      </span>
                                      <span className="text-[11px] font-black text-yellow-300 bg-yellow-400/20 px-2 py-0.5 rounded">
                                        Hemat Rp{passSavings.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="inline-flex items-baseline gap-1.5">
                                    <span className="text-[32px] sm:text-[38px] lg:text-[40px] font-black text-white leading-none tracking-tight tabular-nums">
                                      Rp{(appliesToPass ? passDiscountedPrice : passBasePrice).toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-[14px] sm:text-[15px] font-bold text-blue-200">
                                      /bulan
                                    </span>
                                  </div>
                                  <div className="text-[12px] text-blue-200/80 font-medium mt-1">
                                    Akses penuh tanpa batas
                                  </div>
                                </div>

                                {/* Continuous Rotating Border Beam Button */}
                                <div className="relative p-[2.5px] rounded-xl overflow-hidden shadow-lg group/btn hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150">
                                  <div
                                    aria-hidden="true"
                                    className="absolute inset-[-200%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_60%,rgba(255,255,255,0.95)_80%,#FFD13B_92%,transparent_100%)] pointer-events-none"
                                  />
                                  <button
                                    type="button"
                                    className="relative px-6 sm:px-8 py-3 rounded-[10px] bg-[#FFD13B] text-black font-extrabold text-sm sm:text-base inline-flex items-center justify-center gap-2 pointer-events-none shadow-md"
                                  >
                                    <span>Ambil Premium Pass</span>
                                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                        {/* DIVIDER "ATAU" (Tampil saat previewMode === 'all') */}
                        {previewMode === 'all' && (
                          <div className="relative my-6 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-[var(--border)]" />
                            </div>
                            <div className="relative bg-[var(--background)] px-4 text-xs font-bold text-[var(--muted-fg)] uppercase tracking-wider">
                              Atau pilih paket koin satuan
                            </div>
                          </div>
                        )}

                        {/* 2. CARD COIN BIASA PREVIEW (Landing Page Grid) */}
                        {(previewMode === 'all' || previewMode === 'coins') && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                Paket Koin Satuan (Sesuai Landing Page)
                              </span>
                              {discountForm.packageId && !LANDING_QUOTA_PACKS.some(p => packages.find(pkg => pkg.id === discountForm.packageId)?.tokenAmount === p.quota) && (
                                <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                  (Hanya berlaku di paket terpilih)
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                              {LANDING_QUOTA_PACKS.map((pack) => {
                                const isRecommended = Boolean(pack.isBestValue);
                                const selectedPkg = packages.find(p => p.id === discountForm.packageId);
                                const matchesPackage = !discountForm.packageId
                                  || selectedPkg?.tokenAmount === pack.quota
                                  || selectedPkg?.name.toLowerCase().includes(`${pack.quota} coin`);

                                const discountedPackPrice = isPercentage
                                  ? Math.max(1000, Math.round(pack.totalPrice * (1 - discountVal / 100)))
                                  : Math.max(1000, pack.totalPrice - discountVal);
                                const savingsPack = pack.totalPrice - discountedPackPrice;
                                const hasDiscount = matchesPackage && savingsPack > 0;
                                const finalPrice = hasDiscount ? discountedPackPrice : pack.totalPrice;

                                return (
                                  <div
                                    key={pack.id}
                                    className={`rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all duration-200 ${
                                      isRecommended
                                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-2 border-[var(--primary)] shadow-sm'
                                        : 'bg-[var(--card)] border border-[var(--border)] hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                                  >
                                    <div className="space-y-4">
                                      {/* Top Header & Badge */}
                                      <div className="flex items-center justify-between gap-2 min-h-[24px]">
                                        <div className="inline-flex items-center gap-2">
                                          <PixelCoin size={22} />
                                          <span className="text-[20px] font-bold text-[var(--foreground)] tabular-nums">
                                            {pack.quota} coin
                                          </span>
                                        </div>
                                        {hasDiscount ? (
                                          <span className={`h-6 px-2.5 rounded-full text-[11px] font-black uppercase tracking-wide inline-flex items-center shadow-xs ${getBadgeGradient(discountForm.badgeStyle)}`}>
                                            <ActiveIcon className="w-3 h-3 mr-1" />
                                            {discountForm.badgeText || 'PROMO'}
                                          </span>
                                        ) : isRecommended ? (
                                          <span className="h-6 px-2.5 rounded-full bg-[#FFD13B] text-black text-[11px] font-black inline-flex items-center">
                                            Paling hemat
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Price */}
                                      <div className="pt-2 border-t border-[var(--border)]">
                                        {hasDiscount && (
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs line-through text-[var(--muted-fg)] font-medium tabular-nums">
                                              Rp{pack.totalPrice.toLocaleString('id-ID')}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                              Hemat Rp{savingsPack.toLocaleString('id-ID')}
                                            </span>
                                          </div>
                                        )}
                                        <div className="text-[28px] font-bold text-[var(--foreground)] leading-tight tabular-nums">
                                          Rp{finalPrice.toLocaleString('id-ID')}
                                        </div>
                                      </div>

                                      <p className="text-[13px] text-[var(--muted-fg)] leading-relaxed m-0">
                                        {pack.note}
                                      </p>
                                    </div>

                                    <div
                                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-md text-[14px] font-semibold inline-flex items-center justify-center gap-2 select-none pointer-events-none ${
                                        isRecommended
                                          ? 'bg-[var(--primary)] text-white shadow-xs'
                                          : 'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
                                      }`}
                                    >
                                      <span>Pilih paket</span>
                                      <ArrowRight className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="control-empty">Loading discounts…</div>
          ) : error ? null : (
            <DataTable
              columns={discountColumns}
              data={discounts}
              emptyMessage="No discount campaigns created yet. Click '+ Create discount' above to start a promotion."
            />
          )}
        </section>
      )}

      {/* SECTION 3: USERS DATA TABLE */}
      {section === 'users' && (
        <section className="control-panel" aria-labelledby="users-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="users-heading">User management</h2>
              <p>Kelola data akun siswa/pengguna Jitu PTN, target kampus impian, saldo koin, serta kontrol akses akun.</p>
            </div>
            <span>{activeUserTab === 'REGULAR' ? regularUsers.length : sandboxUsers.length} shown</span>
          </div>

          {/* TWO TABS: User Biasa & User Sandbox */}
          <div className="payment-filter-tabs" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={`payment-filter-tab ${activeUserTab === 'REGULAR' ? 'is-active' : ''}`}
              onClick={() => setActiveUserTab('REGULAR')}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Biasa</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: activeUserTab === 'REGULAR' ? 'var(--brand-tint, rgba(59, 130, 246, 0.2))' : 'var(--muted-bg, rgba(255, 255, 255, 0.05))',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
              >
                {regularUsers.length}
              </span>
            </button>
            <button
              type="button"
              className={`payment-filter-tab ${activeUserTab === 'SANDBOX' ? 'is-active' : ''}`}
              onClick={() => setActiveUserTab('SANDBOX')}
              style={{
                borderColor: activeUserTab === 'SANDBOX' ? 'rgba(245, 158, 11, 0.4)' : undefined,
                color: activeUserTab === 'SANDBOX' ? '#f59e0b' : undefined,
              }}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>User Sandbox</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: activeUserTab === 'SANDBOX' ? 'rgba(245, 158, 11, 0.2)' : 'var(--muted-bg, rgba(255, 255, 255, 0.05))',
                  color: activeUserTab === 'SANDBOX' ? '#f59e0b' : undefined,
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
              >
                {sandboxUsers.length}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="control-empty">Loading users…</div>
          ) : error ? null : (
            <DataTable
              columns={userColumns}
              data={activeUserTab === 'REGULAR' ? regularUsers : sandboxUsers}
              emptyMessage={activeUserTab === 'REGULAR' ? 'Tidak ada akun user biasa ditemukan.' : 'Tidak ada akun user sandbox ditemukan.'}
            />
          )}
        </section>
      )}

      {/* SECTION 4: ARTICLES DATA TABLE (NEW MENU) */}
      {section === 'articles' && (
        <section className="control-panel" aria-labelledby="articles-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="articles-heading">Article management</h2>
              <p>Draft, publish, and curate educational guides, tips, and UTBK insights for Jitu students.</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setEditingArticle(null);
                setArticleForm(initialArticleForm);
                setArticleFormOpen(true);
                setError('');
                setNotice('');
              }}
            >
              New article
            </button>
          </div>

          {articleFormOpen && (
            <form className="control-edit-form" onSubmit={saveArticle}>
              <h3>{editingArticle ? 'Edit article' : 'Create article'}</h3>
              <div className="control-form-grid">
                <label className="field-label control-form-wide">
                  Title
                  <input
                    className="field-input"
                    required
                    minLength={3}
                    placeholder="e.g. 5 Strategi Lolos SNBT 2026 Tanpa Bimbel Mahal"
                    value={articleForm.title}
                    onChange={(event) => {
                      const newTitle = event.target.value;
                      setArticleForm({
                        ...articleForm,
                        title: newTitle,
                        slug: editingArticle ? articleForm.slug : autoSlug(newTitle),
                      });
                    }}
                  />
                </label>
                <label className="field-label">
                  Slug / URL Path
                  <input
                    className="field-input"
                    required
                    value={articleForm.slug}
                    onChange={(event) => setArticleForm({ ...articleForm, slug: autoSlug(event.target.value) })}
                    placeholder="panduan-lolos-snbt-2026"
                  />
                </label>
                <label className="field-label">
                  Category
                  <ComboboxSelect
                    value={articleForm.category}
                    onValueChange={(val) => setArticleForm({ ...articleForm, category: val })}
                    options={[
                      { label: 'UTBK-SNBT', value: 'UTBK-SNBT' },
                      { label: 'Tips & Trik', value: 'Tips & Trik' },
                      { label: 'Info Kampus', value: 'Info Kampus' },
                      { label: 'Materi Soal', value: 'Materi Soal' },
                      { label: 'Edukasi', value: 'Edukasi' },
                    ]}
                    triggerClassName="w-full h-9"
                  />
                </label>
                <label className="field-label">
                  Author Name
                  <input
                    className="field-input"
                    value={articleForm.authorName}
                    onChange={(event) => setArticleForm({ ...articleForm, authorName: event.target.value })}
                    placeholder="Tim Jitu PTN"
                  />
                </label>
                <label className="field-label">
                  Publication Status
                  <ComboboxSelect
                    value={articleForm.status}
                    onValueChange={(val) => setArticleForm({ ...articleForm, status: val as ArticleForm['status'] })}
                    options={[
                      { label: 'Published', value: 'PUBLISHED' },
                      { label: 'Draft', value: 'DRAFT' },
                      { label: 'Archived', value: 'ARCHIVED' },
                    ]}
                    triggerClassName="w-full h-9"
                  />
                </label>
                <label className="field-label">
                  Read time (minutes)
                  <input
                    className="field-input"
                    type="number"
                    min="1"
                    value={articleForm.readTimeMinutes}
                    onChange={(event) => setArticleForm({ ...articleForm, readTimeMinutes: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Tags (comma-separated)
                  <input
                    className="field-input"
                    value={articleForm.tags}
                    onChange={(event) => setArticleForm({ ...articleForm, tags: event.target.value })}
                    placeholder="UTBK, SNBT, Strategi Belajar"
                  />
                </label>
                <label className="field-label control-form-wide">
                  Cover Image URL
                  <input
                    className="field-input"
                    type="url"
                    value={articleForm.coverImageUrl}
                    onChange={(event) => setArticleForm({ ...articleForm, coverImageUrl: event.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </label>
                <label className="field-label control-form-wide">
                  Summary / Excerpt
                  <textarea
                    className="field-input"
                    rows={2}
                    value={articleForm.summary}
                    onChange={(event) => setArticleForm({ ...articleForm, summary: event.target.value })}
                    placeholder="Brief description to capture reader interest..."
                  />
                </label>
                <label className="field-label control-form-wide">
                  Article Content (Markdown supported)
                  <textarea
                    className="field-input"
                    rows={8}
                    required
                    value={articleForm.content}
                    onChange={(event) => setArticleForm({ ...articleForm, content: event.target.value })}
                    placeholder="# Main Title&#10;&#10;Write the full body of the article here..."
                  />
                </label>
              </div>
              <div className="control-form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setArticleForm(initialArticleForm);
                    setEditingArticle(null);
                    setArticleFormOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingArticle ? 'Save changes' : 'Publish article'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="control-empty">Loading articles…</div>
          ) : error ? null : (
            <DataTable
              columns={articleColumns}
              data={articles}
              emptyMessage="No articles found. Click 'New article' to publish one!"
            />
          )}
        </section>
      )}

      {/* SECTION 5: CAREERS DATA TABLE (WITH VIEW DETAILS) */}
      {section === 'careers' && (
        <section className="control-panel" aria-labelledby="careers-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="careers-heading">Careers & hiring</h2>
              <p>Review applications, candidate portfolios, resumes, and update recruitment status.</p>
            </div>
            <span>{applications.length} applicants shown</span>
          </div>

          {loading ? (
            <div className="control-empty">Loading applications…</div>
          ) : error ? null : (
            <DataTable
              columns={careerColumns}
              data={applications}
              emptyMessage="No applications found."
            />
          )}
        </section>
      )}

      {/* SECTION 6: PAYMENTS & REVENUE (LOGS, GRAPHS & FILTERS) */}
      {section === 'payments' && (
        <section className="control-panel" aria-labelledby="payments-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="payments-heading">Payments & revenue overview</h2>
              <p>Track real-time transaction logs, payment statuses, and revenue trends across Jitu.</p>
            </div>
            <span>{payments.length} transactions shown</span>
          </div>

          {loading && !paymentSummary ? (
            <div className="revenue-metrics" aria-label="Loading payments summary">
              {[1, 2, 3, 4].map((item) => (
                <div className="loading-skeleton" key={item} />
              ))}
            </div>
          ) : (
            paymentSummary && (
              <div className="referral-metrics-card" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <div className="referral-metric-item">
                  <div className="referral-metric-header">
                    <span>Total confirmed revenue</span>
                    <Wallet className="referral-metric-icon" />
                  </div>
                  <div className="referral-metric-value">{currency.format(paymentSummary.totalRevenue)}</div>
                  <div className="referral-metric-sub">From settled transactions</div>
                </div>

                <div className="referral-metric-item">
                  <div className="referral-metric-header">
                    <span>Confirmed payments</span>
                    <CheckCircle2 className="referral-metric-icon" />
                  </div>
                  <div className="referral-metric-value">{paymentSummary.confirmedPayments.toLocaleString('en-US')}</div>
                  <div className="referral-metric-sub">Completed &amp; coins credited</div>
                </div>

                <div className="referral-metric-item">
                  <div className="referral-metric-header">
                    <span>Waiting / pending</span>
                    <Clock className="referral-metric-icon" />
                  </div>
                  <div className="referral-metric-value">{paymentSummary.pendingPayments.toLocaleString('en-US')}</div>
                  <div className="referral-metric-sub">Awaiting QRIS completion</div>
                </div>

                <div className="referral-metric-item">
                  <div className="referral-metric-header">
                    <span>Cancelled / expired</span>
                    <XCircle className="referral-metric-icon" />
                  </div>
                  <div className="referral-metric-value">{paymentSummary.cancelledPayments.toLocaleString('en-US')}</div>
                  <div className="referral-metric-sub">Cancelled by user or expired</div>
                </div>
              </div>
            )
          )}

          {/* Status Filters Bar */}
          <div className="payment-filter-bar">
            <div className="payment-filter-tabs" role="tablist" aria-label="Filter payments by status">
              {[
                { id: 'ALL', label: 'All Transactions', icon: CreditCard },
                { id: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
                { id: 'PENDING', label: 'Waiting / Pending', icon: Clock },
                { id: 'CANCELLED', label: 'Cancelled', icon: XCircle },
                { id: 'DECLINED', label: 'Declined', icon: AlertCircle },
              ].map((st) => {
                const TabIcon = st.icon;
                const isActive = paymentStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setPaymentStatusFilter(st.id);
                      void loadSection('payments', search, true, { status: st.id });
                    }}
                    className={`payment-filter-tab ${isActive ? 'is-active' : ''}`}
                  >
                    <TabIcon />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payments DataTable */}
          {loading ? (
            <div className="control-empty">Loading payments log…</div>
          ) : error ? null : (
            <DataTable
              columns={paymentColumns}
              data={payments}
              emptyMessage="No payments found matching the selected status or query."
            />
          )}
        </section>
      )}

      {/* VOUCHER / REFERRAL MODAL */}
      {voucherFormOpen && (
        <div className="modal-overlay" onClick={() => setVoucherFormOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div>
                <h3>{editingVoucher ? 'Edit Kode Referal' : 'Buat Kode Referal Baru'}</h3>
                <small style={{ color: 'var(--muted-fg)' }}>
                  Atur kode referal, persentase diskon pembeli, persentase komisi mitra, dan akun pemilik.
                </small>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setVoucherForm(initialVoucherForm);
                  setEditingVoucher(null);
                  setVoucherFormOpen(false);
                }}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveVoucher}>
              <div className="modal-body" style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
                <div className="control-form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <label className="field-label" style={{ gridColumn: 'span 2' }}>
                    Kode Referal (Huruf Kapital)
                    <input
                      className="field-input font-mono font-bold tracking-wider"
                      required
                      minLength={2}
                      placeholder="Contoh: JITU20, AMBIS50, PARTNER10"
                      value={voucherForm.code}
                      onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    />
                  </label>

                  <label className="field-label">
                    Persentase Diskon Pembeli (%)
                    <input
                      className="field-input font-mono"
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="20"
                      value={voucherForm.discountPercent}
                      onChange={(e) => setVoucherForm({ ...voucherForm, discountPercent: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Persentase Komisi Pemilik (%)
                    <input
                      className="field-input font-mono"
                      type="number"
                      required
                      min="0"
                      max="100"
                      placeholder="10"
                      value={voucherForm.commissionPercent}
                      onChange={(e) => setVoucherForm({ ...voucherForm, commissionPercent: e.target.value })}
                    />
                  </label>

                  <label className="field-label" style={{ gridColumn: 'span 2' }}>
                    Issued To: Pilih Akun Terdaftar (Siswa / Mitra)
                    <select
                      className="field-input"
                      value={voucherForm.issuedToUserId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedUser = users.find((u) => u.id === selectedId);
                        setVoucherForm({
                          ...voucherForm,
                          issuedToUserId: selectedId,
                          issuedToName: selectedUser?.name || voucherForm.issuedToName,
                          issuedToEmail: selectedUser?.email || voucherForm.issuedToEmail,
                          referrerName: selectedUser?.name || voucherForm.referrerName,
                        });
                      }}
                    >
                      <option value="">-- Pilih Akun Terdaftar (Opsional) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || 'Tanpa Nama'} ({u.email})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-label">
                    Issued To: Nama Pemilik (Manual / External)
                    <input
                      className="field-input"
                      placeholder="Kak Budi Ambis"
                      value={voucherForm.issuedToName}
                      onChange={(e) => setVoucherForm({ ...voucherForm, issuedToName: e.target.value, referrerName: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Issued To: Email Pemilik (Opsional)
                    <input
                      className="field-input"
                      type="email"
                      placeholder="budi@ambisptn.com"
                      value={voucherForm.issuedToEmail}
                      onChange={(e) => setVoucherForm({ ...voucherForm, issuedToEmail: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Maks. Potongan Diskon (IDR)
                    <input
                      className="field-input font-mono"
                      type="number"
                      min="0"
                      placeholder="Tanpa batas"
                      value={voucherForm.maxDiscount}
                      onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Minimal Pembelian (IDR)
                    <input
                      className="field-input font-mono"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={voucherForm.minPurchase}
                      onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Batas Kuota Penggunaan
                    <input
                      className="field-input font-mono"
                      type="number"
                      min="1"
                      placeholder="Tanpa batas"
                      value={voucherForm.maxUsage}
                      onChange={(e) => setVoucherForm({ ...voucherForm, maxUsage: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    Tanggal Kedaluwarsa
                    <input
                      className="field-input"
                      type="datetime-local"
                      value={voucherForm.expiresAt}
                      onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
                    />
                  </label>

                  <label className="field-label" style={{ gridColumn: 'span 2' }}>
                    Deskripsi Program Referal
                    <input
                      className="field-input"
                      placeholder="Contoh: Program Referal Ambis UTBK 2026"
                      value={voucherForm.description}
                      onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    />
                  </label>

                  <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                    <label className="control-check">
                      <input
                        type="checkbox"
                        checked={voucherForm.isActive}
                        onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                      />
                      <span>Status Aktif (dapat digunakan langsung saat checkout)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setVoucherForm(initialVoucherForm);
                    setEditingVoucher(null);
                    setVoucherFormOpen(false);
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingVoucher ? 'Simpan Perubahan' : 'Buat Kode Referal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL */}
      {selectedApplicant && (
        <div className="modal-overlay" onClick={() => setSelectedApplicant(null)}>
          <div className="modal-dialog modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3>{selectedApplicant.fullName}</h3>
                  <span className={`applicant-status-badge status-${selectedApplicant.status.toLowerCase()}`}>
                    {selectedApplicant.status.replace('_', ' ')}
                  </span>
                </div>
                <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '2px' }}>
                  Application #{selectedApplicant.id} · Submitted {formatDate(selectedApplicant.createdAt)}
                </small>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedApplicant(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Quick Links Row (CV, Portfolio, LinkedIn, Contact) */}
              <div>
                <span className="candidate-detail-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Attachments & Contact Links
                </span>
                <div className="candidate-links-row">
                  {selectedApplicant.cvUrl ? (
                    <a
                      href={selectedApplicant.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-ext-link"
                      style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
                    >
                      📄 Open CV / Resume ↗
                    </a>
                  ) : (
                    <span className="candidate-ext-link" style={{ opacity: 0.6, cursor: 'default' }}>
                      No CV provided
                    </span>
                  )}

                  {selectedApplicant.portfolioUrl && (
                    <a
                      href={selectedApplicant.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-ext-link"
                    >
                      🎨 View Portfolio ↗
                    </a>
                  )}

                  {selectedApplicant.linkedinUrl && (
                    <a
                      href={selectedApplicant.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-ext-link"
                    >
                      🔗 LinkedIn Profile ↗
                    </a>
                  )}

                  {selectedApplicant.email && (
                    <a
                      href={`mailto:${selectedApplicant.email}`}
                      className="candidate-ext-link"
                    >
                      ✉️ {selectedApplicant.email}
                    </a>
                  )}

                  {selectedApplicant.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedApplicant.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-ext-link"
                    >
                      💬 WhatsApp: {selectedApplicant.whatsapp} ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Comprehensive Details Grid */}
              <div className="candidate-details-grid">
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Primary Role</span>
                  <span className="candidate-detail-value"><strong>{selectedApplicant.primaryRole}</strong></span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Primary Division</span>
                  <span className="candidate-detail-value">{selectedApplicant.primaryDivision}</span>
                </div>
                {selectedApplicant.secondaryRole && (
                  <div className="candidate-detail-item full-width">
                    <span className="candidate-detail-label">Secondary Role (Alternative Preference)</span>
                    <span className="candidate-detail-value">{selectedApplicant.secondaryRole}</span>
                  </div>
                )}
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">University / Institution</span>
                  <span className="candidate-detail-value">{selectedApplicant.university}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Major / Field of Study</span>
                  <span className="candidate-detail-value">{selectedApplicant.major || 'Not specified'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Academic Status</span>
                  <span className="candidate-detail-value">{selectedApplicant.academicStatus || 'Active Undergraduate'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Domicile / Location</span>
                  <span className="candidate-detail-value">{selectedApplicant.domicile || 'Not specified'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Weekly Availability</span>
                  <span className="candidate-detail-value">{selectedApplicant.availability || 'Flexible'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Earliest Start Date</span>
                  <span className="candidate-detail-value">{selectedApplicant.startDate || 'Immediately'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Referral Source</span>
                  <span className="candidate-detail-value">{selectedApplicant.referralSource || 'Direct / Social Media'}</span>
                </div>
                <div className="candidate-detail-item">
                  <span className="candidate-detail-label">Commitment Agreed</span>
                  <span className="candidate-detail-value">{selectedApplicant.commitmentAgreed ? '✅ Yes' : '—'}</span>
                </div>
              </div>

              {/* Motivation Essay */}
              {selectedApplicant.motivationEssay && (
                <div className="candidate-essay-block">
                  <span className="candidate-essay-title">🎯 Motivation to Join Jitu PTN</span>
                  <p className="candidate-essay-text">{selectedApplicant.motivationEssay}</p>
                </div>
              )}

              {/* Relevant Experience Essay */}
              {selectedApplicant.experienceEssay && (
                <div className="candidate-essay-block">
                  <span className="candidate-essay-title">💼 Relevant Experience & Achievements</span>
                  <p className="candidate-essay-text">{selectedApplicant.experienceEssay}</p>
                </div>
              )}

              {/* Review & Status Editor with Combobox */}
              <div style={{ background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 650, color: 'var(--foreground)' }}>
                  Internal Review & Status Update
                </h4>
                <div className="control-form-grid" style={{ marginBottom: '12px' }}>
                  <label className="field-label">
                    Recruitment Stage / Status
                    <ComboboxSelect
                      value={applicantStatusDraft}
                      onValueChange={(val) => setApplicantStatusDraft(val as CareerApplication['status'])}
                      options={[
                        { label: 'Submitted', value: 'SUBMITTED' },
                        { label: 'Under Review', value: 'UNDER_REVIEW' },
                        { label: 'Interview', value: 'INTERVIEW' },
                        { label: 'Accepted', value: 'ACCEPTED' },
                        { label: 'Rejected', value: 'REJECTED' },
                      ]}
                      triggerClassName="w-full h-9 font-semibold"
                    />
                  </label>
                  <label className="field-label control-form-wide">
                    Admin Notes (visible only to team admins)
                    <textarea
                      className="field-input"
                      rows={3}
                      placeholder="e.g. Strong portfolio in marketing. Recommended for round 2 technical interview..."
                      value={applicantNotesDraft}
                      onChange={(e) => setApplicantNotesDraft(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void saveApplicantReview()}
                  disabled={savingApplicant}
                >
                  {savingApplicant ? 'Saving review…' : 'Save Review & Status'}
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedApplicant(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

            {/* PREVIEW QUESTION & INTERACTIVE SOLUTION MODAL */}
      {previewQuestion && (
        <div className="modal-overlay" onClick={() => setPreviewQuestion(null)}>
          <div
            className="modal-dialog modal-wide"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '92vh' }}
          >
            <div className="modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-zinc-200 bg-white/[0.06] border border-white/10 px-2.5 py-0.5 rounded">
                    {formatQuestionCode(previewQuestion)}
                  </span>
                  {previewQuestion.target === 'DRAFT' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Draft
                    </span>
                  )}
                  {previewQuestion.target === 'SANDBOX' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-800/50">
                      Sandbox (Khusus sandbox@jitu.com)
                    </span>
                  )}
                  {previewQuestion.target === 'FOR_PRACTICE' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                      Latihan (Free)
                    </span>
                  )}
                  {previewQuestion.target === 'FOR_TRYOUT' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-950/40 text-sky-300 border border-sky-800/50">
                      {previewQuestion.tryoutId
                        ? `Tryout: ${previewQuestion.tryoutTitle || previewQuestion.tryoutId}`
                        : 'Pool Tryout (Belum Diplot)'}
                    </span>
                  )}
                  {previewQuestion.target === 'SOAL_ASLI' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-800/50">
                      Arsip Soal: {previewQuestion.packageTitle || previewQuestion.packageId || 'Resmi'}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {previewQuestion.type === 'ISIAN_SINGKAT' || previewQuestion.type === 'SHORT_ANSWER' ? 'Isian Singkat' : previewQuestion.type === 'COMPLEX_MULTIPLE_CHOICE' ? 'Pilihan Ganda Kompleks' : 'Pilihan Ganda'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${previewQuestion.difficulty === 'EASY' ? 'bg-emerald-400' : previewQuestion.difficulty === 'HARD' ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                    {previewQuestion.difficulty === 'EASY' ? 'Mudah' : previewQuestion.difficulty === 'HARD' ? 'Sulit' : 'Sedang'}
                  </span>
                  <span className="text-xs text-[var(--muted-fg)]">
                    {previewQuestion.subtest.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="m-0 text-base font-bold">Detail Soal & Pembahasan</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewQuestion(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="modal-body space-y-4" style={{ overflowY: 'auto' }}>
              {/* Stimulus if any */}
              {previewQuestion.narration && (
                <div className="p-3.5 rounded-lg bg-[var(--surface)] text-xs italic text-[var(--muted-fg)] leading-relaxed border-l-4 border-amber-500">
                  <strong className="text-[var(--foreground)]">Teks Bacaan / Stimulus:</strong>
                  <p className="mt-1 m-0">{previewQuestion.narration}</p>
                </div>
              )}

              {/* Question Content */}
              <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <div className="text-sm font-semibold text-[var(--foreground)] leading-relaxed mb-3">
                  {previewQuestion.content}
                </div>

                {/* Options A - E or Short Answer Preview */}
                {previewQuestion.type === 'ISIAN_SINGKAT' || previewQuestion.type === 'SHORT_ANSWER' || (!previewQuestion.options || previewQuestion.options.length === 0) ? (
                  <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>✍️</span> Kunci Jawaban Isian Singkat
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Standar Resmi BPPP SNBT
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded bg-[var(--background)] border border-[var(--border)]">
                      <span className="text-xs text-[var(--muted-fg)]">Kunci Jawaban Resmi:</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {previewQuestion.correctAnswer || '(Belum diset)'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--muted-fg)] leading-relaxed">
                      💡 <em>Petunjuk format menjawab telah disematkan pada pertanyaan soal agar siswa memasukkan angka bulat secara akurat.</em>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {previewQuestion.options?.map((opt, i) => {
                      const letters = ['A', 'B', 'C', 'D', 'E'];
                      const letter = letters[i] || String(i + 1);
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all ${
                            opt.isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium'
                              : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              opt.isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'border border-[var(--border)] text-[var(--muted-fg)]'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{opt.content}</span>
                          {opt.isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-400 shrink-0">
                              ✓ Kunci Jawaban
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Companion Tricks & Formulas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewQuestion.solution?.keyFormula && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                    <span className="font-bold text-purple-400 block mb-1">📐 Rumus Kunci:</span>
                    <code className="text-purple-200 font-mono text-[11px]">
                      {previewQuestion.solution.keyFormula}
                    </code>
                  </div>
                )}
                {previewQuestion.solution?.quickTrick && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-400 block mb-1">💡 Trik Jitu:</span>
                    <span className="text-amber-200">{previewQuestion.solution.quickTrick}</span>
                  </div>
                )}
              </div>

              {/* Interactive Deck Simulator */}
              {previewQuestion.solution?.steps && previewQuestion.solution.steps.length > 0 ? (
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Interactive Deck Simulator
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-medium">
                        Slide {previewSlideIdx + 1} dari {previewQuestion.solution.steps.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="button button-secondary text-xs h-7 px-2.5 flex items-center gap-1"
                        disabled={previewSlideIdx === 0}
                        onClick={() => setPreviewSlideIdx((prev) => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                      </button>
                      <button
                        type="button"
                        className="button button-secondary text-xs h-7 px-2.5 flex items-center gap-1"
                        disabled={previewSlideIdx >= (previewQuestion.solution?.steps?.length ?? 1) - 1}
                        onClick={() =>
                          setPreviewSlideIdx((prev) =>
                            Math.min((previewQuestion.solution?.steps?.length ?? 1) - 1, prev + 1)
                          )
                        }
                      >
                        Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Current Slide Display */}
                  {(() => {
                    const curStep = previewQuestion.solution?.steps?.[previewSlideIdx];
                    if (!curStep) return null;
                    return (
                      <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300">
                            {curStep.category || `Langkah ${curStep.stepNumber}`}
                          </span>
                          <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">
                            {curStep.title}
                          </h4>
                        </div>
                        <div className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-sans pt-1">
                          {curStep.content}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-3 text-xs text-[var(--muted-fg)] italic bg-[var(--surface)] rounded-lg">
                  Tidak ada slide pembahasan interaktif untuk soal ini.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {previewQuestion.target !== 'SOAL_ASLI' && (() => {
                  const st = (previewQuestion.status || 'DRAFT').toUpperCase();
                  const busy = workflowBusyId === previewQuestion.id;
                  return (
                    <>
                      {st === 'DRAFT' && (
                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={busy}
                          onClick={() => void handleQuestionWorkflow(previewQuestion, 'SUBMIT_QC')}
                          style={{ color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                        >
                          Ajukan ke Antrean QC
                        </button>
                      )}
                      {st === 'QC_SANDBOX' && (
                        <>
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={busy || sandboxOpeningId === previewQuestion.id}
                            onClick={() => void handleOpenInSandbox(previewQuestion)}
                            style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.45)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <ExternalLink style={{ width: 14, height: 14 }} />
                            <span>{sandboxOpeningId === previewQuestion.id ? 'Membuka Sandbox…' : 'Buka di Sandbox'}</span>
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={busy}
                            onClick={() => void handleQuestionWorkflow(previewQuestion, 'APPROVE')}
                            style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.45)', fontWeight: 700 }}
                          >
                            ✓ Lolos QC (Ready)
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={busy}
                            onClick={() =>
                              setRevisionModal({
                                open: true,
                                question: previewQuestion,
                                notes: previewQuestion.revisionNotes || '',
                                submitting: false,
                              })
                            }
                            style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.45)' }}
                          >
                            Kembalikan ke Kotak Revisi
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    const toEdit = previewQuestion;
                    setPreviewQuestion(null);
                    setSection('questions');
                    editQuestionItem(toEdit);
                  }}
                >
                  Edit Soal Ini
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setPreviewQuestion(null)}
                >
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {userModalOpen && selectedUserForModal && (
        <div className="modal-overlay" onClick={() => setUserModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <Avatar
                  size="lg"
                  src={selectedUserForModal.image || getCartoonAvatarUrl(selectedUserForModal.email || selectedUserForModal.name || selectedUserForModal.id)}
                  alt={selectedUserForModal.name || 'User'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {selectedUserForModal.name || 'Anonymous User'}
                    </h3>
                    <span className={`control-status ${selectedUserForModal.isBanned ? 'status-rejected' : 'status-accepted'}`}>
                      {selectedUserForModal.isBanned ? <XCircle /> : <CheckCircle2 />}
                      {selectedUserForModal.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '2px', fontSize: '12px' }}>
                    {selectedUserForModal.email}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setUserModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body space-y-3" style={{ paddingTop: '8px' }}>
              <div className="user-modal-grid">
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Account Status</span>
                  <span className="user-modal-stat-value">
                    <span className={`control-status ${selectedUserForModal.isBanned ? 'status-rejected' : 'status-accepted'}`}>
                      {selectedUserForModal.isBanned ? <XCircle /> : <CheckCircle2 />}
                      {selectedUserForModal.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </span>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Coin Balance</span>
                  <strong className="user-modal-stat-value">
                    <Coins className="cell-accessory-icon" />
                    {selectedUserForModal.tokenBalance} coins
                  </strong>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Target PTN / Prodi</span>
                  <strong className="user-modal-stat-value">{selectedUserForModal.target || 'Not set'}</strong>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Daily Streak</span>
                  <strong className="user-modal-stat-value">
                    <Flame className="cell-accessory-icon" />
                    {selectedUserForModal.currentStreak ?? 0} hari
                  </strong>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Joined Date</span>
                  <span className="user-modal-stat-value">
                    <Calendar className="cell-accessory-icon" />
                    {formatDate(selectedUserForModal.createdAt)}
                  </span>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Email Verification</span>
                  <span className="user-modal-stat-value">
                    {selectedUserForModal.emailVerified ? (
                      <>
                        <CheckCircle2 className="cell-accessory-icon" />
                        Verified
                      </>
                    ) : (
                      'Unverified'
                    )}
                  </span>
                </div>
                <div className="user-modal-stat">
                  <span className="user-modal-stat-label">Sandbox Tester</span>
                  <span className="user-modal-stat-value">
                    {selectedUserForModal.isSandbox ? (
                      <span className="control-status" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        <FlaskConical className="cell-accessory-icon" /> Active
                      </span>
                    ) : (
                      'Non-Sandbox'
                    )}
                  </span>
                </div>
              </div>

              <div className="user-modal-id">
                ID: {selectedUserForModal.id}
              </div>

              {/* User Actions inside Modal */}
              <div className="user-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setSandboxConfirmModal({
                      isOpen: true,
                      user: selectedUserForModal,
                      targetState: !selectedUserForModal.isSandbox,
                      loading: false,
                    });
                  }}
                >
                  <FlaskConical className="action-icon" />
                  {selectedUserForModal.isSandbox ? 'Cabut Akses Sandbox' : 'Jadikan Sandbox Tester'}
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => void toggleBanUser(selectedUserForModal)}
                  disabled={banningUserId === selectedUserForModal.id || member?.email === selectedUserForModal.email}
                >
                  <Ban className="action-icon" />
                  {selectedUserForModal.isBanned ? 'Unban Account' : 'Ban Account'}
                </button>

                <button
                  type="button"
                  className="button button-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => void deleteUserItem(selectedUserForModal)}
                  disabled={deletingUserId === selectedUserForModal.id || member?.email === selectedUserForModal.email}
                >
                  <Trash2 className="action-icon" />
                  Delete Account
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setUserModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CONFIRMATION MODAL FOR SANDBOX TOGGLE */}
      {sandboxConfirmModal.isOpen && sandboxConfirmModal.user && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!sandboxConfirmModal.loading) {
              setSandboxConfirmModal({ isOpen: false, user: null, targetState: true, loading: false });
            }
          }}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '24px' }}
          >
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: sandboxConfirmModal.targetState ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: sandboxConfirmModal.targetState ? '#f59e0b' : '#3b82f6',
                    border: `1px solid ${sandboxConfirmModal.targetState ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                  }}
                >
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {sandboxConfirmModal.targetState ? 'Konfirmasi Pindahkan ke Sandbox' : 'Konfirmasi Cabut Akses Sandbox'}
                  </h3>
                  <small style={{ color: 'var(--muted-fg)', fontSize: '12px' }}>
                    Aksi perubahan hak akses akun pengguna
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={sandboxConfirmModal.loading}
                onClick={() => setSandboxConfirmModal({ isOpen: false, user: null, targetState: true, loading: false })}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body space-y-4" style={{ marginBottom: '20px' }}>
              <div
                style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar
                    size="sm"
                    src={sandboxConfirmModal.user.image || getCartoonAvatarUrl(sandboxConfirmModal.user.email || sandboxConfirmModal.user.name || sandboxConfirmModal.user.id)}
                    alt={sandboxConfirmModal.user.name || 'User'}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--foreground)' }}>
                      {sandboxConfirmModal.user.name || 'Anonymous User'}
                    </strong>
                    <small style={{ color: 'var(--muted-fg)', fontSize: '11.5px' }}>
                      {sandboxConfirmModal.user.email}
                    </small>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--foreground)' }}>
                {sandboxConfirmModal.targetState ? (
                  <>
                    Apakah Anda yakin ingin memindahkan user ini ke mode <strong>User Sandbox</strong>?
                    <p style={{ marginTop: '8px', color: 'var(--muted-fg)', fontSize: '12px' }}>
                      User ini akan mendapatkan hak akses khusus untuk melihat dan menguji bank soal berstatus Sandbox (Quality Control) sebelum dirilis ke publik.
                    </p>
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin mengembalikan user ini menjadi <strong>User Biasa</strong>?
                    <p style={{ marginTop: '8px', color: 'var(--muted-fg)', fontSize: '12px' }}>
                      Akses pengujian sandbox akan dicabut dan akun user hanya dapat mengakses paket soal resmi yang dirilis untuk publik.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2.5">
              <button
                type="button"
                className="button button-secondary"
                disabled={sandboxConfirmModal.loading}
                onClick={() => setSandboxConfirmModal({ isOpen: false, user: null, targetState: true, loading: false })}
              >
                Batal
              </button>
              <button
                type="button"
                className="button"
                style={{
                  background: sandboxConfirmModal.targetState ? '#f59e0b' : 'var(--brand)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                disabled={sandboxConfirmModal.loading}
                onClick={() => void handleConfirmSandboxToggle()}
              >
                {sandboxConfirmModal.loading ? 'Menyimpan...' : (
                  sandboxConfirmModal.targetState ? 'Ya, Pindahkan ke Sandbox' : 'Ya, Cabut Akses Sandbox'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE PREVIEW MODAL */}
      {previewArticle && (
        <div className="modal-overlay" onClick={() => setPreviewArticle(null)}>
          <div className="modal-dialog modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="article-badge-category">{previewArticle.category}</span>
                <h3>{previewArticle.title}</h3>
                <small style={{ color: 'var(--muted-fg)' }}>
                  By {previewArticle.authorName} · {previewArticle.readTimeMinutes} min read · Status: {previewArticle.status}
                </small>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewArticle(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {previewArticle.coverImageUrl && (
                <img
                  src={previewArticle.coverImageUrl}
                  alt=""
                  style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              {previewArticle.summary && (
                <div style={{ fontStyle: 'italic', color: 'var(--muted-fg)', borderLeft: '3px solid var(--brand)', paddingLeft: '12px' }}>
                  {previewArticle.summary}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '14px', color: 'var(--foreground)' }}>
                {previewArticle.content}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  const toEdit = previewArticle;
                  setPreviewArticle(null);
                  editArticleItem(toEdit);
                }}
              >
                Edit Article
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setPreviewArticle(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT TOPIC */}
      {topicModalOpen && (
        <div className="modal-overlay" onClick={() => setTopicModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingTopic ? 'Edit Materi Utama' : 'Tambah Materi Utama'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                  Materi utama mengelompokkan submateri pada masing-masing subtes SNBT.
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setTopicModalOpen(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <form onSubmit={handleSaveTopic}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label className="field-label">
                  <span>Subtes UTBK-SNBT</span>
                  <select
                    className="field-input"
                    value={topicForm.subtest}
                    onChange={(e) => setTopicForm({ ...topicForm, subtest: e.target.value })}
                  >
                    {ALL_SUBTESTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  <span>Judul Materi Utama</span>
                  <input
                    type="text"
                    required
                    className="field-input"
                    placeholder="Contoh: Aljabar & Fungsi, Aritmetika..."
                    value={topicForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = editingTopic
                        ? topicForm.slug
                        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setTopicForm({ ...topicForm, title, slug });
                    }}
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <label className="field-label">
                    <span>Slug Identifier</span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="aljabar-dan-fungsi"
                      value={topicForm.slug}
                      onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    <span>Urutan (Order)</span>
                    <input
                      type="number"
                      min={1}
                      className="field-input"
                      value={topicForm.order}
                      onChange={(e) => setTopicForm({ ...topicForm, order: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="button button-secondary" onClick={() => setTopicModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="button button-primary" disabled={topicSaving}>
                  {topicSaving ? 'Menyimpan...' : (editingTopic ? 'Simpan Perubahan' : 'Buat Materi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT SUBTOPIC */}
      {subtopicModalOpen && (
        <div className="modal-overlay" onClick={() => setSubtopicModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingSubtopic ? 'Edit Submateri & Pola Soal' : 'Tambah Submateri Baru'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                  {activeParentTopic ? `Materi Induk: ${activeParentTopic.title}` : 'Atur rincian submateri dan daftar indikator pola soal.'}
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSubtopicModalOpen(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <form onSubmit={handleSaveSubtopic}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label className="field-label">
                  <span>Materi Utama Induk</span>
                  <select
                    className="field-input"
                    value={subtopicForm.topicId}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, topicId: e.target.value })}
                    disabled={Boolean(activeParentTopic && !editingSubtopic)}
                  >
                    {topics.map((t) => {
                      const subMeta = ALL_SUBTESTS.find((s) => s.id === t.subtest);
                      return (
                        <option key={t.id} value={t.id}>
                          [{subMeta?.code || t.subtest.split('_')[0]}] {t.title}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="field-label">
                  <span>Judul Submateri</span>
                  <input
                    type="text"
                    required
                    className="field-input"
                    placeholder="Contoh: Persamaan & Pertidaksamaan Kuadrat..."
                    value={subtopicForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = editingSubtopic
                        ? subtopicForm.slug
                        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setSubtopicForm({ ...subtopicForm, title, slug });
                    }}
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <label className="field-label">
                    <span>Slug Identifier</span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="persamaan-dan-pertidaksamaan-kuadrat"
                      value={subtopicForm.slug}
                      onChange={(e) => setSubtopicForm({ ...subtopicForm, slug: e.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    <span>Urutan (Order)</span>
                    <input
                      type="number"
                      min={1}
                      className="field-input"
                      value={subtopicForm.order}
                      onChange={(e) => setSubtopicForm({ ...subtopicForm, order: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label className="field-label">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Pola Soal / Indikator (Satu per baris)</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-fg)' }}>
                      {subtopicForm.patternsText.split('\n').map((l) => l.trim()).filter(Boolean).length} pola terdaftar
                    </span>
                  </div>
                  <textarea
                    className="field-input"
                    rows={5}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px', lineHeight: 1.5 }}
                    placeholder={'Contoh:\nAkar-akar dan Hubungan Jumlah-Hasil Kali Akar\nDiskriminan dan Jenis Akar\nFungsi Kuadrat dan Titik Puncak'}
                    value={subtopicForm.patternsText}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, patternsText: e.target.value })}
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="button button-secondary" onClick={() => setSubtopicModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="button button-primary" disabled={subtopicSaving}>
                  {subtopicSaving ? 'Menyimpan...' : (editingSubtopic ? 'Simpan Perubahan' : 'Buat Submateri')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PILIH METODE PEMBUATAN SOAL & IMPORT JSON (AI) */}
      {createMethodModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateMethodModalOpen(false)}>
          <div
            className={`modal-dialog ${createMethodView === 'IMPORT_JSON' ? 'modal-wide' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: createMethodView === 'IMPORT_JSON' ? '900px' : '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {createMethodView === 'IMPORT_JSON' && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '11px', height: '28px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setCreateMethodView('SELECT')}
                  >
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                    <span>Kembali</span>
                  </button>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {createMethodView === 'SELECT'
                      ? 'Pilih Metode Pembuatan Soal'
                      : 'Import Soal via JSON (AI)'}
                  </h3>
                  <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '2px' }}>
                    {createMethodView === 'SELECT'
                      ? 'Pilih apakah ingin input manual dari nol atau generate & import JSON via AI'
                      : 'Paste format JSON atau sesuaikan prompt kisi-kisi sebelum generate'}
                  </small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {createMethodView === 'IMPORT_JSON' && (
                  <button
                    type="button"
                    className={`button ${isPromptAdjusterOpen ? 'button-primary' : 'button-secondary'}`}
                    style={{
                      fontSize: '11px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      ...(isPromptAdjusterOpen
                        ? { background: '#fbbf24', color: '#000', fontWeight: 700 }
                        : { borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }),
                    }}
                    onClick={() => setIsPromptAdjusterOpen(!isPromptAdjusterOpen)}
                  >
                    <Sliders style={{ width: 14, height: 14 }} />
                    <span>{isPromptAdjusterOpen ? 'Tutup Adjust Prompt' : 'Adjust Prompt'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCreateMethodModalOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SHARED STEP 0: 3-OPTION DESTINATION SELECTOR */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.025)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>1. Tujuan Pembuatan Soal</span>
                      <span
                        className="pill"
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                        }}
                      >
                        Masuk sebagai Draf
                      </span>
                    </div>
                    <small style={{ color: 'var(--muted-fg)', fontSize: '11px' }}>
                      Aktif: <strong style={{ color: '#e5e7eb' }}>{currentPackageLabel}</strong> · Semua soal baru otomatis berstatus Draf agar aman di-QC sebelum tayang.
                    </small>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                  {(
                    [
                      {
                        id: 'FOR_PRACTICE' as const,
                        title: 'Latihan',
                        badge: 'Global · 1 Paket',
                        desc: 'Masuk langsung sebagai Draf di halaman Latihan (tanpa pilih paket).',
                        accent: '#10b981',
                        bg: 'rgba(16, 185, 129, 0.14)',
                      },
                      {
                        id: 'FOR_TRYOUT' as const,
                        title: 'Tryout',
                        badge: 'Multi-Paket',
                        desc: 'Wajib pilih paket Tryout tujuan; masuk sebagai Draf di paket tersebut.',
                        accent: '#38bdf8',
                        bg: 'rgba(56, 189, 248, 0.14)',
                      },
                      {
                        id: 'DRAFT' as const,
                        title: 'Eksperimen',
                        badge: 'Bank Soal',
                        desc: 'Disimpan di Bank Soal sebagai Draf eksperimen untuk dirapikan/dipindah nanti.',
                        accent: '#f59e0b',
                        bg: 'rgba(245, 158, 11, 0.14)',
                      },
                    ]
                  ).map((opt) => {
                    const active = createTarget === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setCreateTarget(opt.id);
                          if (opt.id !== 'FOR_TRYOUT') {
                            setCreateTryoutId('');
                          }
                          setError('');
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '11px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          border: active ? `1.5px solid ${opt.accent}` : '1px solid var(--border)',
                          background: active ? opt.bg : 'rgba(255,255,255,0.015)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: active ? '#fff' : 'var(--foreground)' }}>
                            {opt.title}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 7px',
                              borderRadius: '999px',
                              background: active ? opt.accent : 'rgba(255,255,255,0.06)',
                              color: active ? '#0b0b0f' : 'var(--muted-fg)',
                            }}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: active ? '#e4e4e7' : 'var(--muted-fg)', lineHeight: 1.35 }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {createTarget === 'FOR_TRYOUT' && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#7dd3fc', display: 'block', marginBottom: '6px' }}>
                      Pilih Paket Tryout Tujuan <span style={{ color: '#fb7185' }}>*</span>
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '12px' }}
                      value={createTryoutId}
                      onChange={(e) => {
                        setCreateTryoutId(e.target.value);
                        setError('');
                      }}
                    >
                      <option value="">-- Wajib pilih paket Tryout tujuan --</option>
                      {tryouts.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} (#{t.code}) · {t.readyQuestionCount ?? 0}/{t.questionCount ?? 0} Siap · {t.batch}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* STEP 1: SELECT METHOD (JEJER KANAN KIRI / 2 COLS) */}
              {createMethodView === 'SELECT' && (
                <div className="method-selection-grid">
                  {/* CARD KIRI: MANUAL */}
                  <div
                    className="method-card method-card-manual"
                    onClick={() => {
                      if (createTarget === 'FOR_TRYOUT' && !createTryoutId) {
                        setError('Pilih paket Tryout tujuan terlebih dahulu sebelum masuk ke editor.');
                        return;
                      }
                      setCreateMethodModalOpen(false);
                      setEditingQuestion(null);
                      setQuestionForm({
                        ...initialQuestionForm,
                        target: createTarget,
                        tryoutId: createTarget === 'FOR_TRYOUT' ? createTryoutId : '',
                        status: 'DRAFT',
                      });
                      setQuestionFormOpen(true);
                      setError('');
                      setNotice('');
                    }}
                  >
                    <div>
                      <div className="method-card-icon-wrap method-icon-manual">
                        <PenTool style={{ width: 22, height: 22 }} />
                      </div>
                      <div>
                        <div className="method-card-header">
                          <h4 className="method-card-title">Input Manual</h4>
                          <span className="method-card-badge method-badge-manual">
                            Editor
                          </span>
                        </div>
                        <p className="method-card-desc">
                          Tulis teks wacana, narasi, pertanyaan, 5 pilihan ganda (A-E), dan pembahasan langkah demi langkah secara manual di editor.
                        </p>
                      </div>
                    </div>
                    <div className="method-card-action method-action-manual">
                      <span>Buka Form Editor ({createTarget === 'FOR_PRACTICE' ? 'Latihan' : createTarget === 'FOR_TRYOUT' ? 'Tryout' : 'Eksperimen'})</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </div>
                  </div>

                  {/* CARD KANAN: IMPORT JSON (AI) */}
                  <div
                    className="method-card method-card-ai"
                    onClick={() => {
                      if (createTarget === 'FOR_TRYOUT' && !createTryoutId) {
                        setError('Pilih paket Tryout tujuan terlebih dahulu sebelum membuat prompt atau mengimpor soal Tryout.');
                        return;
                      }
                      setError('');
                      setCreateMethodView('IMPORT_JSON');
                    }}
                  >
                    <div>
                      <div className="method-card-icon-wrap method-icon-ai">
                        <Sparkles style={{ width: 22, height: 22 }} />
                      </div>
                      <div>
                        <div className="method-card-header">
                          <h4 className="method-card-title">Import JSON (AI)</h4>
                          <span className="method-card-badge method-badge-ai">
                            AI + Auto-Balance
                          </span>
                        </div>
                        <p className="method-card-desc">
                          Paste JSON hasil generate LLM atau aktifkan <strong>Auto-Balance terhadap Paket Saat Ini</strong> agar materi & kurikulum otomatis seimbang.
                        </p>
                      </div>
                    </div>
                    <div className="method-card-action method-action-ai">
                      <span>Lanjut ke Import & Prompt</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: IMPORT JSON + ADJUST PROMPT PANEL */}
              {createMethodView === 'IMPORT_JSON' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* ADJUST PROMPT ACCORDION / BUILDER */}
                  {isPromptAdjusterOpen && (
                    <div className="prompt-builder-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders style={{ width: 16, height: 16 }} /> Prompt Engineering & Auto-Balance Builder
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                          Target: <strong style={{ color: '#e5e7eb' }}>{currentPackageLabel}</strong>
                        </span>
                      </div>

                      {/* 0. AUTO-BALANCE TERHADAP PAKET SAAT INI */}
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: autoBalanceEnabled ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border)',
                          background: autoBalanceEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: autoBalanceEnabled ? '#6ee7b7' : 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>Auto-Balance terhadap Paket Saat Ini</span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                  background: autoBalanceEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.06)',
                                  color: autoBalanceEnabled ? '#34d399' : 'var(--muted-fg)',
                                }}
                              >
                                {autoBalanceEnabled ? 'AKTIF' : 'OPSIONAL'}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted-fg)', marginTop: '2px' }}>
                              Paket saat ini memiliki <strong style={{ color: '#e5e7eb' }}>{autoBalanceAnalysis.totalInPackage} soal</strong> ·{' '}
                              <strong style={{ color: '#fbbf24' }}>{autoBalanceAnalysis.uncoveredSubtopicsCount}/{autoBalanceAnalysis.totalCurriculumSubtopics}</strong> subtopik kurikulum belum tercover ·{' '}
                              Level saat ini: E {autoBalanceAnalysis.difficultyCounts.EASY} / M {autoBalanceAnalysis.difficultyCounts.MEDIUM} / H {autoBalanceAnalysis.difficultyCounts.HARD}.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`button ${autoBalanceEnabled ? 'button-primary' : 'button-secondary'}`}
                            style={{
                              fontSize: '11px',
                              height: '30px',
                              padding: '0 12px',
                              ...(autoBalanceEnabled
                                ? { background: '#10b981', color: '#052e16', fontWeight: 800 }
                                : { borderColor: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' }),
                            }}
                            onClick={() => setAutoBalanceEnabled((prev) => !prev)}
                          >
                            {autoBalanceEnabled ? '✓ Auto-Balance Aktif' : 'Aktifkan Auto-Balance'}
                          </button>
                        </div>

                        {autoBalanceEnabled && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '10px', alignItems: 'end' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#a7f3d0', display: 'block', marginBottom: '4px' }}>
                                  Jumlah Soal Batch (1-15)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={15}
                                  className="field-input"
                                  style={{ fontSize: '12px', width: '100%' }}
                                  value={autoBalanceCount}
                                  onChange={(e) => {
                                    const n = parseInt(e.target.value, 10);
                                    if (!isNaN(n)) setAutoBalanceCount(Math.max(1, Math.min(15, n)));
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#a7f3d0', display: 'block', marginBottom: '4px' }}>
                                  Fokus Subtes Batch Ini
                                </label>
                                <select
                                  className="field-input"
                                  style={{ fontSize: '12px', width: '100%' }}
                                  value={autoBalanceSubtestScope}
                                  onChange={(e) => setAutoBalanceSubtestScope(e.target.value)}
                                >
                                  <option value="AUTO">Otomatis Seimbangkan Semua Subtes yang Kurang</option>
                                  {ALL_SUBTESTS.map((sub) => {
                                    const stat = autoBalanceAnalysis.subtestCounts[sub.id];
                                    return (
                                      <option key={sub.id} value={sub.id}>
                                        Fokus {sub.label} ({stat?.count ?? 0}/{stat?.targetQuota ?? 20} soal)
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              {customBalanceSlots && (
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  style={{ fontSize: '11px', height: '34px' }}
                                  onClick={() => setCustomBalanceSlots(null)}
                                >
                                  Reset Plan
                                </button>
                              )}
                            </div>

                            {/* Question Type Composition Controls */}
                            <div
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(0,0,0,0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e5e7eb' }}>
                                  Komposisi Tipe:
                                </span>
                                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                                  {effectiveBalanceSlots.filter((s) => s.questionType === 'PILIHAN_GANDA').length} PG (A-E)
                                </span>
                                <span style={{ color: 'var(--muted-fg)' }}>·</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <label style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>Isian Singkat:</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={autoBalanceCount}
                                    value={autoBalanceIsianCount}
                                    onChange={(e) => setAutoBalanceIsianCount(Math.max(0, Math.min(autoBalanceCount, parseInt(e.target.value, 10) || 0)))}
                                    className="field-input"
                                    style={{ width: '56px', height: '28px', fontSize: '11px', padding: '0 6px' }}
                                  />
                                  <span style={{ fontSize: '10px', color: 'var(--muted-fg)' }}>butir</span>
                                </div>
                              </div>
                              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                                Level otomatis: {effectiveBalanceSlots.filter((s) => s.difficulty === 'EASY').length} Easy · {effectiveBalanceSlots.filter((s) => s.difficulty === 'MEDIUM').length} Med · {effectiveBalanceSlots.filter((s) => s.difficulty === 'HARD').length} Hard
                              </div>
                            </div>

                            {/* Editable Slot Plan Table */}
                            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                  <tr style={{ background: 'rgba(0,0,0,0.28)', textAlign: 'left', color: '#a7f3d0' }}>
                                    <th style={{ padding: '7px 8px' }}>#</th>
                                    <th style={{ padding: '7px 8px' }}>Subtes</th>
                                    <th style={{ padding: '7px 8px' }}>Tipe</th>
                                    <th style={{ padding: '7px 8px' }}>Topik & Subtopik Kurikulum</th>
                                    <th style={{ padding: '7px 8px' }}>Level</th>
                                    <th style={{ padding: '7px 8px' }}>Alasan Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {effectiveBalanceSlots.map((slot, sIdx) => (
                                    <tr key={slot.index} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{slot.index}</td>
                                      <td style={{ padding: '6px 8px' }}>
                                        <select
                                          className="field-input"
                                          style={{ fontSize: '11px', padding: '4px 6px', minWidth: '140px' }}
                                          value={slot.subtest}
                                          onChange={(e) => {
                                            const nextSubtest = e.target.value;
                                            const subObj = ALL_SUBTESTS.find((s) => s.id === nextSubtest);
                                            const firstTopic = topics.find((t) => normalizeSubtestKey(t.subtest) === nextSubtest);
                                            const firstSub = firstTopic?.subtopics?.[0];
                                            const nextSlots = [...effectiveBalanceSlots];
                                            nextSlots[sIdx] = {
                                              ...slot,
                                              subtest: nextSubtest,
                                              subtestLabel: subObj?.label || nextSubtest,
                                              topicId: firstTopic?.id || '',
                                              topicTitle: firstTopic?.title || '',
                                              subtopicId: firstSub?.id || '',
                                              subtopicTitle: firstSub?.title || '',
                                              reason: 'Disesuaikan manual',
                                            };
                                            setCustomBalanceSlots(nextSlots);
                                          }}
                                        >
                                          {ALL_SUBTESTS.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                              {sub.label}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td style={{ padding: '6px 8px' }}>
                                        <select
                                          className="field-input"
                                          style={{ fontSize: '11px', padding: '4px 6px' }}
                                          value={slot.questionType}
                                          onChange={(e) => {
                                            const nextSlots = [...effectiveBalanceSlots];
                                            nextSlots[sIdx] = {
                                              ...slot,
                                              questionType: e.target.value as AutoBalanceSlot['questionType'],
                                            };
                                            setCustomBalanceSlots(nextSlots);
                                          }}
                                        >
                                          <option value="PILIHAN_GANDA">PG (A-E)</option>
                                          <option value="ISIAN_SINGKAT">Isian</option>
                                        </select>
                                      </td>
                                      <td style={{ padding: '6px 8px' }}>
                                        <select
                                          className="field-input"
                                          style={{ fontSize: '11px', padding: '4px 6px', minWidth: '210px', maxWidth: '280px' }}
                                          value={slot.subtopicId}
                                          onChange={(e) => {
                                            const nextSubtopicId = e.target.value;
                                            let matchedTopicTitle = '';
                                            let matchedTopicId = '';
                                            let matchedSubtopicTitle = '';
                                            for (const t of topics) {
                                              const found = t.subtopics?.find((st) => st.id === nextSubtopicId);
                                              if (found) {
                                                matchedTopicId = t.id;
                                                matchedTopicTitle = t.title;
                                                matchedSubtopicTitle = found.title;
                                                break;
                                              }
                                            }
                                            const nextSlots = [...effectiveBalanceSlots];
                                            nextSlots[sIdx] = {
                                              ...slot,
                                              topicId: matchedTopicId,
                                              topicTitle: matchedTopicTitle,
                                              subtopicId: nextSubtopicId,
                                              subtopicTitle: matchedSubtopicTitle,
                                              reason: 'Subtopik dipilih manual',
                                            };
                                            setCustomBalanceSlots(nextSlots);
                                          }}
                                        >
                                          <option value="">-- Umum Subtes Ini --</option>
                                          {topics
                                            .filter((t) => normalizeSubtestKey(t.subtest) === slot.subtest)
                                            .map((t) => (
                                              <optgroup key={t.id} label={t.title}>
                                                {t.subtopics.map((st) => (
                                                  <option key={st.id} value={st.id}>
                                                    {st.title}
                                                  </option>
                                                ))}
                                              </optgroup>
                                            ))}
                                        </select>
                                      </td>
                                      <td style={{ padding: '6px 8px' }}>
                                        <select
                                          className="field-input"
                                          style={{ fontSize: '11px', padding: '4px 6px' }}
                                          value={slot.difficulty}
                                          onChange={(e) => {
                                            const nextSlots = [...effectiveBalanceSlots];
                                            nextSlots[sIdx] = {
                                              ...slot,
                                              difficulty: e.target.value as AutoBalanceSlot['difficulty'],
                                            };
                                            setCustomBalanceSlots(nextSlots);
                                          }}
                                        >
                                          <option value="EASY">EASY</option>
                                          <option value="MEDIUM">MEDIUM</option>
                                          <option value="HARD">HARD</option>
                                        </select>
                                      </td>
                                      <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{slot.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>

                      {!autoBalanceEnabled && (
                      <>
                      {/* 1. Multi-Select Subtests */}
                      {/* 1. Pilih Subtes & Langsung Tentukan Jumlah Soal */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                              1. Pilih Subtes & Tentukan Jumlah Soal
                            </label>
                            <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              Total: {totalPromptCount} Soal
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => {
                                const allCounts: Record<string, number> = {};
                                ALL_SUBTESTS.forEach((s) => { allCounts[s.id] = 5; });
                                setPromptSubtestCounts(allCounts);
                              }}
                            >
                              Pilih Semua (5 Soal/Subtes)
                            </button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => setPromptSubtestCounts({ PENALARAN_MATEMATIKA: 5 })}
                            >
                              Reset Default
                            </button>
                          </div>
                        </div>

                        <div className="subtest-chip-grid">
                          {ALL_SUBTESTS.map((sub) => {
                            const isSelected = Boolean(promptSubtestCounts[sub.id] && promptSubtestCounts[sub.id] > 0);
                            const currentCount = promptSubtestCounts[sub.id] || 0;
                            return (
                              <div
                                key={sub.id}
                                className={`subtest-chip-item ${isSelected ? 'is-active' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="subtest-chip-toggle"
                                  onClick={() => {
                                    if (isSelected) {
                                      if (Object.keys(promptSubtestCounts).length <= 1) return;
                                      const next = { ...promptSubtestCounts };
                                      delete next[sub.id];
                                      setPromptSubtestCounts(next);
                                    } else {
                                      setPromptSubtestCounts((prev) => ({ ...prev, [sub.id]: 5 }));
                                    }
                                  }}
                                >
                                  {isSelected ? (
                                    <Check style={{ width: 13, height: 13, color: '#fbbf24' }} />
                                  ) : (
                                    <span style={{ width: 13, height: 13, borderRadius: '3px', border: '1px solid var(--border)', display: 'inline-block' }} />
                                  )}
                                  <span>{sub.label}</span>
                                </button>

                                {isSelected && (
                                  <div className="subtest-chip-stepper">
                                    <button
                                      type="button"
                                      className="subtest-stepper-btn"
                                      title="Kurangi soal"
                                      onClick={() => {
                                        setPromptSubtestCounts((prev) => ({
                                          ...prev,
                                          [sub.id]: Math.max(1, (prev[sub.id] || 1) - 1),
                                        }));
                                      }}
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      max={50}
                                      className="subtest-stepper-input"
                                      value={currentCount}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 1) {
                                          setPromptSubtestCounts((prev) => ({
                                            ...prev,
                                            [sub.id]: Math.min(50, val),
                                          }));
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="subtest-stepper-btn"
                                      title="Tambah soal"
                                      onClick={() => {
                                        setPromptSubtestCounts((prev) => ({
                                          ...prev,
                                          [sub.id]: Math.min(50, (prev[sub.id] || 0) + 1),
                                        }));
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      </>
                      )}

                      {/* 2. Format Tipe Soal AI */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                            {autoBalanceEnabled ? '2. Tipe Format Soal AI' : '2. Tipe Format Soal AI'}
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                            {promptQuestionType === 'ISIAN_SINGKAT'
                              ? 'Format isian angka murni resmi BPPP SNBT'
                              : promptQuestionType === 'CAMPURAN'
                              ? 'Kombinasi resmi UTBK SNBT (PG & Isian)'
                              : 'Format standar pilihan ganda 5 opsi'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          <button
                            type="button"
                            className={`filter-btn ${promptQuestionType === 'PILIHAN_GANDA' ? 'is-active' : ''}`}
                            style={{ height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => setPromptQuestionType('PILIHAN_GANDA')}
                          >
                            <span>🔘 Pilihan Ganda (A-E)</span>
                          </button>
                          <button
                            type="button"
                            className={`filter-btn ${promptQuestionType === 'ISIAN_SINGKAT' ? 'is-active' : ''}`}
                            style={{ height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => setPromptQuestionType('ISIAN_SINGKAT')}
                          >
                            <span>✍️ Isian Singkat BPPP</span>
                          </button>
                          <button
                            type="button"
                            className={`filter-btn ${promptQuestionType === 'CAMPURAN' ? 'is-active' : ''}`}
                            style={{ height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => setPromptQuestionType('CAMPURAN')}
                          >
                            <span>⚖️ Campuran UTBK</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Tingkat Kesulitan & Fokus Materi dari Halaman Materi (disembunyikan saat Auto-Balance aktif karena slot sudah menentukan keduanya) */}
                      {!autoBalanceEnabled && (
                      <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                            3. Tingkat Kesulitan
                          </label>
                          <select
                            className="field-input"
                            style={{ fontSize: '12px', width: '100%' }}
                            value={promptDifficulty}
                            onChange={(e) => setPromptDifficulty(e.target.value)}
                          >
                            <option value="EASY">Mudah (Konseptual Dasar)</option>
                            <option value="MEDIUM">Sedang (Standar UTBK)</option>
                            <option value="HARD">Sulit (HOTS & Analisis Tinggi)</option>
                            <option value="MIXED">Campuran Berimbang</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                            4. Fokus Materi Kurikulum (Pilih dari Page Materi)
                          </label>
                          <select
                            className="field-input"
                            style={{ fontSize: '12px', width: '100%' }}
                            value={promptSelectedSubtopicId}
                            onChange={(e) => setPromptSelectedSubtopicId(e.target.value)}
                          >
                            <option value="">-- Bebas / Standar Kisi-kisi Resmi SNBT --</option>
                            {topics
                              .filter((t) => Object.keys(promptSubtestCounts).includes(t.subtest))
                              .map((t) => {
                                const subtestLabel = ALL_SUBTESTS.find((s) => s.id === t.subtest)?.label.split(' ')[0] || t.subtest;
                                return (
                                  <optgroup key={t.id} label={`[${subtestLabel}] ${t.title}`}>
                                    {t.subtopics.map((sub) => (
                                      <option key={sub.id} value={sub.id}>
                                        {sub.title}
                                      </option>
                                    ))}
                                  </optgroup>
                                );
                              })}
                            {topics.length > 0 && topics.filter((t) => !Object.keys(promptSubtestCounts).includes(t.subtest)).length > 0 && (
                              <optgroup label="── Topik Subtes Lainnya ──">
                                {topics
                                  .filter((t) => !Object.keys(promptSubtestCounts).includes(t.subtest))
                                  .map((t) =>
                                    t.subtopics.map((sub) => (
                                      <option key={sub.id} value={sub.id}>
                                        [{t.subtest.split('_')[0]}] {t.title} › {sub.title}
                                      </option>
                                    ))
                                  )}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>
                      {promptDifficulty === 'MIXED' && renderDifficultyCompositionControls()}
                      </>
                      )}

                      {/* 3. Catatan Tambahan & Checkboxes */}
                      <div className="prompt-field-row-2">
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                            Catatan Topik Spesifik / Tambahan (Opsional)
                          </label>
                          <input
                            type="text"
                            className="field-input"
                            style={{ fontSize: '12px', width: '100%' }}
                            placeholder="Contoh: Barisan Aritmetika bertingkat, Logika Deduktif, atau instruksi khusus..."
                            value={promptCustomTopic}
                            onChange={(e) => setPromptCustomTopic(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '6px', paddingBottom: '2px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--foreground)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={promptIncludePassage}
                              onChange={(e) => setPromptIncludePassage(e.target.checked)}
                            />
                            <span>Sertakan wacana / narasi teks bacaan</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--foreground)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={promptIncludeTricks}
                              onChange={(e) => setPromptIncludeTricks(e.target.checked)}
                            />
                            <span>Sertakan rumus pokok & trik cepat (Quick Trick)</span>
                          </label>
                        </div>
                      </div>

                      {/* 4. Live Prompt Box & Copy Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Prompt Siap Pakai:
                          </span>
                          <button
                            type="button"
                            className="button button-primary"
                            style={{ fontSize: '12px', height: '28px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fbbf24', color: '#000', fontWeight: 700 }}
                            onClick={handleCopyPrompt}
                          >
                            {copiedPrompt ? (
                              <>
                                <Check style={{ width: 14, height: 14, color: '#000' }} />
                                <span>Prompt Berhasil Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 14, height: 14 }} />
                                <span>Salin Prompt (Copy)</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="prompt-preview-pre">
                          {generatedPrompt}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* BATCH SELECTOR FOR AI IMPORT */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <QuestionBatchField
                      value={importBatch}
                      onChange={setImportBatch}
                      existingBatches={mergedQuestionBatches}
                      label="Assign ke Batch Soal"
                      helperText="Pilih batch yang sudah ada atau buat batch baru — akan otomatis diterapkan ke seluruh soal yang diimpor dari JSON di bawah."
                      compact={true}
                    />
                  </div>

                  {/* PASTE JSON FIELD */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Paste JSON dari AI di Sini:</span>
                        {jsonValidation && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: jsonValidation.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: jsonValidation.valid ? '#34d399' : '#f87171',
                              border: `1px solid ${jsonValidation.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            }}
                          >
                            {jsonValidation.valid ? (
                              <CheckCircle2 style={{ width: 13, height: 13, color: '#34d399' }} />
                            ) : (
                              <AlertCircle style={{ width: 13, height: 13, color: '#f87171' }} />
                            )}
                            <span>{jsonValidation.message}</span>
                          </span>
                        )}
                      </label>
                      {!isPromptAdjusterOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={{ fontSize: '12px', color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                            onClick={() => {
                              setAutoBalanceEnabled(true);
                              setIsPromptAdjusterOpen(true);
                            }}
                          >
                            <Sparkles style={{ width: 13, height: 13 }} />
                            <span>Auto-Balance Paket Ini</span>
                          </button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button
                            type="button"
                            style={{ fontSize: '12px', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                            onClick={() => setIsPromptAdjusterOpen(true)}
                          >
                            <Sliders style={{ width: 13, height: 13 }} />
                            <span>Adjust Prompt Manual</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea
                      className="field-input"
                      style={{ fontFamily: 'monospace', fontSize: '12px', width: '100%' }}
                      rows={8}
                      placeholder={`Paste output JSON dari AI di sini...\nContoh format: [\n  { "subtest": "PENALARAN_MATEMATIKA", "content": "...", "options": [...] }\n]`}
                      value={aiJsonInput}
                      onChange={(e) => setAiJsonInput(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER FOR IMPORT JSON */}
            {createMethodView === 'IMPORT_JSON' && (
              <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px' }}
                  onClick={() => setCreateMethodView('SELECT')}
                >
                  Batal
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {jsonValidation?.isArray && jsonValidation.count > 1 ? (
                    <>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ fontSize: '12px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={applyAiJson}
                        disabled={!aiJsonInput.trim() || !jsonValidation?.valid}
                      >
                        Buka Soal Pertama di Form
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ fontSize: '12px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fbbf24', color: '#000', fontWeight: 700 }}
                        onClick={bulkImportQuestions}
                        disabled={!aiJsonInput.trim() || !jsonValidation?.valid || importingBulk}
                      >
                        {importingBulk ? (
                          <span>Mengimpor {jsonValidation.count} Soal...</span>
                        ) : (
                          <>
                            <Zap style={{ width: 14, height: 14, fill: '#000' }} />
                            <span>Impor Semua ({jsonValidation.count} Soal)</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ fontSize: '12px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={applyAiJson}
                      disabled={!aiJsonInput.trim() || !jsonValidation?.valid}
                    >
                      <span>Terapkan ke Form Editor</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: KEMBALIKAN KE KOTAK REVISI QC */}
      <RevisionRequestModal
        open={revisionModal.open}
        questionSnippet={revisionModal.question?.content || ''}
        notes={revisionModal.notes}
        submitting={revisionModal.submitting}
        onNotesChange={(val) => setRevisionModal((prev) => ({ ...prev, notes: val }))}
        onClose={() => setRevisionModal({ open: false, question: null, notes: '', submitting: false })}
        onConfirm={() => void confirmRevisionRequest()}
      />

      {/* MODAL: PINDAH MASSAL KE KOTAK REVISI */}
      <BulkRevisionModal
        open={bulkRevisionModal.open}
        selectedCount={selectedVisibleQuestions.length}
        notes={bulkRevisionModal.notes}
        submitting={bulkRevisionModal.submitting}
        onNotesChange={(val) => setBulkRevisionModal((prev) => ({ ...prev, notes: val }))}
        onClose={() => setBulkRevisionModal({ open: false, notes: '', submitting: false })}
        onConfirm={() => void confirmBulkRevision()}
      />
    </div>
  );
}

export default function ControlCenterPage() {
  return (
    <React.Suspense fallback={<div className="control-empty">Loading control center…</div>}>
      <ControlCenterContent />
    </React.Suspense>
  );
}
