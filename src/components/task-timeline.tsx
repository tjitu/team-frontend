'use client';

import { CSSProperties } from 'react';
import { Task, TaskStatus } from '@/lib/api';

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

function utcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export function TaskTimeline({
  tasks,
  onSelectTask,
  label = 'Task timeline',
  month,
  onMonthChange,
}: {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  label?: string;
  month: Date;
  onMonthChange: (month: Date) => void;
}) {
  const monthStart = month.getTime();
  const dayCount = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const monthEnd = monthStart + (dayCount - 1) * DAY_MS;
  const scheduledTasks = tasks
    .filter((task) => task.dueAt && utcDay(task.createdAt) <= monthEnd && utcDay(task.dueAt) >= monthStart)
    .sort((a, b) => utcDay(a.createdAt) - utcDay(b.createdAt));
  const unscheduledTasks = tasks.filter((task) => !task.dueAt);
  const gridStyle = { gridTemplateColumns: `minmax(220px, .8fr) repeat(${dayCount}, minmax(22px, 1fr))` } as CSSProperties;
  const today = new Date();
  const isCurrentMonth = month.getUTCFullYear() === today.getUTCFullYear() && month.getUTCMonth() === today.getUTCMonth();

  return (
    <section className="project-timeline" aria-label={label}>
      <div className="timeline-toolbar">
        <div><strong>{monthLabel(month)}</strong><span>{scheduledTasks.length} scheduled, {unscheduledTasks.length} unscheduled</span></div>
        <div className="timeline-month-controls">
          <button className="icon-button" type="button" aria-label="Previous month" onClick={() => onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3-5 5 5 5" /></svg></button>
          <button className="button button-secondary" type="button" disabled={isCurrentMonth} onClick={() => onMonthChange(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)))}>Today</button>
          <button className="icon-button" type="button" aria-label="Next month" onClick={() => onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button>
        </div>
      </div>
      {scheduledTasks.length ? <div className="timeline-scroll"><div className="timeline-grid" style={gridStyle}>
        <div className="timeline-grid-header" style={gridStyle}><span className="timeline-task-heading">Task</span>{Array.from({ length: dayCount }, (_, index) => {
          const date = new Date(monthStart + index * DAY_MS);
          const weekday = date.getUTCDay();
          const isTodayCell = utcDay(today.toISOString()) === date.getTime();
          const isWeekend = weekday === 0 || weekday === 6;
          return <span className={`timeline-day-heading ${isWeekend ? 'is-weekend' : ''} ${isTodayCell ? 'is-today' : ''}`} key={index}><small>{new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)}</small><time dateTime={date.toISOString()}>{index + 1}</time></span>;
        })}</div>
        {scheduledTasks.map((task) => {
          const startIndex = Math.max(0, Math.floor((utcDay(task.createdAt) - monthStart) / DAY_MS));
          const endIndex = Math.min(dayCount - 1, Math.floor((utcDay(task.dueAt!) - monthStart) / DAY_MS));
          return <div className="timeline-grid-row" style={gridStyle} key={task.id}>
            <div className="timeline-task-name">
              <button type="button" onClick={() => onSelectTask(task)}>{task.title}</button>
              <span>{STATUS_LABELS[task.status]}, due {dateLabel(task.dueAt!)}</span>
            </div>
            <div className="timeline-row-track" style={{ gridColumn: `2 / span ${dayCount}`, gridTemplateColumns: `repeat(${dayCount}, minmax(22px, 1fr))` }}>
              {Array.from({ length: dayCount }, (_, index) => {
                const date = new Date(monthStart + index * DAY_MS);
                const weekday = date.getUTCDay();
                const isWeekend = weekday === 0 || weekday === 6;
                const isTodayCell = utcDay(today.toISOString()) === date.getTime();
                return <span className={`timeline-day-cell ${isWeekend ? 'is-weekend' : ''} ${isTodayCell ? 'is-today' : ''}`} key={index} />;
              })}
              <button className={`timeline-bar status-${task.status}`} type="button" style={{ gridColumn: `${startIndex + 1} / ${Math.max(startIndex + 2, endIndex + 2)}`, gridRow: 1 }} title={`${task.title}, created ${dateLabel(task.createdAt)}, due ${dateLabel(task.dueAt!)}`} aria-label={`${task.title}, created ${dateLabel(task.createdAt)}, due ${dateLabel(task.dueAt!)}`} onClick={() => onSelectTask(task)} />
            </div>
          </div>;
        })}
      </div></div> : <div className="timeline-empty">No tasks with due dates in {monthLabel(month)}.</div>}
      {unscheduledTasks.length > 0 && <section className="timeline-unscheduled"><div><h3>Unscheduled</h3><span>{unscheduledTasks.length} {unscheduledTasks.length === 1 ? 'task' : 'tasks'} without a due date</span></div><div className="timeline-unscheduled-list">{unscheduledTasks.map((task) => <button type="button" key={task.id} onClick={() => onSelectTask(task)}><span>{task.title}</span><small>{STATUS_LABELS[task.status]}</small></button>)}</div></section>}
    </section>
  );
}
