import { summarizePtnTarget } from '@/lib/ptn-target';

interface PtnTargetDisplayProps {
  target: string | null | undefined;
  compact?: boolean;
  emptyLabel?: string;
}

export function PtnTargetDisplay({
  target,
  compact = false,
  emptyLabel = '—',
}: PtnTargetDisplayProps) {
  const { choices, unreadable } = summarizePtnTarget(target);

  if (unreadable) {
    return <span className="ptn-target-empty">Format target tidak terbaca</span>;
  }
  if (choices.length === 0) {
    return <span className="ptn-target-empty">{emptyLabel}</span>;
  }

  return (
    <div className={`ptn-target-list${compact ? ' ptn-target-list-compact' : ''}`}>
      {choices.map((item) => (
        <div className="ptn-target-item" key={`${item.choice}-${item.university}-${item.program || ''}`}>
          <span className="ptn-target-choice">P{item.choice}</span>
          <span className="ptn-target-copy">
            <strong className="ptn-target-university">
              {item.university}
              {item.acronym && <span className="ptn-target-acronym"> · {item.acronym}</span>}
            </strong>
            {item.program && <span className="ptn-target-program">{item.program}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
