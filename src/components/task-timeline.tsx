'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Task, TaskStatus } from '@/lib/api';
import { ChevronLeft, ChevronRight, Calendar, Tag } from 'lucide-react';

export type TimelineScale = 'day' | 'week' | 'month';
export type TimelineDensity = 'compact' | 'comfortable';

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

function utcDay(value: string | Date | number): number {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function monthLabel(value: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(value);
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

function getWeekStart(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday as week start
  d.setUTCDate(d.getUTCDate() - diff);
  return d.getTime();
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
  const [viewScale, setViewScale] = useState<TimelineScale>('day');
  const [density, setDensity] = useState<TimelineDensity>('comfortable');
  const [showBarLabels, setShowBarLabels] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore saved view preferences from localStorage
  useEffect(() => {
    try {
      const savedScale = window.localStorage.getItem('jitu-timeline-scale') as TimelineScale | null;
      if (savedScale && ['day', 'week', 'month'].includes(savedScale)) {
        setViewScale(savedScale);
      }
      const savedDensity = window.localStorage.getItem('jitu-timeline-density') as TimelineDensity | null;
      if (savedDensity && ['compact', 'comfortable'].includes(savedDensity)) {
        setDensity(savedDensity);
      }
      const savedLabels = window.localStorage.getItem('jitu-timeline-show-labels');
      if (savedLabels !== null) {
        setShowBarLabels(savedLabels === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleScaleChange = (scale: TimelineScale) => {
    setViewScale(scale);
    try {
      window.localStorage.setItem('jitu-timeline-scale', scale);
    } catch {
      // Ignore
    }
  };

  const handleDensityChange = (d: TimelineDensity) => {
    setDensity(d);
    try {
      window.localStorage.setItem('jitu-timeline-density', d);
    } catch {
      // Ignore
    }
  };

  const handleToggleBarLabels = () => {
    setShowBarLabels((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('jitu-timeline-show-labels', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const today = useMemo(() => new Date(), []);
  const todayTs = useMemo(() => utcDay(today.toISOString()), [today]);

  // Compute view bounds based on current scale
  const {
    rangeLabel,
    windowStart,
    windowEnd,
    scheduledTasks,
    unscheduledTasks,
    gridTemplate,
    renderHeaders,
    renderTaskTrack,
  } = useMemo(() => {
    const unscheduled = tasks.filter((task) => !task.dueAt);

    if (viewScale === 'day') {
      const monthStart = Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1);
      const dayCount = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
      const monthEnd = monthStart + (dayCount - 1) * DAY_MS;

      const scheduled = tasks
        .filter((task) => task.dueAt && utcDay(task.createdAt) <= monthEnd && utcDay(task.dueAt) >= monthStart)
        .sort((a, b) => utcDay(a.createdAt) - utcDay(b.createdAt));

      const colWidth = density === 'compact' ? '24px' : '40px';
      const template = `minmax(240px, .85fr) repeat(${dayCount}, minmax(${colWidth}, 1fr))`;

      const headers = (
        <div className="timeline-grid-header" style={{ gridTemplateColumns: template }}>
          <span className="timeline-task-heading">Task</span>
          {Array.from({ length: dayCount }, (_, index) => {
            const date = new Date(monthStart + index * DAY_MS);
            const weekday = date.getUTCDay();
            const isTodayCell = todayTs === date.getTime();
            const isWeekend = weekday === 0 || weekday === 6;
            return (
              <span
                key={index}
                className={`timeline-day-heading ${isWeekend ? 'is-weekend' : ''} ${isTodayCell ? 'is-today' : ''}`}
                title={dateLabel(date.toISOString())}
              >
                <small>{new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)}</small>
                <time dateTime={date.toISOString()}>{index + 1}</time>
              </span>
            );
          })}
        </div>
      );

      const taskTrack = (task: Task) => {
        const startIndex = Math.max(0, Math.floor((utcDay(task.createdAt) - monthStart) / DAY_MS));
        const endIndex = Math.min(dayCount - 1, Math.floor((utcDay(task.dueAt!) - monthStart) / DAY_MS));
        const colWidthInner = density === 'compact' ? '24px' : '40px';

        return (
          <div
            className="timeline-row-track"
            style={{
              gridColumn: `2 / span ${dayCount}`,
              gridTemplateColumns: `repeat(${dayCount}, minmax(${colWidthInner}, 1fr))`,
            }}
          >
            {Array.from({ length: dayCount }, (_, index) => {
              const date = new Date(monthStart + index * DAY_MS);
              const weekday = date.getUTCDay();
              const isWeekend = weekday === 0 || weekday === 6;
              const isTodayCell = todayTs === date.getTime();
              return (
                <span
                  key={index}
                  className={`timeline-day-cell ${isWeekend ? 'is-weekend' : ''} ${isTodayCell ? 'is-today' : ''}`}
                />
              );
            })}
            <button
              className={`timeline-bar status-${task.status}`}
              type="button"
              style={{
                gridColumn: `${startIndex + 1} / ${Math.max(startIndex + 2, endIndex + 2)}`,
                gridRow: 1,
              }}
              title={`${task.title} (${STATUS_LABELS[task.status]})\nStart: ${dateLabel(task.createdAt)}\nDue: ${dateLabel(task.dueAt!)}`}
              aria-label={`${task.title}, ${STATUS_LABELS[task.status]}`}
              onClick={() => onSelectTask(task)}
            >
              {showBarLabels && <span className="timeline-bar-label">{task.title}</span>}
            </button>
          </div>
        );
      };

      return {
        rangeLabel: monthLabel(month),
        windowStart: monthStart,
        windowEnd: monthEnd,
        scheduledTasks: scheduled,
        unscheduledTasks: unscheduled,
        gridTemplate: template,
        renderHeaders: headers,
        renderTaskTrack: taskTrack,
      };
    }

    if (viewScale === 'week') {
      const wStart = getWeekStart(month);
      const weekCount = 8;
      const wEnd = wStart + (weekCount * 7 - 1) * DAY_MS;

      const scheduled = tasks
        .filter((task) => task.dueAt && utcDay(task.createdAt) <= wEnd && utcDay(task.dueAt) >= wStart)
        .sort((a, b) => utcDay(a.createdAt) - utcDay(b.createdAt));

      const colWidth = density === 'compact' ? '90px' : '140px';
      const template = `minmax(240px, .85fr) repeat(${weekCount}, minmax(${colWidth}, 1fr))`;

      const weeks = Array.from({ length: weekCount }, (_, index) => {
        const start = wStart + index * 7 * DAY_MS;
        const end = start + 6 * DAY_MS;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const isCurrentWeek = todayTs >= start && todayTs <= end;
        return {
          index,
          start,
          end,
          startDate,
          endDate,
          isCurrentWeek,
          weekNum: getISOWeek(startDate),
        };
      });

      const startLabel = shortDate(weeks[0].startDate);
      const endLabel = dateLabel(weeks[weekCount - 1].endDate.toISOString());

      const headers = (
        <div className="timeline-grid-header" style={{ gridTemplateColumns: template }}>
          <span className="timeline-task-heading">Task</span>
          {weeks.map((w) => (
            <span
              key={w.index}
              className={`timeline-day-heading timeline-week-heading ${w.isCurrentWeek ? 'is-today is-current-week' : ''}`}
              title={`Week ${w.weekNum}: ${shortDate(w.startDate)} – ${shortDate(w.endDate)}`}
            >
              <strong>W{w.weekNum}</strong>
              <small>{shortDate(w.startDate)} – {shortDate(w.endDate)}</small>
            </span>
          ))}
        </div>
      );

      const taskTrack = (task: Task) => {
        const taskStart = utcDay(task.createdAt);
        const taskEnd = utcDay(task.dueAt!);
        const startIndex = Math.max(0, Math.min(weekCount - 1, Math.floor((taskStart - wStart) / (7 * DAY_MS))));
        const endIndex = Math.max(0, Math.min(weekCount - 1, Math.floor((taskEnd - wStart) / (7 * DAY_MS))));
        const colWidthInner = density === 'compact' ? '90px' : '140px';

        return (
          <div
            className="timeline-row-track"
            style={{
              gridColumn: `2 / span ${weekCount}`,
              gridTemplateColumns: `repeat(${weekCount}, minmax(${colWidthInner}, 1fr))`,
            }}
          >
            {weeks.map((w) => (
              <span
                key={w.index}
                className={`timeline-day-cell timeline-week-cell ${w.isCurrentWeek ? 'is-today is-current-week' : ''}`}
              />
            ))}
            <button
              className={`timeline-bar status-${task.status}`}
              type="button"
              style={{
                gridColumn: `${startIndex + 1} / ${Math.max(startIndex + 2, endIndex + 2)}`,
                gridRow: 1,
              }}
              title={`${task.title} (${STATUS_LABELS[task.status]})\nStart: ${dateLabel(task.createdAt)}\nDue: ${dateLabel(task.dueAt!)}`}
              aria-label={`${task.title}, ${STATUS_LABELS[task.status]}`}
              onClick={() => onSelectTask(task)}
            >
              {showBarLabels && <span className="timeline-bar-label">{task.title}</span>}
            </button>
          </div>
        );
      };

      return {
        rangeLabel: `${startLabel} – ${endLabel} (8 Weeks)`,
        windowStart: wStart,
        windowEnd: wEnd,
        scheduledTasks: scheduled,
        unscheduledTasks: unscheduled,
        gridTemplate: template,
        renderHeaders: headers,
        renderTaskTrack: taskTrack,
      };
    }

    // viewScale === 'month' (6-month roadmap with 4 subdivisions per month)
    const monthCount = 6;
    const monthsData = Array.from({ length: monthCount }, (_, i) => {
      const d = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + i, 1));
      const nextD = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + i + 1, 1));
      return {
        index: i,
        start: d.getTime(),
        end: nextD.getTime() - 1,
        date: d,
        label: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d),
      };
    });

    const mStart = monthsData[0].start;
    const mEnd = monthsData[monthCount - 1].end;
    const totalSlots = monthCount * 4;

    const scheduled = tasks
      .filter((task) => task.dueAt && utcDay(task.createdAt) <= mEnd && utcDay(task.dueAt) >= mStart)
      .sort((a, b) => utcDay(a.createdAt) - utcDay(b.createdAt));

    const slotWidth = density === 'compact' ? '28px' : '42px';
    const template = `minmax(240px, .85fr) repeat(${totalSlots}, minmax(${slotWidth}, 1fr))`;

    function getMonthSlot(ts: number): number {
      if (ts <= mStart) return 0;
      if (ts >= mEnd) return totalSlots - 1;
      for (let m = 0; m < monthsData.length; m++) {
        if (ts <= monthsData[m].end) {
          const duration = monthsData[m].end - monthsData[m].start;
          const progress = Math.max(0, Math.min(0.999, (ts - monthsData[m].start) / duration));
          return m * 4 + Math.floor(progress * 4);
        }
      }
      return totalSlots - 1;
    }

    const headers = (
      <div className="timeline-grid-header timeline-month-view-header" style={{ gridTemplateColumns: template }}>
        <span className="timeline-task-heading">Task</span>
        {monthsData.map((m) => {
          const isCurrentMonth =
            m.date.getUTCFullYear() === today.getUTCFullYear() && m.date.getUTCMonth() === today.getUTCMonth();
          return (
            <span
              key={m.index}
              className={`timeline-day-heading timeline-month-heading ${isCurrentMonth ? 'is-today' : ''}`}
              style={{ gridColumn: `${m.index * 4 + 2} / span 4` }}
            >
              <strong>{m.label}</strong>
              <small>Qtr / 4 wks</small>
            </span>
          );
        })}
      </div>
    );

    const taskTrack = (task: Task) => {
      const taskStart = utcDay(task.createdAt);
      const taskEnd = utcDay(task.dueAt!);
      const startSlot = getMonthSlot(taskStart);
      const endSlot = getMonthSlot(taskEnd);
      const slotWidthInner = density === 'compact' ? '28px' : '42px';

      return (
        <div
          className="timeline-row-track"
          style={{
            gridColumn: `2 / span ${totalSlots}`,
            gridTemplateColumns: `repeat(${totalSlots}, minmax(${slotWidthInner}, 1fr))`,
          }}
        >
          {Array.from({ length: totalSlots }, (_, index) => {
            const isMonthDivider = (index + 1) % 4 === 0;
            return (
              <span
                key={index}
                className={`timeline-day-cell timeline-slot-cell ${isMonthDivider ? 'is-month-boundary' : ''}`}
              />
            );
          })}
          <button
            className={`timeline-bar status-${task.status}`}
            type="button"
            style={{
              gridColumn: `${startSlot + 1} / ${Math.max(startSlot + 2, endSlot + 2)}`,
              gridRow: 1,
            }}
            title={`${task.title} (${STATUS_LABELS[task.status]})\nStart: ${dateLabel(task.createdAt)}\nDue: ${dateLabel(task.dueAt!)}`}
            aria-label={`${task.title}, ${STATUS_LABELS[task.status]}`}
            onClick={() => onSelectTask(task)}
          >
            {showBarLabels && <span className="timeline-bar-label">{task.title}</span>}
          </button>
        </div>
      );
    };

    return {
      rangeLabel: `${monthsData[0].label} – ${monthsData[monthCount - 1].label} (6 Months)`,
      windowStart: mStart,
      windowEnd: mEnd,
      scheduledTasks: scheduled,
      unscheduledTasks: unscheduled,
      gridTemplate: template,
      renderHeaders: headers,
      renderTaskTrack: taskTrack,
    };
  }, [viewScale, density, showBarLabels, month, tasks, today, todayTs, onSelectTask]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewScale === 'day') {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)));
    } else if (viewScale === 'week') {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)));
    } else {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 3, 1)));
    }
  };

  const handleNext = () => {
    if (viewScale === 'day') {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)));
    } else if (viewScale === 'week') {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)));
    } else {
      onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 3, 1)));
    }
  };

  const handleToday = () => {
    onMonthChange(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
    setTimeout(() => {
      const todayEl = scrollRef.current?.querySelector('.is-today, .is-current-week');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 40);
  };

  const isCurrentMonth =
    month.getUTCFullYear() === today.getUTCFullYear() && month.getUTCMonth() === today.getUTCMonth();

  const gridStyle = { gridTemplateColumns: gridTemplate } as CSSProperties;

  return (
    <section className="project-timeline" aria-label={label}>
      <div className="timeline-toolbar">
        <div className="timeline-title-wrap">
          <strong>{rangeLabel}</strong>
          <span>
            {scheduledTasks.length} scheduled · {unscheduledTasks.length} unscheduled
          </span>
        </div>

        {/* View Adjustment Controls */}
        <div className="timeline-controls-group">
          {/* View Scale: Day / Week / Month */}
          <div className="timeline-scale-tabs" role="tablist" aria-label="Timeline time scale">
            <button
              type="button"
              role="tab"
              aria-selected={viewScale === 'day'}
              className={`timeline-scale-tab ${viewScale === 'day' ? 'is-active' : ''}`}
              onClick={() => handleScaleChange('day')}
              title="Day view (daily breakdown of current month)"
            >
              Day
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewScale === 'week'}
              className={`timeline-scale-tab ${viewScale === 'week' ? 'is-active' : ''}`}
              onClick={() => handleScaleChange('week')}
              title="Week view (8-week horizon)"
            >
              Week
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewScale === 'month'}
              className={`timeline-scale-tab ${viewScale === 'month' ? 'is-active' : ''}`}
              onClick={() => handleScaleChange('month')}
              title="Month view (6-month roadmap)"
            >
              Month
            </button>
          </div>

          {/* Density / Zoom: Compact vs Comfortable */}
          <div className="timeline-density-tabs" role="group" aria-label="Timeline column density">
            <button
              type="button"
              className={`timeline-density-tab ${density === 'compact' ? 'is-active' : ''}`}
              onClick={() => handleDensityChange('compact')}
              title="Compact column spacing"
            >
              Compact
            </button>
            <button
              type="button"
              className={`timeline-density-tab ${density === 'comfortable' ? 'is-active' : ''}`}
              onClick={() => handleDensityChange('comfortable')}
              title="Comfortable column spacing"
            >
              Comfortable
            </button>
          </div>

          {/* Bar Label Toggle */}
          <button
            type="button"
            className={`timeline-toggle-btn ${showBarLabels ? 'is-active' : ''}`}
            onClick={handleToggleBarLabels}
            title={showBarLabels ? 'Hide titles on Gantt bars' : 'Show titles on Gantt bars'}
          >
            <Tag size={13} className="shrink-0" />
            <span>Labels</span>
          </button>

          {/* Time Navigation */}
          <div className="timeline-month-controls">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous period"
              onClick={handlePrev}
              title="Previous period"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={isCurrentMonth && viewScale === 'day'}
              onClick={handleToday}
              title="Jump to today"
            >
              Today
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Next period"
              onClick={handleNext}
              title="Next period"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {scheduledTasks.length ? (
        <div className="timeline-scroll" ref={scrollRef}>
          <div className="timeline-grid" style={gridStyle}>
            {renderHeaders}
            {scheduledTasks.map((task) => (
              <div className="timeline-grid-row" style={gridStyle} key={task.id}>
                <div className="timeline-task-name">
                  <button type="button" onClick={() => onSelectTask(task)}>
                    {task.title}
                  </button>
                  <span>
                    {STATUS_LABELS[task.status]}, due {dateLabel(task.dueAt!)}
                  </span>
                </div>
                {renderTaskTrack(task)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="timeline-empty">No tasks with due dates in {rangeLabel}.</div>
      )}

      {unscheduledTasks.length > 0 && (
        <section className="timeline-unscheduled">
          <div>
            <h3>Unscheduled</h3>
            <span>
              {unscheduledTasks.length} {unscheduledTasks.length === 1 ? 'task' : 'tasks'} without a due date
            </span>
          </div>
          <div className="timeline-unscheduled-list">
            {unscheduledTasks.map((task) => (
              <button type="button" key={task.id} onClick={() => onSelectTask(task)}>
                <span>{task.title}</span>
                <small>{STATUS_LABELS[task.status]}</small>
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
