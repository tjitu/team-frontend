import { Fragment } from 'react';
import styles from './affiliate.module.css';

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part,index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2,-2)}</strong> : <Fragment key={index}>{part}</Fragment>);
}
/** A small, safe Markdown subset. Raw HTML, scripts, links and images stay text. */
export function AgreementDocument({ content }: { content: string }) {
  return <article className={styles.document}>{content.split(/\r?\n/).map((line,index) => {
    if (line.startsWith('### ')) return <h3 key={index}>{inline(line.slice(4))}</h3>;
    if (line.startsWith('## ')) return <h2 key={index}>{inline(line.slice(3))}</h2>;
    if (line.startsWith('# ')) return <h1 key={index}>{inline(line.slice(2))}</h1>;
    if (line.startsWith('- ')) return <p className={styles.listItem} key={index}>• {inline(line.slice(2))}</p>;
    return line.trim() ? <p key={index}>{inline(line)}</p> : <br key={index} />;
  })}</article>;
}
