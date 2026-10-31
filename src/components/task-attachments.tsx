'use client';

import { useState } from 'react';

const MAX_TASK_LINKS = 10;

export function TaskAttachmentEditor({ initialLinks = [] }: { initialLinks?: string[] }) {
  const [links, setLinks] = useState(() => initialLinks.length ? [...initialLinks] : ['']);

  function updateLink(index: number, value: string) {
    setLinks((current) => current.map((link, itemIndex) => itemIndex === index ? value : link));
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="task-attachment-editor">
      {links.map((link, index) => <div className="task-attachment-editor-row" key={index}>
        <input className="field-input" type="url" name="attachments" value={link} onChange={(event) => updateLink(index, event.target.value)} placeholder="https://…" maxLength={2048} aria-label={`Attachment link ${index + 1}`} />
        {links.length > 1 && <button className="button button-quiet compact-button danger-action" type="button" aria-label={`Remove attachment link ${index + 1}`} onClick={() => removeLink(index)}>Remove</button>}
      </div>)}
      {links.length < MAX_TASK_LINKS && <button className="button button-secondary compact-button task-attachment-add" type="button" onClick={() => setLinks((current) => [...current, ''])}>Add link</button>}
      <small className="field-hint">Add up to {MAX_TASK_LINKS} web links.</small>
    </div>
  );
}

export function TaskAttachmentLinks({ links }: { links?: string[] }) {
  if (!links?.length) return <p className="task-attachment-empty">No links attached.</p>;

  return <ul className="task-attachment-links">{links.map((link) => <li key={link}><a href={link} target="_blank" rel="noreferrer">{link}</a></li>)}</ul>;
}
