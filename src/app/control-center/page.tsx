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
} from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCartoonAvatarUrl } from '@/lib/avatar';

export type Section = 'tryouts' | 'pricing' | 'vouchers' | 'discounts' | 'users' | 'articles' | 'careers' | 'payments' | 'questions' | 'curriculum';

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
  isPublic: boolean;
  referralCode: string | null;
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
  subtopicId?: string | null;
  subtopicTitle?: string | null;
  topicTitle?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'COMPLEX_MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
  target: 'DRAFT' | 'FOR_TRYOUT' | 'FOR_PRACTICE';
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
  subtopicId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  target: 'DRAFT' | 'FOR_TRYOUT' | 'FOR_PRACTICE';
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
  subtopicId: '',
  difficulty: 'MEDIUM',
  type: 'MULTIPLE_CHOICE',
  target: 'DRAFT', // 'DRAFT' (Unpublish dulu), 'FOR_TRYOUT', 'FOR_PRACTICE'
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
    { stepNumber: 1, category: 'IDENTIFIKASI', title: 'Analisis Informasi & Variabel', content: '' },
    { stepNumber: 2, category: 'EKSEKUSI', title: 'Langkah Perhitungan', content: '' },
    { stepNumber: 3, category: 'KESIMPULAN', title: 'Kunci Jawaban Akhir', content: '' },
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

const BADGE_STYLES = [
  { id: 'RED_FIRE', label: 'Flame Red', icon: Flame, className: 'discount-badge-red' },
  { id: 'GOLD_PREMIUM', label: 'Luxury Gold', icon: Crown, className: 'discount-badge-gold' },
  { id: 'EMERALD_SAVE', label: 'Emerald Save', icon: Sparkles, className: 'discount-badge-emerald' },
  { id: 'CYAN_ELECTRIC', label: 'Neon Cyan', icon: Zap, className: 'discount-badge-cyan' },
  { id: 'PURPLE_ROYAL', label: 'Royal Purple', icon: Tag, className: 'discount-badge-purple' },
];

function getBadgeClass(style: string) {
  const match = BADGE_STYLES.find((s) => s.id === style);
  return match ? match.className : 'discount-badge-red';
}

function getBadgeIcon(style: string) {
  const match = BADGE_STYLES.find((s) => s.id === style);
  return match ? match.icon : Flame;
}

