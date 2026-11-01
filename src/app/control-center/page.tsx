'use client';

import * as React from 'react';
import type { FormEvent } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { api, CurrentMember, RevenueSummary, signInUrl } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { type DataTableFeatures } from '@/components/ui/data-table-features';
import { ComboboxSelect } from '@/components/ui/combobox';
import { ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';

export type Section = 'tryouts' | 'pricing' | 'users' | 'articles' | 'careers' | 'revenue';

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
  role: 'USER' | 'ADMIN';
  target: string | null;
  tokenBalance: number;
  createdAt: string;
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
  { id: 'pricing', label: 'Pricing' },
  { id: 'users', label: 'Users' },
  { id: 'articles', label: 'Articles' },
  { id: 'careers', label: 'Careers' },
  { id: 'revenue', label: 'Revenue' },
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
const userColHelper = createColumnHelper<DataTableFeatures, User>();
const articleColHelper = createColumnHelper<DataTableFeatures, Article>();
const careerColHelper = createColumnHelper<DataTableFeatures, CareerApplication>();

export default function ControlCenterPage() {
  const [section, setSection] = React.useState<Section>('tryouts');
  const [member, setMember] = React.useState<CurrentMember | null>(() => api.getCached<CurrentMember>('/team/me'));
  const [tryouts, setTryouts] = React.useState<Tryout[]>(() => api.getCached<Tryout[]>('/team/control-center/tryouts') ?? []);
  const [packages, setPackages] = React.useState<Package[]>(() => api.getCached<Package[]>('/team/control-center/packages') ?? []);
  const [users, setUsers] = React.useState<User[]>([]);
  const [articles, setArticles] = React.useState<Article[]>(() => api.getCached<Article[]>('/team/control-center/articles') ?? []);
  const [applications, setApplications] = React.useState<CareerApplication[]>([]);
  const [summary, setSummary] = React.useState<RevenueSummary | null>(() => api.getCached<RevenueSummary>('/team/control-center/revenue'));
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');

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

  const loadSection = React.useCallback(async (target: Section, query = '', force = false) => {
    const cachedUrl = target === 'tryouts' ? '/team/control-center/tryouts'
      : target === 'pricing' ? '/team/control-center/packages'
      : target === 'articles' ? '/team/control-center/articles'
      : target === 'revenue' ? '/team/control-center/revenue'
      : '';
    if (!cachedUrl || !api.getCached(cachedUrl)) {
      setLoading(true);
    }
    setError('');
    try {
      if (target === 'tryouts') setTryouts(await api.get<Tryout[]>('/team/control-center/tryouts', { force }));
      if (target === 'pricing') setPackages(await api.get<Package[]>('/team/control-center/packages', { force }));
      if (target === 'users') setUsers(await api.get<User[]>(`/team/control-center/users${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'articles') setArticles(await api.get<Article[]>(`/team/control-center/articles${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'careers') setApplications(await api.get<CareerApplication[]>(`/team/control-center/careers/applications${query ? `?search=${encodeURIComponent(query)}` : ''}`, { force }));
      if (target === 'revenue') setSummary(await api.get<RevenueSummary>('/team/control-center/revenue', { force }));
    } catch (cause) {
      const message = errorMessage(cause);
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void api.get<CurrentMember>('/team/me').then(setMember).catch((cause: unknown) => {
      if (errorMessage(cause) === 'SESSION_EXPIRED') window.location.assign(signInUrl());
    });
  }, []);

  React.useEffect(() => {
    void loadSection(section);
  }, [section, loadSection]);

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
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="control-row-actions">
          <button
            type="button"
            className="control-text-button"
            onClick={() => editTryout(row.original)}
          >
            Edit
          </button>
          <button
            type="button"
            className="control-text-button control-delete-button"
            onClick={() => void deleteTryoutItem(row.original)}
            disabled={deletingId === row.original.id}
            aria-label={`Delete tryout ${row.original.title}`}
            title="Delete tryout"
          >
            <Trash2 aria-hidden="true" /> {deletingId === row.original.id ? 'Deleting…' : 'Delete'}
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
    packageColHelper.accessor('paymentCount', {
      header: 'Purchases',
      cell: ({ getValue }) => <span>{getValue() ?? '—'}</span>,
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
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="control-row-actions">
          <button
            type="button"
            className="control-text-button"
            onClick={() => editPackage(row.original)}
          >
            Edit
          </button>
          <button
            type="button"
            className="control-text-button control-delete-button"
            onClick={() => void deletePackageItem(row.original)}
            disabled={deletingId === row.original.id}
            aria-label={`Delete package ${row.original.name}`}
            title={row.original.paymentCount ? 'Has payment history; deactivate it instead' : 'Delete package'}
          >
            <Trash2 aria-hidden="true" /> {deletingId === row.original.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    }),
  ], [deletingId, editingPackage]);

  // TANSTACK TABLE COLUMNS FOR USERS
  const userColumns = React.useMemo(() => [
    userColHelper.accessor('name', {
      header: 'User',
      cell: ({ row }) => (
        <div>
          <strong>{row.original.name}</strong>
          <small className="block text-[var(--muted-fg)]">{row.original.email}</small>
        </div>
      ),
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
          triggerClassName="h-7 text-xs w-[100px]"
        />
      ),
    }),
    userColHelper.accessor('target', {
      header: 'Target',
      cell: ({ getValue }) => <span>{getValue() || 'Not set'}</span>,
    }),
    userColHelper.accessor('tokenBalance', {
      header: 'Coins',
      cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
    }),
    userColHelper.display({
      id: 'accessNotes',
      header: '',
      cell: ({ row }) =>
        member?.role !== 'SYSTEM_OWNER' && row.original.role !== 'USER' ? (
          <span className="control-muted text-xs">Owner managed</span>
        ) : null,
    }),
  ], [member]);

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
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="button button-secondary h-7 px-2 text-xs flex items-center gap-1"
            onClick={() => setPreviewArticle(row.original)}
            title="Preview article"
          >
            <Eye className="h-3 w-3" /> Preview
          </button>
          <button
            type="button"
            className="button button-secondary h-7 px-2 text-xs flex items-center gap-1"
            onClick={() => editArticleItem(row.original)}
            title="Edit article"
          >
            <Edit className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            className="button button-secondary h-7 px-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            onClick={() => void deleteArticleItem(row.original)}
            title="Delete article"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    }),
  ], []);

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
        <div className="text-right">
          <button
            type="button"
            className="button button-secondary h-7 px-3 text-xs font-semibold inline-flex items-center gap-1"
            onClick={() => openApplicantModal(row.original)}
          >
            View details <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      ),
    }),
  ], []);

  const maxRevenue = Math.max(1, ...(summary?.monthlyRevenue.map(({ revenue }) => revenue) ?? []));

  return (
    <div className="page-content control-center-page">
      <div className="page-heading">
        <div>
          <h1>Control Center</h1>
          <p className="page-subtitle">Manage Jitu services, content, and applications from one workspace.</p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => { setNotice(''); void loadSection(section, search, true); }}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* SECTION TABS: Explicitly includes Articles */}
      <nav className="control-tabs" aria-label="Control Center sections">
        {sections.map((item) => (
          <button
            className={`control-tab ${section === item.id ? 'is-active' : ''}`}
            type="button"
            key={item.id}
            onClick={() => {
              setSection(item.id);
              setSearch('');
              setError('');
              setNotice('');
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <div className="inline-message error" role="alert">{error}</div>}
      {notice && <div className="inline-message control-success" role="status">{notice}</div>}

      {(section === 'users' || section === 'careers' || section === 'articles') && (
        <form className="control-search" onSubmit={submitSearch}>
          <input
            className="field-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              section === 'users'
                ? 'Search users by name or email'
                : section === 'careers'
                ? 'Search applicants by name, email, university, or position'
                : 'Search articles by title, category, or author'
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

      {/* SECTION 6: REVENUE */}
      {section === 'revenue' && (
        <section className="control-panel" aria-labelledby="revenue-heading">
          <div className="section-heading control-panel-heading">
            <div>
              <h2 id="revenue-heading">Revenue overview</h2>
              <p>Confirmed and pending payments recorded by Jitu.</p>
            </div>
          </div>
          {!loading && summary && !summary.configured && (
            <div className="inline-message revenue-source-notice" role="status">
              <div>
                <strong>Payment source is not connected</strong>
                <p>Add a read-only PostgreSQL connection for Jitu to <code>JITU_PURCHASES_DATABASE_URL</code> in the backend environment.</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="revenue-metrics" aria-label="Loading revenue summary">
              {[1, 2, 3].map((item) => (
                <div className="loading-skeleton" key={item} />
              ))}
            </div>
          ) : (
            summary && (
              <>
                <div className="revenue-metrics">
                  <article className="revenue-metric">
                    <span>Total confirmed revenue</span>
                    <strong>{summary.configured ? currency.format(summary.totalRevenue) : '—'}</strong>
                    <small>Total payments with confirmed status</small>
                  </article>
                  <article className="revenue-metric">
                    <span>Successful payments</span>
                    <strong>{summary.configured ? summary.confirmedPayments.toLocaleString('en-US') : '—'}</strong>
                    <small>Transactions with confirmed status</small>
                  </article>
                  <article className="revenue-metric">
                    <span>Pending payments</span>
                    <strong>{summary.configured ? summary.pendingPayments.toLocaleString('en-US') : '—'}</strong>
                    <small>Transactions with pending status</small>
                  </article>
                </div>
                <section className="revenue-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Monthly revenue</h2>
                      <p>Last 12 months, based on the amount recorded at the time of payment.</p>
                    </div>
                  </div>
                  {!summary.configured ? (
                    <div className="revenue-empty">The chart will appear once a payment source is connected.</div>
                  ) : summary.confirmedPayments === 0 ? (
                    <div className="revenue-empty">No confirmed payments yet.</div>
                  ) : (
                    <div className="revenue-chart" role="img" aria-label="Confirmed revenue by month over the last 12 months">
                      {summary.monthlyRevenue.map(({ month, revenue, confirmedPayments }) => (
                        <div
                          className="revenue-chart-month"
                          key={month}
                          title={`${formatMonth(month)} · ${currency.format(revenue)} · ${confirmedPayments} payments`}
                        >
                          <div className="revenue-chart-bar-area">
                            <span
                              className="revenue-chart-bar"
                              style={{ height: `${revenue ? Math.max(5, (revenue / maxRevenue) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="revenue-chart-label">{formatMonth(month)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )
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
    </div>
  );
}
