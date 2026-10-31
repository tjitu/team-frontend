'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, CurrentMember, Department, Project, signInUrl } from '@/lib/api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projectQuery, setProjectQuery] = useState('');
  const [appliedProjectQuery, setAppliedProjectQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const owners = useMemo(() => {
    const uniqueOwners = new Map(projects.map(({ createdBy }) => [createdBy.id, createdBy]));
    return [...uniqueOwners.values()].sort((left, right) => left.name.localeCompare(right.name, 'en'));
  }, [projects]);
  const visibleProjects = useMemo(() => {
    const normalizedQuery = appliedProjectQuery.trim().toLocaleLowerCase();
    return projects.filter((project) =>
      (!departmentFilter || project.departmentId === departmentFilter) &&
      (!ownerFilter || project.createdBy.id === ownerFilter) &&
      (!normalizedQuery || `${project.name} ${project.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [projects, departmentFilter, ownerFilter, appliedProjectQuery]);
  const hasProjectFilters = Boolean(appliedProjectQuery || departmentFilter || ownerFilter);

  async function load() {
    setLoading(true);
    try {
      const [projectList, currentMember, departmentList] = await Promise.all([
        api.get<Project[]>('/team/projects'),
        api.get<CurrentMember>('/team/me'),
        api.get<Department[]>('/team/departments'),
      ]);
      setProjects(projectList);
      setMember(currentMember);
      setDepartments(departmentList.filter((department) => department.isActive));
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load workspace data.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    try {
      await api.post<Project>('/team/projects', {
        name: String(data.get('name') ?? '').trim(),
        description: String(data.get('description') ?? '').trim(),
        departmentId: String(data.get('departmentId') ?? ''),
        startsAt: data.get('startsAt') ? new Date(`${String(data.get('startsAt'))}T00:00:00.000Z`).toISOString() : undefined,
        endsAt: data.get('endsAt') ? new Date(`${String(data.get('endsAt'))}T00:00:00.000Z`).toISOString() : undefined,
      });
      setCreateOpen(false);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Project overview</h1>
          <p className="page-subtitle">{member?.name ? `Welcome, ${member.name.split(' ')[0]}. ` : ''}Track active projects and team progress.</p>
        </div>
        {member && <button className="button button-primary" onClick={() => setCreateOpen(true)}><span className="button-symbol" aria-hidden="true">+</span>New project</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Reload</button></div>}
      <div className="section-heading project-overview-heading">
        <div><h2>Active projects</h2><p>Select a project to view its tasks and team activity.</p></div>
        {!loading && <span className="section-count">{visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}</span>}
      </div>

      {!loading && projects.length > 0 && <form className="project-list-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedProjectQuery(projectQuery); }}>
        <input className="search-input" value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Search projects…" aria-label="Search projects" />
        <label><span className="sr-only">Filter department</span><select className="filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="">All departments</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
        <label><span className="sr-only">Filter project owner</span><select className="filter-select" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="">All owners</option>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}</select></label>
        <button className="button button-secondary" type="submit">Search</button>
        {hasProjectFilters && <button className="button button-quiet" type="button" onClick={() => { setProjectQuery(''); setAppliedProjectQuery(''); setDepartmentFilter(''); setOwnerFilter(''); }}>Reset</button>}
      </form>}

      {loading ? (
        <div className="project-grid" aria-label="Loading projects">
          {[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}
        </div>
      ) : visibleProjects.length > 0 ? (
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <div className="project-card-top">
                <span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span>
                <span className="project-card-open">Open project <span aria-hidden="true">↗</span></span>
              </div>
              <h3 title={project.name}>{project.name}</h3>
              <p className="project-description">{project.description || 'No description for this project yet.'}</p>
              <p className="project-card-metadata">{project.department.name} · Owner: {project.createdBy.name}</p>
              <div className="project-card-footer"><span className="project-member-summary"><span className="mini-people-icon" aria-hidden="true" />{project._count?.members ?? 0} {project._count?.members === 1 ? 'member' : 'members'}</span><span>{project.startsAt || project.endsAt ? `${project.startsAt ? formatDate(project.startsAt) : '—'} – ${project.endsAt ? formatDate(project.endsAt) : '—'}` : `Updated ${formatDate(project.updatedAt)}`}</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <div>
            <div className="empty-state-icon" aria-hidden="true" />
            <h3>{hasProjectFilters ? 'No projects found' : 'No active projects yet'}</h3>
            <p>{hasProjectFilters ? 'Try changing your search or filters.' : member ? 'Create your first project to start organizing team work.' : 'Projects you are a member of will appear here.'}</p>
            {hasProjectFilters ? <button className="button button-secondary" onClick={() => { setProjectQuery(''); setAppliedProjectQuery(''); setDepartmentFilter(''); setOwnerFilter(''); }}>Reset filters</button> : member && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Create project</button>}
          </div>
        </section>
      )}

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
          <div className="modal-header"><div><h2 id="create-project-title">Create project</h2><p>The new project will be available to your team.</p></div><button className="icon-button" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createProject}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Project name<input className="field-input" name="name" placeholder="e.g. Product Development" minLength={2} maxLength={120} required autoFocus /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" placeholder="Project goals or summary" maxLength={2000} /></label>
            <label className="field-label">Department<select className="filter-select" name="departmentId" required defaultValue=""><option value="" disabled>Select a department</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
            <div className="detail-meta"><label className="field-label">Start date<input className="field-input" name="startsAt" type="date" /></label><label className="field-label">End date<input className="field-input" name="endsAt" type="date" /></label></div>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create project'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