function ControlCenterContent() {
  const searchParams = useSearchParams();
  const urlSec = searchParams?.get('section') as Section | null;
  const [section, setSection] = React.useState<Section>(() => {
    if (urlSec && ['tryouts', 'pricing', 'vouchers', 'discounts', 'users', 'articles', 'careers', 'payments', 'questions', 'curriculum'].includes(urlSec)) {
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
  const [discounts, setDiscounts] = React.useState<Discount[]>(() => api.getCached<Discount[]>('/team/control-center/discounts') ?? []);
  const [discountForm, setDiscountForm] = React.useState<DiscountForm>(initialDiscountForm);
  const [discountFormOpen, setDiscountFormOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
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
  const [previewTab, setPreviewTab] = React.useState<'shop' | 'landing'>('shop');

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

  // Question Creation Method & Prompt Engineering State
  const [createMethodModalOpen, setCreateMethodModalOpen] = React.useState(false);
  const [createMethodView, setCreateMethodView] = React.useState<'SELECT' | 'IMPORT_JSON'>('SELECT');
  const [isPromptAdjusterOpen, setIsPromptAdjusterOpen] = React.useState(false);
  const [importingBulk, setImportingBulk] = React.useState(false);

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
      ? 'Campuran Berimbang Resmi (20% Mudah, 50% Sedang, 30% Sulit HOTS)'
      : 'Sedang (Standar Resmi UTBK SNBT BPPP Kemendikbudristek)';

    const passageInstruction = promptIncludePassage
      ? '- Untuk subtes berbasis literasi/bahasa (PBM, PPU, LBI, LBE) atau soal kontekstual naratif, cantumkan wacana/stimulus bermutu pada field "narration".'
      : '- Soal dibuat langsung fokus pertanyaan (kosongkan string "narration" jika tidak memerlukan teks wacana panjang).';

    const trickInstruction = promptIncludeTricks
      ? '- Pada bagian "solution", WAJIB cantumkan "keyFormula" (teorema/konsep inti), "quickTrick" (metode cepat / trik 30-45 detik yang taktis), serta 3 "steps" terstruktur (Identifikasi Variabel, Eksekusi Perhitungan, dan Kesimpulan Kunci).'
      : '- Pada bagian "solution", sertakan langkah penjelasan bertahap yang sistematis dan mudah dipahami siswa.';

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

    return `Kamu adalah Chief Assessment Specialist & Lead Author Tim Penyusun Soal Seleksi Masuk PTN (UTBK SNBT Kemendikbudristek BPPP) nomor 1 di Indonesia dengan reputasi perumusan soal HOTS yang presisi, valid, dan bebas multitafsir.

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
${passageInstruction}
${trickInstruction}

${typeSpecificRules}

PRINSIP KOGNITIF & FORMAT MENJAWAB:
- Siswa tidak boleh dirugikan akibat format jawaban; format isian harus sangat jelas sehingga tidak ada kebingungan antara angka desimal vs bilangan bulat atau penggunaan satuan.
- Soal harus menguji daya nalar dan pemecahan masalah (Problem Solving), bukan sekadar mengingat rumus tanpa pemahaman konsep.

FORMAT KELUARAN (STRICT JSON ONLY):
Hasilkan HANYA output berupa JSON murni (array of objects jika > 1 soal, atau single object jika 1 soal) tanpa teks pengantar, tanpa penjelasan di luar JSON, dan tanpa code fence markdown.

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
      "keyFormula": "Konsep inti atau rumus pokok yang digunakan",
      "quickTrick": "Trik taktis eliminasi opsi atau cara cepat 30-45 detik",
      "staticExplanation": "Rangkuman kesimpulan jawaban akhir",
      "steps": [
        { "stepNumber": 1, "category": "Identifikasi", "title": "Memahami Informasi & Variabel", "content": "Uraian identifikasi variabel dan kondisi soal..." },
        { "stepNumber": 2, "category": "Eksekusi", "title": "Langkah Perhitungan Sistematis", "content": "Uraian perhitungan step-by-step hingga solusi ditemukan..." },
        { "stepNumber": 3, "category": "Kesimpulan", "title": "Kunci Jawaban Akhir", "content": "Pernyataan kesimpulan jawaban akhir secara tegas..." }
      ]
    }
  }
${totalPromptCount > 1 ? ']' : ''}`;
  }, [activeSubtestEntries, totalPromptCount, promptDifficulty, promptQuestionType, selectedSubtopicMeta, promptCustomTopic, promptIncludePassage, promptIncludeTricks]);

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
    filters?: { subtest?: string; target?: string; status?: string }
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
        const queryParams = new URLSearchParams();
        if (query) queryParams.set('search', query);
        if (activeSubtest && activeSubtest !== 'ALL') queryParams.set('subtest', activeSubtest);
        if (activeTarget && activeTarget !== 'ALL') queryParams.set('target', activeTarget);
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const [qRes, topRes] = await Promise.all([
          api.get<QuestionItem[]>(`/team/control-center/questions${qs}`, { force }),
          api.get<TopicItem[]>('/team/control-center/topics', { force })
        ]);
        setQuestions(qRes);
        setTopics(topRes);
      }
      if (target === 'curriculum') {
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
  }, [filterSubtest, filterTarget, paymentStatusFilter]);

  React.useEffect(() => {
    if (urlSec && ['tryouts', 'pricing', 'vouchers', 'discounts', 'users', 'articles', 'careers', 'payments', 'questions', 'curriculum'].includes(urlSec)) {
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

    // Auto-check if short answer question has format guidance
    let finalContent = questionForm.content.trim();
    if (isShort && !finalContent.includes('[PETUNJUK FORMAT')) {
      finalContent += '\n\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]';
    }

    const body = {
      subtest: questionForm.subtest,
      subtopicId: questionForm.subtopicId || null,
      difficulty: questionForm.difficulty,
      type: isShort ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
      target: questionForm.target,
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
      const successMessage = editingQuestion ? 'Question updated.' : 'Question created.';
      setQuestionForm(initialQuestionForm);
      setEditingQuestion(null);
      setQuestionFormOpen(false);
      await loadSection('questions', '', true);
      setNotice(successMessage);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestionItem(item: QuestionItem) {
    if (!window.confirm(`Delete question #${item.id.slice(0, 8)}? This action cannot be undone.`)) return;
    setDeletingId(item.id); setError(''); setNotice('');
    try {
      await api.delete(`/team/control-center/questions/${encodeURIComponent(item.id)}`);
      if (editingQuestion === item.id) {
        setQuestionForm(initialQuestionForm);
        setEditingQuestion(null);
        setQuestionFormOpen(false);
      }
      setQuestions((prev) => prev.filter((q) => q.id !== item.id));
      setNotice('Question deleted.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDeletingId(null);
    }
  }

  function mapAiJsonToRequestBody(parsed: any) {
    const subtestMap: Record<string, string> = {
      PENALARAN_MATEMATIKA: 'PENALARAN_MATEMATIKA',
      PENALARAN_UMUM: 'PENALARAN_UMUM',
      PEMAHAMAN_BACAAN_MENULIS: 'PEMAHAMAN_BACAAN_MENULIS',
      PENGETAHUAN_KUANTITATIF: 'PENGETAHUAN_KUANTITATIF',
      PENGETAHUAN_PEMAHAMAN_UMUM: 'PENGETAHUAN_PEMAHAMAN_UMUM',
      LITERASI_INDONESIA: 'LITERASI_INDONESIA',
      LITERASI_BAHASA_INDONESIA: 'LITERASI_INDONESIA',
      LITERASI_INGGRIS: 'LITERASI_INGGRIS',
      LITERASI_BAHASA_INGGRIS: 'LITERASI_INGGRIS',
    };
    const rawSubtest = String(parsed.subtest || 'PENALARAN_MATEMATIKA').toUpperCase();
    const mappedSubtest = subtestMap[rawSubtest] || rawSubtest;

    let matchedSubtopicId: string | null = null;
    if (parsed.subtopic) {
      const needle = String(parsed.subtopic).toLowerCase();
      const found = topics
        .flatMap((t) => t.subtopics)
        .find((s) => s.title.toLowerCase().includes(needle) || needle.includes(s.title.toLowerCase()));
      if (found) matchedSubtopicId = found.id;
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
    const rawSteps = Array.isArray(sol.steps) ? sol.steps : [];
    const solSteps = rawSteps.length > 0
      ? rawSteps.map((s: any, i: number) => ({
          stepNumber: i + 1,
          category: s.category || `Langkah ${i + 1}`,
          title: String(s.title || '').trim(),
          content: String(s.content || '').trim(),
        }))
      : [];

    const diff = String(parsed.difficulty || 'MEDIUM').toUpperCase();
    const validDiff = (diff === 'EASY' || diff === 'HARD') ? diff : 'MEDIUM';

    const tgt = String(parsed.target || 'FOR_PRACTICE').toUpperCase();
    const validTarget = (tgt === 'DRAFT' || tgt === 'FOR_TRYOUT') ? tgt : 'FOR_PRACTICE';

    let content = String(parsed.content || '').trim();
    const correctAnswer = parsed.correctAnswer !== undefined && parsed.correctAnswer !== null ? String(parsed.correctAnswer).trim() : '';

    if (isShortAnswer && !content.includes('[PETUNJUK FORMAT')) {
      content += '\n\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]';
    }

    return {
      subtest: mappedSubtest,
      subtopicId: matchedSubtopicId,
      difficulty: validDiff,
      type: questionType,
      target: validTarget,
      narration: parsed.narration ? String(parsed.narration).trim() : null,
      content,
      imageUrl: parsed.imageUrl ? String(parsed.imageUrl).trim() : null,
      points: Number(parsed.points) || 1,
      correctAnswer: isShortAnswer ? correctAnswer : null,
      options: isShortAnswer ? [] : opts,
      keyFormula: sol.keyFormula ? String(sol.keyFormula).trim() : null,
      quickTrick: sol.quickTrick ? String(sol.quickTrick).trim() : null,
      staticExplanation: sol.staticExplanation ? String(sol.staticExplanation).trim() : null,
      solutionSteps: solSteps,
    };
  }

  function applyAiJson() {
    try {
      let parsed = JSON.parse(aiJsonInput.trim());
      if (Array.isArray(parsed)) parsed = parsed[0];
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format JSON tidak valid.');
      }

      const body = mapAiJsonToRequestBody(parsed);

      setQuestionForm({
        subtest: body.subtest,
        subtopicId: body.subtopicId || '',
        difficulty: body.difficulty as any,
        type: body.type as any,
        target: body.target as any,
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
      setAiImportOpen(false);
      setCreateMethodModalOpen(false);
      setQuestionFormOpen(true);
      setNotice('Soal dari AI berhasil diterapkan ke form! Silakan periksa dan simpan.');
    } catch (err: any) {
      setError(`Gagal membaca JSON AI: ${err.message || 'Format tidak valid'}`);
    }
  }

  async function bulkImportQuestions() {
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
      for (const item of parsed) {
        const body = mapAiJsonToRequestBody(item);
        await api.post('/team/control-center/questions', body);
        successCount++;
      }
      setAiJsonInput('');
      setCreateMethodModalOpen(false);
      await loadSection('questions', '', true);
      setNotice(`Berhasil mengimpor ${successCount} soal ke Bank Soal!`);
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
      ? item.solution.steps.map((s) => ({ stepNumber: s.stepNumber, category: s.category || '', title: s.title, content: s.content }))
      : initialQuestionForm.solutionSteps;

    setQuestionForm({
      subtest: item.subtest,
      subtopicId: item.subtopicId || '',
      difficulty: item.difficulty,
      type: isShort ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
      target: item.target,
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

  async function updateUserRole(item: User, role: User['role']) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/users/${item.id}`, { role });
      await loadSection('users', search); setNotice(`Access updated for ${item.email}.`);
    } catch (cause) { setError(errorMessage(cause)); }
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
      cell: ({ row }) => (
        <div>
          <strong>{row.original.title}</strong>
          <small className="block text-[var(--muted-fg)]">
            #{row.original.code} · {row.original.isPublic ? 'Public' : 'Private'}
          </small>
        </div>
      ),
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
      cell: ({ row }) => (
        <div className="table-action-group">
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
      ),
    }),
  ], [deletingId, editingTryout]);

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
    userColHelper.accessor('role', {
      header: 'Jitu Role',
      cell: ({ row }) => (
        <ComboboxSelect
          value={row.original.role}
          onValueChange={(newRole) => void updateUserRole(row.original, newRole as User['role'])}
          disabled={member?.role !== 'SYSTEM_OWNER'}
          options={[
            { label: 'User', value: 'USER' },
            { label: 'Admin', value: 'ADMIN' },
          ]}
          triggerClassName="h-7 text-xs w-[95px]"
        />
      ),
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
        const isTargetOwner = u.role === 'ADMIN' && member?.role !== 'SYSTEM_OWNER';
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
              disabled={isSelf || isTargetOwner || banningUserId === u.id}
              title={u.isBanned ? 'Unban user' : 'Ban user'}
            >
              <Ban className="action-icon" />
              {banningUserId === u.id ? '...' : u.isBanned ? 'Unban' : 'Ban'}
            </button>
            <button
              type="button"
              className="table-action-btn table-action-btn-danger"
              onClick={() => void deleteUserItem(u)}
              disabled={isSelf || isTargetOwner || deletingUserId === u.id}
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

  // TANSTACK TABLE COLUMNS FOR QUESTIONS
  const questionColumns = React.useMemo(() => [
    questionColHelper.accessor('content', {
      header: 'Soal & Kurikulum',
      cell: ({ row }) => {
        const text = row.original.content || '';
        const subtestName = (row.original.subtest || '').replace(/_/g, ' ');
        const path = row.original.topicTitle
          ? `${row.original.topicTitle}${row.original.subtopicTitle ? ` › ${row.original.subtopicTitle}` : ''}`
          : '';
        return (
          <div className="question-content-cell">
            <strong className="question-content-prompt line-clamp-2" title={text}>
              {text}
            </strong>
            <div className="question-content-meta">
              <span className="question-subtest-pill">{subtestName}</span>
              {path ? <span className="question-topic-path">· {path}</span> : null}
            </div>
          </div>
        );
      },
    }),
    questionColHelper.accessor('target', {
      header: 'Status / Target',
      cell: ({ getValue }) => {
        const val = getValue();
        if (val === 'DRAFT') {
          return (
            <span className="question-status-badge question-target-draft">
              📁 Draft
            </span>
          );
        }
        if (val === 'FOR_TRYOUT') {
          return (
            <span className="question-status-badge question-target-tryout">
              🏆 Khusus Tryout
            </span>
          );
        }
        return (
          <span className="question-status-badge question-target-practice">
            🎯 Latihan (Free)
          </span>
        );
      },
    }),
    questionColHelper.accessor('type', {
      header: 'Tipe Soal',
      cell: ({ row }) => {
        const isShort = row.original.type === 'ISIAN_SINGKAT' || row.original.type === 'SHORT_ANSWER';
        if (isShort) {
          return (
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ✍️ Isian Singkat
              </span>
              {row.original.correctAnswer && (
                <span className="text-[10px] font-mono text-[var(--muted-fg)]">
                  Kunci: <strong className="text-[var(--foreground)]">{row.original.correctAnswer}</strong>
                </span>
              )}
            </div>
          );
        }
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
            🔘 Pilihan Ganda (A-E)
          </span>
        );
      },
    }),
    questionColHelper.accessor('difficulty', {
      header: 'Kesulitan',
      cell: ({ getValue }) => {
        const d = getValue();
        const diffClass =
          d === 'EASY'
            ? 'difficulty-easy'
            : d === 'MEDIUM'
            ? 'difficulty-medium'
            : 'difficulty-hard';
        return (
          <span className={`difficulty-badge ${diffClass}`}>
            {d}
          </span>
        );
      },
    }),
    questionColHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="table-action-group">
          <button
            type="button"
            className="table-action-btn"
            onClick={() => {
              setPreviewQuestion(row.original);
              setPreviewSlideIdx(0);
            }}
            title="Preview Soal & Pembahasan Interaktif"
          >
            <Eye className="action-icon" /> Preview
          </button>
          <button
            type="button"
            className="table-action-btn"
            onClick={() => editQuestionItem(row.original)}
            title="Edit Soal"
          >
            <Edit className="action-icon" /> Edit
          </button>
          <button
            type="button"
            className="table-action-btn table-action-btn-danger"
            onClick={() => void deleteQuestionItem(row.original)}
            disabled={deletingId === row.original.id}
            title="Hapus Soal"
          >
            <Trash2 className="action-icon" /> {deletingId === row.original.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    }),
  ], [deletingId]);

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

      {(section === 'users' || section === 'careers' || section === 'articles' || section === 'payments') && (
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
                : 'Search articles by title, category, or author...'
            }
            aria-label="Search"
          />
          <button className="button button-secondary" type="submit" disabled={loading}>
            Search
          </button>
        </form>
      )}

      {/* SECTION 1: TRYOUTS DATA TABLE */}
      {section === 'tryouts' && (
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

          {loading ? (
            <div className="control-empty">Loading tryouts…</div>
          ) : error ? null : (
            <DataTable
              columns={tryoutColumns}
              data={tryouts}
              emptyMessage="No tryouts found."
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
              <p>Kelola bank soal atomik terpadu dengan opsi Draft, Khusus Tryout, atau Bank Latihan.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setEditingQuestion(null);
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
                  onChange={(e) => {
                    const q = e.target.value;
                    setSearch(q);
                    void loadSection('questions', q, true);
                  }}
                />
              </div>

              <div className="control-filter-group">
                <span className="control-filter-label">Subtes</span>
                <ComboboxSelect
                  value={filterSubtest}
                  onValueChange={(val) => {
                    setFilterSubtest(val);
                    void loadSection('questions', search, true, { subtest: val });
                  }}
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
                <span className="control-filter-label">Status</span>
                <ComboboxSelect
                  value={filterTarget}
                  onValueChange={(val) => {
                    setFilterTarget(val);
                    void loadSection('questions', search, true, { target: val });
                  }}
                  options={[
                    { label: 'Semua Status', value: 'ALL' },
                    { label: '📁 Draft', value: 'DRAFT' },
                    { label: '🏆 Khusus Tryout', value: 'FOR_TRYOUT' },
                    { label: '🎯 Bank Latihan', value: 'FOR_PRACTICE' },
                  ]}
                  triggerClassName="min-w-[150px]"
                />
              </div>

              {(filterSubtest !== 'ALL' || filterTarget !== 'ALL' || search) && (
                <button
                  type="button"
                  className="control-filter-reset"
                  onClick={() => {
                    setFilterSubtest('ALL');
                    setFilterTarget('ALL');
                    setSearch('');
                    void loadSection('questions', '', true, { subtest: 'ALL', target: 'ALL' });
                  }}
                  title="Reset filter"
                >
                  <X className="action-icon" /> Reset
                </button>
              )}
            </div>

            <div className="control-filter-count-badge">
              <span>{questions.length}</span>
              <span>{questions.length === 1 ? 'soal' : 'soal terdaftar'}</span>
            </div>
          </div>

          {/* QUESTION CREATION / EDIT FORM */}
          {questionFormOpen && (
            <form className="control-edit-form" onSubmit={saveQuestion} style={{ maxWidth: '920px' }}>
              <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)] mb-5">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] m-0">
                    {editingQuestion ? 'Edit Soal' : 'Buat Soal Baru'}
                  </h3>
                  <p className="text-xs text-[var(--muted-fg)] m-0 mt-0.5">
                    Lengkapi stimulus, pertanyaan, opsi jawaban A-E, dan slide deck solusi.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary text-xs h-7 px-2.5 flex items-center gap-1"
                  onClick={() => setAiImportOpen(!aiImportOpen)}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Import AI
                </button>
              </div>

              {/* 1. TARGET / PUBLICATION OPTIONS */}
              <div className="mb-5 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block">
                  Status & Target Publikasi Soal <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${questionForm.target === 'DRAFT' ? 'border-zinc-400 bg-zinc-500/10' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                    <input
                      type="radio"
                      name="questionTarget"
                      checked={questionForm.target === 'DRAFT'}
                      onChange={() => setQuestionForm({ ...questionForm, target: 'DRAFT' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold">Unpublish dulu (Draft)</div>
                      <div className="text-[11px] text-[var(--muted-fg)]">Belum tayang, disimpan privat untuk editing.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${questionForm.target === 'FOR_TRYOUT' ? 'border-indigo-400 bg-indigo-500/10' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                    <input
                      type="radio"
                      name="questionTarget"
                      checked={questionForm.target === 'FOR_TRYOUT'}
                      onChange={() => setQuestionForm({ ...questionForm, target: 'FOR_TRYOUT' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-indigo-400">Khusus Tryout</div>
                      <div className="text-[11px] text-[var(--muted-fg)]">Eksklusif CBT Tryout, tidak bocor ke latihan acak.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${questionForm.target === 'FOR_PRACTICE' ? 'border-emerald-400 bg-emerald-500/10' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                    <input
                      type="radio"
                      name="questionTarget"
                      checked={questionForm.target === 'FOR_PRACTICE'}
                      onChange={() => setQuestionForm({ ...questionForm, target: 'FOR_PRACTICE' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-400">Bank Latihan (Free Set)</div>
                      <div className="text-[11px] text-[var(--muted-fg)]">Bebas diakses di bank latihan mandiri siswa.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. TAXONOMY: SUBTEST, SUBTOPIC & DIFFICULTY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                <label className="field-label">
                  Subtes SNBT
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
                </label>

                <label className="field-label">
                  Topik & Subtopik (Kurikulum)
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
                </label>

                <label className="field-label">
                  Tingkat Kesulitan
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
                </label>
              </div>

              {/* 2.5 TIPE FORMAT SOAL (PILIHAN GANDA VS ISIAN SINGKAT) */}
              <div className="mb-5 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block">
                    Tipe Format Soal <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[var(--muted-fg)]">
                    Standar Resmi BPPP SNBT (Soal Isian Singkat khusus PM & PK)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                      questionForm.type === 'MULTIPLE_CHOICE'
                        ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                        : 'border-[var(--border)] bg-[var(--background)] hover:border-zinc-500'
                    }`}
                    onClick={() => setQuestionForm({ ...questionForm, type: 'MULTIPLE_CHOICE' })}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      questionForm.type === 'MULTIPLE_CHOICE' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'
                    }`}>
                      {questionForm.type === 'MULTIPLE_CHOICE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>🔘 Pilihan Ganda (A-E)</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted-fg)] mt-0.5">
                        5 opsi jawaban (A, B, C, D, E) dengan 1 kunci benar dan 4 distraktor miskonsepsi.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                      questionForm.type === 'SHORT_ANSWER'
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                        : 'border-[var(--border)] bg-[var(--background)] hover:border-zinc-500'
                    }`}
                    onClick={() => {
                      let content = questionForm.content;
                      if (!content.includes('[PETUNJUK FORMAT')) {
                        content = content.trim()
                          ? `${content.trim()}\n\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]`
                          : '';
                      }
                      setQuestionForm({
                        ...questionForm,
                        type: 'SHORT_ANSWER',
                        content,
                        answerFormatGuide: questionForm.answerFormatGuide || 'Bilangan Bulat Non-Negatif (0-9999)',
                      });
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      questionForm.type === 'SHORT_ANSWER' ? 'border-amber-500 bg-amber-500' : 'border-zinc-500'
                    }`}>
                      {questionForm.type === 'SHORT_ANSWER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>✍️ Isian Singkat (Standar BPPP SNBT)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Resmi BPPP</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted-fg)] mt-0.5">
                        Siswa mengisi nilai jawaban akhir langsung ke form tanpa opsi distraktor.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. QUESTION CONTENT & STIMULUS */}
              <div className="space-y-3.5 mb-5 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <label className="field-label">
                  Narasi / Teks Bacaan Stimulus (Opsional)
                  <textarea
                    className="field-input text-xs"
                    rows={2}
                    placeholder="Teks bacaan panjang, pengantar cerita, atau konteks soal..."
                    value={questionForm.narration}
                    onChange={(e) => setQuestionForm({ ...questionForm, narration: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Pertanyaan Soal (Wajib, support LaTeX e.g. $2x + 1 = 5$)
                  <textarea
                    className="field-input text-xs font-sans"
                    rows={4}
                    required
                    placeholder="Tuliskan pertanyaan inti soal di sini..."
                    value={questionForm.content}
                    onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  URL Gambar Diagram / Grafik (Opsional)
                  <input
                    className="field-input text-xs"
                    placeholder="https://... (URL gambar ilustrasi jika ada)"
                    value={questionForm.imageUrl}
                    onChange={(e) => setQuestionForm({ ...questionForm, imageUrl: e.target.value })}
                  />
                </label>
              </div>

              {/* 4. JAWABAN: PILIHAN GANDA VS ISIAN SINGKAT */}
              {questionForm.type === 'SHORT_ANSWER' ? (
                <div className="mb-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>✍️</span> Pengaturan Kunci & Format Soal Isian Singkat
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Standar Resmi BPPP SNBT
                    </span>
                  </div>

                  {/* Info Notice about Format Clarity */}
                  <div className="p-3 rounded-lg bg-[var(--card)] border border-amber-500/30 text-xs text-[var(--foreground)] leading-relaxed space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span>💡</span> Format Menjawab Jelas Meminimalisir Kesalahan Penilaian Siswa:
                    </div>
                    <p className="text-[11px] text-[var(--muted-fg)] m-0">
                      Berdasarkan regulasi resmi BPPP SNBT untuk Pengetahuan Kuantitatif dan Penalaran Matematika, jawaban siswa berupa angka definitif. Kunci jawaban di bawah wajib berupa angka murni tanpa satuan (misal tulis <code>42</code>, BUKAN <code>42 cm</code>). Gunakan tombol di bawah untuk menyisipkan instruksi format resmi ke teks pertanyaan soal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="field-label text-xs">
                        Kunci Jawaban Isian Singkat <span className="text-red-500">*</span>
                        <input
                          type="text"
                          className="field-input font-mono text-sm font-bold tracking-wider"
                          placeholder="Contoh: 42 atau 1500"
                          required={questionForm.type === 'SHORT_ANSWER'}
                          value={questionForm.correctAnswer}
                          onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                        />
                      </label>
                      <span className="text-[11px] text-[var(--muted-fg)] block mt-1">
                        Tuliskan hanya nilai angka akhir (tanpa satuan atau variabel).
                      </span>
                    </div>

                    <div>
                      <label className="field-label text-xs">
                        Pilihan Standar Format Pengisian
                        <select
                          className="field-input text-xs"
                          value={questionForm.answerFormatGuide}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestionForm({ ...questionForm, answerFormatGuide: val });
                          }}
                        >
                          <option value="Bilangan Bulat Non-Negatif (0-9999)">Bilangan Bulat Non-Negatif (0-9999) [Format Resmi BPPP SNBT]</option>
                          <option value="Bilangan Bulat Bebas (Termasuk Negatif)">Bilangan Bulat Bebas (Termasuk Negatif)</option>
                          <option value="Pecahan Sederhana (Contoh: 3/4)">Pecahan Sederhana (Contoh: 3/4)</option>
                          <option value="Format Teks Bebas / Istilah Kata">Format Teks Bebas / Istilah Kata</option>
                        </select>
                      </label>

                      <button
                        type="button"
                        className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold underline cursor-pointer"
                        onClick={() => {
                          let content = questionForm.content.trim();
                          const guideTag = `[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk ${questionForm.answerFormatGuide.toLowerCase()} tanpa satuan atau tanda baca. Contoh: ${questionForm.correctAnswer || '42'}]`;
                          if (content.includes('[PETUNJUK FORMAT:')) {
                            content = content.replace(/\[PETUNJUK FORMAT:[^\]]+\]/g, guideTag);
                          } else {
                            content = content ? `${content}\n\n${guideTag}` : guideTag;
                          }
                          setQuestionForm({ ...questionForm, content });
                        }}
                      >
                        ⚡ Sisipkan / Perbarui Petunjuk Format di Teks Soal
                      </button>
                    </div>
                  </div>

                  {/* Live Simulation of Student UI */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[11px] font-bold text-[var(--muted-fg)] uppercase tracking-wider block mb-2">
                      Simulasi Tampilan di Layar Ujian CBT Siswa:
                    </span>
                    <div className="p-3.5 rounded-lg bg-[var(--background)] border border-[var(--border)] space-y-2 max-w-[500px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--foreground)]">Jawaban Isian Singkat</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                          Standar BPPP SNBT
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted-fg)]">
                        Format Pengisian: <strong>{questionForm.answerFormatGuide}</strong>
                      </div>
                      <input
                        type="text"
                        disabled
                        className="w-full h-10 px-3 rounded bg-[var(--card)] border border-[var(--border)] font-mono text-sm text-[var(--foreground)] cursor-not-allowed opacity-80"
                        placeholder={`Ketik angka jawaban akhir (kunci resmi: ${questionForm.correctAnswer || '...'})`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* MULTIPLE CHOICE OPTIONS (A to E) */
                <div className="mb-5 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                      Pilihan Jawaban (Tandai Kunci Jawaban)
                    </span>
                    <span className="text-xs text-[var(--muted-fg)]">Pilih 1 opsi yang benar</span>
                  </div>

                  <div className="space-y-2">
                    {questionForm.options.map((opt, idx) => {
                      const letters = ['A', 'B', 'C', 'D', 'E'];
                      const letter = letters[idx] || String(idx + 1);
                      return (
                        <div
                          key={idx}
                          className={`question-option-item ${opt.isCorrect ? 'is-correct' : ''}`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer shrink-0">
                            <input
                              type="radio"
                              name="correctAnswerGroup"
                              checked={opt.isCorrect}
                              onChange={() => {
                                const newOpts = questionForm.options.map((o, i) => ({
                                  ...o,
                                  isCorrect: i === idx,
                                }));
                                setQuestionForm({ ...questionForm, options: newOpts });
                              }}
                            />
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'border border-[var(--border)] text-[var(--muted-fg)]'}`}>
                              {letter}
                            </span>
                          </label>
                          <input
                            className="field-input flex-1 text-xs"
                            placeholder={`Pilihan ${letter}...`}
                            required={questionForm.type === 'MULTIPLE_CHOICE'}
                            value={opt.content}
                            onChange={(e) => {
                              const newOpts = [...questionForm.options];
                              newOpts[idx] = { ...newOpts[idx], content: e.target.value };
                              setQuestionForm({ ...questionForm, options: newOpts });
                            }}
                          />
                          {opt.isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-400 shrink-0 pr-1">
                              ✓ Kunci
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. INTERACTIVE SOLUTION BUILDER (USP JITU) */}
              <div className="mb-5 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Solution Builder (Interactive Deck USP)
                    </span>
                    <p className="text-[11px] text-[var(--muted-fg)] mt-0.5">Potong pembahasan menjadi slide-slide presentasi interaktif.</p>
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

                {/* Rumus Kunci & Trik Jitu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="field-label">
                    <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <span>📐</span> Rumus Kunci (Key Formula)
                    </span>
                    <input
                      className="field-input text-xs"
                      placeholder="e.g. A(t) = A_0 * (1/2)^(t/T)"
                      value={questionForm.keyFormula}
                      onChange={(e) => setQuestionForm({ ...questionForm, keyFormula: e.target.value })}
                    />
                  </label>

                  <label className="field-label">
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span>💡</span> Trik Jitu 10 Detik (Quick Trick)
                    </span>
                    <input
                      className="field-input text-xs"
                      placeholder="Cara kilat / eliminasi opsi..."
                      value={questionForm.quickTrick}
                      onChange={(e) => setQuestionForm({ ...questionForm, quickTrick: e.target.value })}
                    />
                  </label>
                </div>

                {/* Steps List */}
                <div className="space-y-3 pt-1">
                  {questionForm.solutionSteps.map((step, sIdx) => (
                    <div key={sIdx} className="question-step-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">Slide {sIdx + 1}</span>
                        {questionForm.solutionSteps.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:text-red-300"
                            onClick={() => {
                              const newSteps = questionForm.solutionSteps.filter((_, i) => i !== sIdx);
                              setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
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
                          className="field-input text-xs sm:col-span-2"
                          placeholder="Judul langkah (e.g. Analisis Variabel Soal)"
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...questionForm.solutionSteps];
                            newSteps[sIdx] = { ...newSteps[sIdx], title: e.target.value };
                            setQuestionForm({ ...questionForm, solutionSteps: newSteps });
                          }}
                        />
                      </div>
                      <textarea
                        className="field-input text-xs"
                        rows={2}
                        placeholder="Penjelasan detail langkah ini (Mendukung Markdown & LaTeX rumus)..."
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

                {/* Static Explanation (Fallback) */}
                <label className="field-label pt-2 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--muted-fg)] font-medium">
                    Penjelasan Lengkap Statis (Fallback / PDF)
                  </span>
                  <textarea
                    className="field-input text-xs"
                    rows={2}
                    placeholder="Versi teks lengkap konvensional..."
                    value={questionForm.staticExplanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, staticExplanation: e.target.value })}
                  />
                </label>
              </div>

              {/* Form Actions */}
              <div className="control-form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setQuestionForm(initialQuestionForm);
                    setEditingQuestion(null);
                    setQuestionFormOpen(false);
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : editingQuestion ? 'Simpan Perubahan' : 'Buat Soal'}
                </button>
              </div>
            </form>
          )}

          {/* QUESTIONS DATA TABLE */}
          {loading ? (
            <div className="control-empty">Loading questions…</div>
          ) : (
            <DataTable
              columns={questionColumns}
              data={questions}
              emptyMessage="Belum ada soal. Klik '+ Buat Soal Baru' atau gunakan 'Import JSON (AI)'."
            />
          )}
        </section>
      )}

      {/* SECTION: CURRICULUM (MATERI & STRUKTUR KURIKULUM) */}
      {section === 'curriculum' && (() => {
        const totalSubtopicsCount = topics.reduce((acc, t) => acc + (t.subtopics?.length || 0), 0);
        const totalPatternsCount = topics.reduce(
          (acc, t) => acc + (t.subtopics || []).reduce((sAcc, s) => sAcc + (Array.isArray(s.patterns) ? s.patterns.length : 0), 0),
          0
        );
        const coveredSubtestsCount = ALL_SUBTESTS.filter((sub) => topics.some((t) => t.subtest === sub.id)).length;
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleOpenCreateTopic()}
                >
                  <Plus style={{ width: 14, height: 14 }} />
                  <span>Tambah Materi Utama</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="revenue-metric-grid" style={{ marginBottom: '16px' }}>
              <div className="revenue-metric">
                <div className="revenue-metric-head">
                  <span>Total Materi Utama</span>
                  <span className="revenue-metric-icon">
                    <BookOpen />
                  </span>
                </div>
                <strong>{topics.length}</strong>
                <small>{coveredSubtestsCount} dari {ALL_SUBTESTS.length} subtes UTBK terisi</small>
              </div>

              <div className="revenue-metric">
                <div className="revenue-metric-head">
                  <span>Total Submateri</span>
                  <span className="revenue-metric-icon">
                    <Layers />
                  </span>
                </div>
                <strong>{totalSubtopicsCount}</strong>
                <small>Rincian bab &amp; topik bahasan</small>
              </div>

              <div className="revenue-metric">
                <div className="revenue-metric-head">
                  <span>Total Pola Soal</span>
                  <span className="revenue-metric-icon">
                    <ListChecks />
                  </span>
                </div>
                <strong>{totalPatternsCount}</strong>
                <small>Indikator &amp; variasi kisi-kisi soal</small>
              </div>

              <div className="revenue-metric">
                <div className="revenue-metric-head">
                  <span>Filter Subtes Aktif</span>
                  <span className="revenue-metric-icon">
                    <Sliders />
                  </span>
                </div>
                <strong style={{ fontSize: '18px' }}>
                  {curriculumSubtestFilter === 'ALL'
                    ? 'Semua Subtes'
                    : ALL_SUBTESTS.find((s) => s.id === curriculumSubtestFilter)?.code || curriculumSubtestFilter}
                </strong>
                <small>
                  {curriculumSubtestFilter === 'ALL'
                    ? `${filteredTopics.length} materi ditampilkan`
                    : ALL_SUBTESTS.find((s) => s.id === curriculumSubtestFilter)?.shortLabel || ''}
                </small>
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
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleOpenCreateTopic(curriculumSubtestFilter)}
                  >
                    <Plus style={{ width: 14, height: 14 }} />
                    <span>Tambah Materi Utama</span>
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
              <h2 id="vouchers-heading">Kode Referal & Voucher</h2>
              <p>Kelola program referal mitra, persentase komisi, potongan diskon pembeli, dan pantau omset serta komisi bersih secara real-time.</p>
            </div>
            <button
              className="button button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setEditingVoucher(null);
                setVoucherForm(initialVoucherForm);
                setVoucherFormOpen(true);
                setError('');
                setNotice('');
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              <span>Buat Kode Referal</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="revenue-metric-grid" style={{ marginBottom: '20px' }}>
            <div className="revenue-metric">
              <div className="revenue-metric-head">
                <span>Total Kode Referal</span>
                <span className="revenue-metric-icon">
                  <Ticket />
                </span>
              </div>
              <strong>{vouchers.length}</strong>
              <small>{vouchers.filter((v) => v.isActive).length} aktif digunakan</small>
            </div>

            <div className="revenue-metric">
              <div className="revenue-metric-head">
                <span>Total Digunakan</span>
                <span className="revenue-metric-icon">
                  <Coins />
                </span>
              </div>
              <strong>{vouchers.reduce((acc, v) => acc + (v.totalUsed || 0), 0)}x</strong>
              <small>Transaksi sukses terverifikasi</small>
            </div>

            <div className="revenue-metric">
              <div className="revenue-metric-head">
                <span>Total Omset (Revenue)</span>
                <span className="revenue-metric-icon">
                  <Wallet />
                </span>
              </div>
              <strong>
                Rp {vouchers.reduce((acc, v) => acc + (v.totalRevenue || 0), 0).toLocaleString('id-ID')}
              </strong>
              <small>Pendapatan bruto via referal</small>
            </div>

            <div className="revenue-metric">
              <div className="revenue-metric-head">
                <span>Total Komisi Mitra</span>
                <span className="revenue-metric-icon">
                  <Percent />
                </span>
              </div>
              <strong>
                Rp {vouchers.reduce((acc, v) => acc + (v.totalCommission || 0), 0).toLocaleString('id-ID')}
              </strong>
              <small>Hak komisi akun yang ditunjuk</small>
            </div>

            <div className="revenue-metric">
              <div className="revenue-metric-head">
                <span>Net Platform Revenue</span>
                <span className="revenue-metric-icon">
                  <CreditCard />
                </span>
              </div>
              <strong>
                Rp {vouchers.reduce((acc, v) => acc + (v.netRevenue || 0), 0).toLocaleString('id-ID')}
              </strong>
              <small>Pendapatan bersih setelah komisi</small>
            </div>
          </div>

          {voucherFormOpen && (
            <form className="control-edit-form" onSubmit={saveVoucher} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    {editingVoucher ? 'Edit Kode Referal' : 'Buat Kode Referal Baru'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                    Atur kode referal, persentase diskon pembeli, persentase komisi, dan tentukan akun pemilik referal.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary text-xs"
                  onClick={() => {
                    setVoucherForm(initialVoucherForm);
                    setEditingVoucher(null);
                    setVoucherFormOpen(false);
                  }}
                >
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              </div>

              <div className="control-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <label className="field-label">
                  Kode Referal (Huruf Kapital)
                  <input
                    className="field-input font-mono font-bold"
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
                    className="field-input"
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="Contoh: 20 (diskon 20% bagi pembeli)"
                    value={voucherForm.discountPercent}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountPercent: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Persentase Komisi Pemilik (%)
                  <input
                    className="field-input"
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="Contoh: 15 (komisi 15% dari omset)"
                    value={voucherForm.commissionPercent}
                    onChange={(e) => setVoucherForm({ ...voucherForm, commissionPercent: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Issued To: Pilih Akun Pemilik (Pengguna Terdaftar)
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
                    <option value="">-- Pilih Akun Siswa / Mitra Terdaftar --</option>
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
                    placeholder="Contoh: Kak Budi Ambis"
                    value={voucherForm.issuedToName}
                    onChange={(e) => setVoucherForm({ ...voucherForm, issuedToName: e.target.value, referrerName: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Issued To: Email Pemilik (Opsional)
                  <input
                    className="field-input"
                    type="email"
                    placeholder="Contoh: budi@ambisptn.com"
                    value={voucherForm.issuedToEmail}
                    onChange={(e) => setVoucherForm({ ...voucherForm, issuedToEmail: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Maksimum Potongan Diskon (IDR) - Opsional
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="Kosongkan jika tanpa batas"
                    value={voucherForm.maxDiscount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Minimal Pembelian (IDR)
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={voucherForm.minPurchase}
                    onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Batas Kuota Penggunaan - Opsional
                  <input
                    className="field-input"
                    type="number"
                    min="1"
                    placeholder="Kosongkan jika tak terbatas"
                    value={voucherForm.maxUsage}
                    onChange={(e) => setVoucherForm({ ...voucherForm, maxUsage: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Tanggal Kedaluwarsa - Opsional
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={voucherForm.expiresAt}
                    onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
                  />
                </label>

                <label className="field-label" style={{ gridColumn: '1 / -1' }}>
                  Keterangan / Deskripsi Program Referal
                  <input
                    className="field-input"
                    placeholder="Contoh: Program Referal Komisi Ambis UTBK 2026"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="control-check">
                  <input
                    type="checkbox"
                    checked={voucherForm.isActive}
                    onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                  />{' '}
                  Status Aktif (siap digunakan saat siswa checkout)
                </label>
              </div>

              <div className="control-form-actions" style={{ marginTop: '20px' }}>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setVoucherForm(initialVoucherForm);
                    setEditingVoucher(null);
                    setVoucherFormOpen(false);
                  }}
                >
                  Batal
                </button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingVoucher ? 'Simpan Perubahan' : 'Buat Kode Referal'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="control-empty">Memuat data kode referal…</div>
          ) : error ? null : vouchers.length === 0 ? (
            <div className="control-empty">
              Belum ada kode referal. Klik tombol "+ Buat Kode Referal" di atas untuk menambahkan.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="control-table">
                <thead>
                  <tr>
                    <th>Kode Referal</th>
                    <th>Diskon & Komisi</th>
                    <th>Issued To (Pemilik)</th>
                    <th>Issued By (Pembuat)</th>
                    <th style={{ textAlign: 'center' }}>Total Used</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ textAlign: 'right' }}>Total Komisi</th>
                    <th style={{ textAlign: 'right' }}>Net Platform</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => {
                    const isExpired = v.expiresAt ? new Date(v.expiresAt) < new Date() : false;
                    const isLimitReached = v.maxUsage ? v.totalUsed >= v.maxUsage : false;
                    const issuedToName = v.resolvedIssuedToName || v.issuedToName || v.referrerName || 'Umum / Promo';
                    const issuedToEmail = v.resolvedIssuedToEmail || v.issuedToEmail || '-';
                    const issuedByName = v.issuedByName || 'Admin';
                    const issuedByEmail = v.issuedByEmail || '-';

                    return (
                      <tr key={v.id}>
                        {/* 1. Kode Referal */}
                        <td>
                          <div className="cell-stack">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="referral-code-badge">
                                <Tag className="cell-accessory-icon" />
                                <span>{v.code}</span>
                              </span>
                              <button
                                type="button"
                                className="copy-mini-btn"
                                title="Salin kode"
                                onClick={() => handleCopyCode(v.code)}
                              >
                                {copiedCode === v.code ? (
                                  <Check style={{ width: 13, height: 13 }} />
                                ) : (
                                  <Copy style={{ width: 13, height: 13 }} />
                                )}
                              </button>
                            </div>
                            {v.description && (
                              <span className="cell-meta-row" style={{ marginTop: '2px' }}>
                                {v.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Diskon & Komisi */}
                        <td>
                          <div className="cell-stack">
                            <span className="cell-meta-row">
                              <Percent className="cell-accessory-icon" />
                              <span className="cell-primary">Diskon: {v.discountPercent}%</span>
                            </span>
                            <span className="cell-meta-row">
                              <Coins className="cell-accessory-icon" />
                              <span>Komisi: {v.commissionPercent}%</span>
                            </span>
                            {v.maxDiscount && (
                              <span className="cell-meta-row" style={{ fontSize: '10.5px' }}>
                                Maks. Rp {v.maxDiscount.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Issued To */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={v.resolvedIssuedToImage || getCartoonAvatarUrl(issuedToName)}
                                alt={issuedToName}
                              />
                              <AvatarFallback>
                                {issuedToName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="cell-stack" style={{ gap: '1px' }}>
                              <span className="cell-primary">{issuedToName}</span>
                              <span className="cell-meta-row">{issuedToEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Issued By */}
                        <td>
                          <div className="cell-stack" style={{ gap: '1px' }}>
                            <span className="cell-primary">{issuedByName}</span>
                            <span className="cell-meta-row">{issuedByEmail}</span>
                          </div>
                        </td>

                        {/* 5. Total Used */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="cell-stack" style={{ alignItems: 'center' }}>
                            <span className="cell-mono" style={{ fontSize: '13px' }}>
                              {v.totalUsed}x
                            </span>
                            <span className="cell-meta-row" style={{ fontSize: '10.5px' }}>
                              kuota: {v.maxUsage ? `${v.maxUsage}x` : '∞'}
                            </span>
                            {isLimitReached && (
                              <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>
                                Habis
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Total Revenue */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="cell-mono">
                            Rp {(v.totalRevenue || 0).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* 7. Total Commission */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="cell-mono">
                            Rp {(v.totalCommission || 0).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* 8. Net Platform */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="cell-mono" style={{ fontWeight: 700 }}>
                            Rp {(v.netRevenue || 0).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* 9. Status */}
                        <td>
                          {isExpired ? (
                            <span className="control-status status-pending">
                              <Clock />
                              <span>Kedaluwarsa</span>
                            </span>
                          ) : !v.isActive ? (
                            <span className="control-status status-rejected">
                              <XCircle />
                              <span>Nonaktif</span>
                            </span>
                          ) : (
                            <span className="control-status status-accepted">
                              <CheckCircle2 />
                              <span>Aktif</span>
                            </span>
                          )}
                        </td>

                        {/* 10. Aksi */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-action-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => toggleVoucherActive(v)}
                              title={v.isActive ? 'Nonaktifkan kode' : 'Aktifkan kode'}
                            >
                              {v.isActive ? 'Matikan' : 'Nyalakan'}
                            </button>
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => editVoucherItem(v)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="table-action-btn table-action-btn-danger"
                              onClick={() => deleteVoucherItem(v)}
                              disabled={deletingId === v.id}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

              <div className="discount-form-layout">
                {/* LEFT: FORM INPUTS */}
                <form onSubmit={saveDiscount} className="space-y-4">
                  {/* Campaign Name */}
                  <label className="field-label">
                    <span>Nama Kampanye Promo</span>
                    <input
                      className="field-input"
                      required
                      placeholder="e.g. Flash Sale UTBK 2026, Promo Ramadhan"
                      value={discountForm.name}
                      onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    />
                  </label>

                  {/* Type & Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="field-label">
                      <span>Tipe Diskon</span>
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
                      <span>{discountForm.type === 'PERCENTAGE' ? 'Besar Diskon (%)' : 'Besar Potongan (Rp)'}</span>
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

                  {/* Target Package */}
                  <label className="field-label">
                    <span>Attach ke Paket / Produk</span>
                    <select
                      className="field-input"
                      value={discountForm.packageId}
                      onChange={(e) => setDiscountForm({ ...discountForm, packageId: e.target.value })}
                    >
                      <option value="">Semua Paket (All Packages &amp; PTN Premium Pass)</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.tokenAmount} coin) - Rp{pkg.price.toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[var(--muted-fg)] mt-1">
                      Pilih &quot;Semua Paket&quot; agar promo berlaku global, atau pilih satu paket tertentu saja.
                    </span>
                  </label>

                  {/* Period Dates */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-[var(--foreground)]">Periode Promo (Start &amp; End Date)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="field-label text-xs">
                        <span>Waktu Mulai</span>
                        <input
                          className="field-input text-xs"
                          type="datetime-local"
                          required
                          value={discountForm.startDate}
                          onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                        />
                      </label>
                      <label className="field-label text-xs">
                        <span>Waktu Berakhir</span>
                        <input
                          className="field-input text-xs"
                          type="datetime-local"
                          required
                          value={discountForm.endDate}
                          onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                        />
                      </label>
                    </div>

                    {/* Quick duration buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                  </div>

                  {/* Badge Text & Preset Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                    <label className="field-label">
                      <span>Badge Text (Teks Stiker Promo)</span>
                      <input
                        className="field-input font-bold"
                        required
                        maxLength={24}
                        placeholder="e.g. DISKON 30%, FLASH SALE"
                        value={discountForm.badgeText}
                        onChange={(e) => setDiscountForm({ ...discountForm, badgeText: e.target.value })}
                      />
                    </label>

                    {/* Quick Badge Text Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                  </div>

                  {/* Badge Design Style Selector */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--foreground)]">Badge Design Style</span>
                    <p className="text-[11px] text-[var(--muted-fg)] m-0">Pilih palet visual badge yang siap dipasang langsung ke kartu Shop:</p>
                    <div className="style-selector-grid pt-1">
                      {BADGE_STYLES.map((style) => {
                        const IconComponent = style.icon;
                        const isSelected = discountForm.badgeStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            className={`style-selector-btn ${isSelected ? 'is-active' : ''}`}
                            onClick={() => setDiscountForm({ ...discountForm, badgeStyle: style.id })}
                          >
                            <span className={`discount-badge-base ${style.className}`}>
                              <IconComponent className="w-3 h-3" />
                              {style.label}
                            </span>
                            <span className="text-[10px] text-[var(--muted-fg)] font-medium">
                              {isSelected ? '✓ Terpilih' : 'Pilih'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Status */}
                  <label className="control-check pt-2">
                    <input
                      type="checkbox"
                      checked={discountForm.isActive}
                      onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                    />
                    <span>Aktifkan promo ini langsung saat disimpan</span>
                  </label>

                  {/* Form Actions */}
                  <div className="control-form-actions pt-2">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => {
                        setDiscountForm(initialDiscountForm);
                        setEditingDiscount(null);
                        setDiscountFormOpen(false);
                      }}
                    >
                      Batal
                    </button>
                    <button className="button button-primary" type="submit" disabled={saving}>
                      {saving ? 'Menyimpan…' : editingDiscount ? 'Simpan Perubahan' : 'Buat Promo & Pasang Badge'}
                    </button>
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
                        className={`preview-view-btn ${previewTab === 'shop' ? 'is-active' : ''}`}
                        onClick={() => setPreviewTab('shop')}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Tampilan Shop</span>
                      </button>
                      <button
                        type="button"
                        className={`preview-view-btn ${previewTab === 'landing' ? 'is-active' : ''}`}
                        onClick={() => setPreviewTab('landing')}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tampilan Landing Page</span>
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
                      <div className="space-y-6">
                        {/* 1. PTN PREMIUM PASS CARD PREVIEW */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              Preview 1: Kartu PTN Premium Pass ({previewTab === 'shop' ? 'Shop' : 'Landing Page'})
                            </span>
                            {!appliesToPass && (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                (Hanya berlaku di paket terpilih)
                              </span>
                            )}
                          </div>

                          <div className="pass-preview-card">
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

                            <div className="relative z-10 flex flex-col gap-5">
                              <div className="flex items-start gap-4">
                                {/* Animated Floating Golden Ticket */}
                                <div className="w-14 h-12 sm:w-16 sm:h-14 shrink-0 relative select-none animate-ticket-float transition-transform duration-300">
                                  <Image
                                    src="/icons/golden-pass-ticket.png"
                                    alt="Tiket Golden Pass PTN Premium Pass"
                                    fill
                                    className="object-contain select-none pointer-events-none drop-shadow-md"
                                    priority
                                  />
                                </div>

                                <div className="space-y-1.5 flex-1">
                                  {/* Badges: Campaign Name + Selected Promo Badge */}
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-yellow-300 border border-yellow-300/30 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                                      <Sparkles className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                                      {campaignTitle}
                                    </span>

                                    <span className={`discount-badge-base ${getBadgeClass(discountForm.badgeStyle)}`}>
                                      <ActiveIcon className="w-3.5 h-3.5" />
                                      {discountForm.badgeText || 'PROMO DISKON'}
                                    </span>

                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFD13B] text-black text-[10px] font-black uppercase tracking-wider">
                                      <Sparkles className="w-3 h-3 fill-black" />
                                      Rekomendasi
                                    </span>
                                  </div>

                                  <h3 className="text-[24px] sm:text-[28px] font-black text-white tracking-tight leading-tight m-0 flex flex-wrap items-center gap-2">
                                    <span>PTN</span>
                                    <span className="bg-[#FFD13B] text-black px-2 py-0.5 rounded-xs inline-block shadow-xs">
                                      PREMIUM PASS
                                    </span>
                                  </h3>
                                </div>
                              </div>

                              {/* 3 Checkmark Benefits */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-400/25">
                                <div className="flex items-center gap-2 text-[12px] text-blue-100 font-medium">
                                  <div className="w-4 h-4 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span>Bebas akses pembahasan tanpa coins</span>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-blue-100 font-medium">
                                  <div className="w-4 h-4 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span>Materi & latihan soal unlimited</span>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-blue-100 font-medium">
                                  <div className="w-4 h-4 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span>Analisis skor IRT & ranking nasional</span>
                                </div>
                              </div>

                              {/* Price Block & CTA */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-blue-400/30">
                                <div>
                                  {appliesToPass && passSavings > 0 ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs line-through text-blue-200/80 font-bold tabular-nums">
                                          Rp{passBasePrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-[10px] font-black text-yellow-300 bg-yellow-400/20 px-1.5 py-0.5 rounded">
                                          Hemat Rp{passSavings.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-[28px] font-black text-white leading-none tabular-nums">
                                          Rp{passDiscountedPrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs font-bold text-blue-200">/bulan</span>
                                      </div>
                                      <div className="text-[11px] text-blue-200/80 font-medium">
                                        Akses penuh tanpa batas
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-[28px] font-black text-white leading-none tabular-nums">
                                          Rp{passBasePrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs font-bold text-blue-200">/bulan</span>
                                      </div>
                                      <div className="text-[11px] text-blue-200/80 font-medium">
                                        Akses penuh tanpa batas
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Continuous Rotating Border Beam Button */}
                                <div className="relative p-[2.5px] rounded-xl overflow-hidden shadow-lg">
                                  <div
                                    aria-hidden="true"
                                    className="absolute inset-[-200%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_60%,rgba(255,255,255,0.95)_80%,#FFD13B_92%,transparent_100%)] pointer-events-none"
                                  />
                                  <button
                                    type="button"
                                    className="relative px-6 py-2.5 rounded-[10px] bg-[#FFD13B] text-black font-extrabold text-xs inline-flex items-center justify-center gap-2 pointer-events-none shadow-md"
                                  >
                                    <span>Ambil Premium Pass</span>
                                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. CARD COIN BIASA PREVIEW */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              Preview 2: Card Coin Biasa ({coinPkgTarget.tokenAmount} Coin) ({previewTab === 'shop' ? 'Shop' : 'Landing Page'})
                            </span>
                            {!appliesToCoin && (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                (Hanya berlaku di paket terpilih)
                              </span>
                            )}
                          </div>

                          {previewTab === 'shop' ? (
                            /* SHOP VIEW: Exact TokenCard layout */
                            <div className={`coin-preview-card ${appliesToCoin ? 'has-discount border-2 border-primary' : ''}`}>
                              {/* Header: Coin icon + Coin Count + Campaign chip + Attached Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center shadow-xs">
                                    🪙
                                  </div>
                                  <span className="font-bold text-[18px] text-[var(--foreground)]">
                                    {coinPkgTarget.tokenAmount} coin
                                  </span>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                    {campaignTitle}
                                  </span>
                                  <span className={`discount-badge-base ${getBadgeClass(discountForm.badgeStyle)}`}>
                                    <ActiveIcon className="w-3 h-3" />
                                    {discountForm.badgeText || 'DISKON'}
                                  </span>
                                </div>
                              </div>

                              {/* Price Block */}
                              <div>
                                {appliesToCoin && coinSavings > 0 ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs line-through text-[var(--muted-fg)] font-semibold tabular-nums">
                                        Rp{coinBasePrice.toLocaleString('id-ID')}
                                      </span>
                                      <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        Hemat Rp{coinSavings.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                    <div className="font-bold text-[28px] leading-tight tracking-[-0.02em] text-[var(--foreground)] tabular-nums">
                                      Rp{coinDiscountedPrice.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-[13px] text-[var(--muted-fg)] tabular-nums">
                                      Rp{Math.round(coinDiscountedPrice / Math.max(1, coinPkgTarget.tokenAmount)).toLocaleString('id-ID')} / tryout
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-bold text-[28px] leading-tight tracking-[-0.02em] text-[var(--foreground)] tabular-nums">
                                      Rp{coinBasePrice.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-[13px] text-[var(--muted-fg)] tabular-nums">
                                      Rp{Math.round(coinBasePrice / Math.max(1, coinPkgTarget.tokenAmount)).toLocaleString('id-ID')} / tryout
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Features List */}
                              <ul className="space-y-2 pt-3 border-t border-[var(--border)] text-[13px] text-[var(--muted-fg)]">
                                <li className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                  <span>Buka skor IRT &amp; pembahasan {coinPkgTarget.tokenAmount} tryout</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                  <span>Berlaku sampai 21 Apr 2027</span>
                                </li>
                              </ul>

                              {/* Buy Button */}
                              <button
                                type="button"
                                className="w-full py-2.5 px-3 rounded-lg bg-[var(--primary)] text-white font-bold text-xs pointer-events-none text-center shadow-xs"
                              >
                                Beli {coinPkgTarget.tokenAmount} coin
                              </button>
                            </div>
                          ) : (
                            /* LANDING PAGE VIEW: Exact QuotaPack card layout */
                            <div className="rounded-xl p-5 flex flex-col justify-between gap-5 bg-[var(--card)] border border-[var(--border)]">
                              <div className="space-y-3">
                                {/* Header: Coin Icon + Count + Campaign Badge */}
                                <div className="flex items-center justify-between gap-2 min-h-[24px]">
                                  <div className="inline-flex items-center gap-2">
                                    <span className="text-xl">🪙</span>
                                    <span className="text-[20px] font-bold text-[var(--foreground)] tabular-nums">
                                      {coinPkgTarget.tokenAmount} coin
                                    </span>
                                  </div>
                                  <span className={`discount-badge-base ${getBadgeClass(discountForm.badgeStyle)}`}>
                                    <ActiveIcon className="w-3 h-3" />
                                    {discountForm.badgeText || 'Paling hemat'}
                                  </span>
                                </div>

                                {/* Price */}
                                <div className="pt-2 border-t border-[var(--border)]">
                                  {appliesToCoin && coinSavings > 0 && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs line-through text-[var(--muted-fg)] font-medium tabular-nums">
                                        Rp{coinBasePrice.toLocaleString('id-ID')}
                                      </span>
                                      <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        Hemat Rp{coinSavings.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-[28px] font-bold text-[var(--foreground)] leading-tight tabular-nums">
                                    Rp{(appliesToCoin ? coinDiscountedPrice : coinBasePrice).toLocaleString('id-ID')}
                                  </div>
                                </div>

                                <p className="text-[13px] text-[var(--muted-fg)] leading-relaxed m-0">
                                  Paket lengkap persiapan intensif agar makin percaya diri. Termasuk kampanye {campaignTitle}.
                                </p>
                              </div>

                              <button
                                type="button"
                                className="w-full min-h-[44px] px-4 py-2.5 rounded-md text-[14px] font-semibold inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-white pointer-events-none"
                              >
                                <span>Pilih paket</span>
                                <ArrowRight className="w-4 h-4 stroke-[2]" />
                              </button>
                            </div>
                          )}
                        </div>
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
              <p>Review Jitu accounts, roles, targets, and coin balances. Only System Owners can grant Jitu Admin access.</p>
            </div>
            <span>{users.length} shown</span>
          </div>

          {loading ? (
            <div className="control-empty">Loading users…</div>
          ) : error ? null : (
            <DataTable
              columns={userColumns}
              data={users}
              emptyMessage="No users found."
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
              <>
                {/* 4 Summary Cards */}
                <div className="revenue-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <article className="revenue-metric">
                    <div className="revenue-metric-head">
                      <span>Total confirmed revenue</span>
                      <span className="revenue-metric-icon" aria-hidden="true">
                        <Wallet />
                      </span>
                    </div>
                    <strong>{currency.format(paymentSummary.totalRevenue)}</strong>
                    <small>From settled transactions</small>
                  </article>
                  <article className="revenue-metric">
                    <div className="revenue-metric-head">
                      <span>Confirmed payments</span>
                      <span className="revenue-metric-icon" aria-hidden="true">
                        <CheckCircle2 />
                      </span>
                    </div>
                    <strong>{paymentSummary.confirmedPayments.toLocaleString('en-US')}</strong>
                    <small>Completed & coins credited</small>
                  </article>
                  <article className="revenue-metric">
                    <div className="revenue-metric-head">
                      <span>Waiting / pending</span>
                      <span className="revenue-metric-icon" aria-hidden="true">
                        <Clock />
                      </span>
                    </div>
                    <strong>{paymentSummary.pendingPayments.toLocaleString('en-US')}</strong>
                    <small>Awaiting QRIS completion</small>
                  </article>
                  <article className="revenue-metric">
                    <div className="revenue-metric-head">
                      <span>Cancelled / expired</span>
                      <span className="revenue-metric-icon" aria-hidden="true">
                        <XCircle />
                      </span>
                    </div>
                    <strong>{paymentSummary.cancelledPayments.toLocaleString('en-US')}</strong>
                    <small>Cancelled by user or expired</small>
                  </article>
                </div>

                {/* Monthly Revenue & Payment Trend Graph */}
                <section className="revenue-panel">
                  <div className="section-heading">
                    <div>
                      <h2>12-Month Revenue & Activity Trend</h2>
                      <p>Monthly confirmed revenue and transaction volume over the past year.</p>
                    </div>
                  </div>

                  {paymentSummary.confirmedPayments === 0 && paymentSummary.pendingPayments === 0 ? (
                    <div className="revenue-empty">No payment transactions recorded yet.</div>
                  ) : (
                    <div
                      className="revenue-chart"
                      role="img"
                      aria-label="Payment revenue by month over the last 12 months"
                    >
                      {paymentSummary.monthlyRevenue.map((m) => {
                        const maxRevenueVal = Math.max(1, ...(paymentSummary.monthlyRevenue.map((item) => item.revenue) || [1]));
                        const barHeight = m.revenue ? Math.max(8, (m.revenue / maxRevenueVal) * 100) : 0;
                        return (
                          <div
                            className="revenue-chart-month"
                            key={m.month}
                            title={`${formatMonth(m.month)} · ${currency.format(m.revenue)} · ${m.confirmedPayments} confirmed, ${m.pendingPayments} waiting, ${m.cancelledPayments} cancelled`}
                          >
                            <div className="revenue-chart-bar-area">
                              <span
                                className="revenue-chart-bar"
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <span className="revenue-chart-label">{formatMonth(m.month)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="question-status-badge question-target-practice">
                    {previewQuestion.target}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {previewQuestion.difficulty}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    previewQuestion.type === 'ISIAN_SINGKAT' || previewQuestion.type === 'SHORT_ANSWER'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  }`}>
                    {previewQuestion.type === 'ISIAN_SINGKAT' || previewQuestion.type === 'SHORT_ANSWER' ? '✍️ Isian Singkat' : '🔘 Pilihan Ganda'}
                  </span>
                  <span className="text-xs text-[var(--muted-fg)]">
                    {previewQuestion.subtest.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="m-0 text-base font-bold">Preview Soal & Solution Deck</h3>
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

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  const toEdit = previewQuestion;
                  setPreviewQuestion(null);
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
                Tutup Preview
              </button>
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
                  <span className="user-modal-stat-label">Role</span>
                  <strong className="user-modal-stat-value">{selectedUserForModal.role}</strong>
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
                    <span>{isPromptAdjusterOpen ? 'Tutup Adjust Prompt' : '⚡ Adjust Prompt'}</span>
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
              {/* STEP 1: SELECT METHOD (JEJER KANAN KIRI / 2 COLS) */}
              {createMethodView === 'SELECT' && (
                <div className="method-selection-grid">
                  {/* CARD KIRI: MANUAL */}
                  <div
                    className="method-card method-card-manual"
                    onClick={() => {
                      setCreateMethodModalOpen(false);
                      setEditingQuestion(null);
                      setQuestionForm(initialQuestionForm);
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
                      <span>Buka Form Editor</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </div>
                  </div>

                  {/* CARD KANAN: IMPORT JSON (AI) */}
                  <div
                    className="method-card method-card-ai"
                    onClick={() => {
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
                            AI Generator
                          </span>
                        </div>
                        <p className="method-card-desc">
                          Paste data JSON hasil generate AI atau gunakan fitur Adjust Prompt untuk mengatur kisi-kisi soal sesuai kurikulum resmi.
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders style={{ width: 16, height: 16 }} /> Prompt Engineering Builder
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                          Sesuaikan parameter kisi-kisi, salin prompt, lalu jalankan di AI pilihanmu
                        </span>
                      </div>

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

                      {/* 2. Format Tipe Soal AI */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                            2. Tipe Format Soal AI
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

                      {/* 3. Tingkat Kesulitan & Fokus Materi dari Halaman Materi */}
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
                        <button
                          type="button"
                          style={{ fontSize: '12px', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                          onClick={() => setIsPromptAdjusterOpen(true)}
                        >
                          <Sliders style={{ width: 13, height: 13 }} />
                          <span>Butuh Prompt untuk AI? Klik Adjust Prompt</span>
                        </button>
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
                      <Zap style={{ width: 14, height: 14 }} />
                      <span>Terapkan ke Form Editor</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
