'use client';

import React from 'react';
import { Check, Copy, Layers } from 'lucide-react';
import { MathText } from './math-text';
import {
  getDifficultyMeta,
  getQuestionStatusBadge,
  getSubtestDisplay,
} from './question-lifecycle-types';
import type { PracticeAssignedQuestion } from './practice-section';

function stripMarkdownPreview(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim();
}

export function PracticeQuestionIdCell({
  question: q,
  isCopied,
  onCopy,
}: {
  question: PracticeAssignedQuestion;
  isCopied: boolean;
  onCopy: (id: string, e: React.MouseEvent) => void;
}) {
  const cleanBatch = q.batch?.trim() || '';
  const shortId = q.id.length > 12 ? `${q.id.slice(0, 8)}…` : q.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
        <span
          className="font-mono text-xs font-semibold text-zinc-100 tracking-wide select-all"
          style={{ whiteSpace: 'nowrap' }}
          title={`ID Database: ${q.id}`}
        >
          {shortId}
        </span>
        <button
          type="button"
          onClick={(e) => onCopy(q.id, e)}
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
          title={isCopied ? 'ID Tersalin!' : 'Salin ID Soal'}
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
        <span style={{ fontSize: '10.5px', color: '#52525b', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
          Tanpa Batch
        </span>
      )}
    </div>
  );
}

export function PracticeQuestionStatusCell({ question: q }: { question: PracticeAssignedQuestion }) {
  const statusBadge = getQuestionStatusBadge(q.status);
  const statusUpper = String(q.status || 'DRAFT').toUpperCase();

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
      >
        {statusBadge.label}
      </span>
      {statusUpper === 'READY' ? (
        <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>
          ● Tayang di /latihan
        </span>
      ) : (
        <span style={{ fontSize: '10px', color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>
          Belum tayang
        </span>
      )}
    </div>
  );
}

export function PracticeQuestionSubtestCell({ question: q }: { question: PracticeAssignedQuestion }) {
  const subDisplay = getSubtestDisplay(q.subtest);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '280px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#7dd3fc',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          {subDisplay.code} — {subDisplay.label}
        </span>
        {q.topicTitle && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#f4f4f5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {q.topicTitle}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#a1a1aa',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {q.subtopicTitle ? (
          <span>› {q.subtopicTitle}</span>
        ) : !q.topicTitle ? (
          <span style={{ color: '#52525b', fontStyle: 'italic' }}>Tanpa Topik</span>
        ) : null}
        {q.pattern && (
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
            {q.pattern}
          </span>
        )}
      </div>
    </div>
  );
}

export function PracticeQuestionDifficultyCell({ difficulty }: { difficulty: string }) {
  const diffMeta = getDifficultyMeta(difficulty);

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
        border: `1px solid ${diffMeta.border}`,
        background: diffMeta.bg,
        color: diffMeta.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: diffMeta.color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {diffMeta.label}
    </span>
  );
}

export function PracticeQuestionContentCell({ question: q }: { question: PracticeAssignedQuestion }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '380px' }}>
      <div className="line-clamp-2 overflow-hidden text-xs text-[var(--foreground)]" style={{ lineHeight: '1.45' }}>
        <MathText text={stripMarkdownPreview(q.content)} />
      </div>
      {q.revisionNotes && (
        <div
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            fontSize: '11px',
            color: '#fda4af',
          }}
        >
          <span style={{ fontWeight: 650 }}>Catatan Revisi{q.reviewedBy ? ` (${q.reviewedBy})` : ''}: </span>
          <span>{q.revisionNotes}</span>
        </div>
      )}
    </div>
  );
}

export function PracticeQuestionStatsCell({ question: q }: { question: PracticeAssignedQuestion }) {
  return (
    <div className="cell-stack">
      <div className="cell-meta-row" style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Dijawab:</span>
        <span className="cell-mono font-semibold" style={{ color: '#34d399' }}>{q.answeredCount}</span>
      </div>
      <div className="cell-meta-row" style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Dilewati:</span>
        <span className="cell-mono font-semibold" style={{ color: '#fbbf24' }}>{q.skippedCount}</span>
      </div>
    </div>
  );
}
