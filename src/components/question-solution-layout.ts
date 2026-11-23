export const SHORT_ANSWER_FORMAT_TAG = '[PETUNJUK FORMAT: Masukkan bilangan bulat dari 0 sampai 9999 tanpa satuan atau tanda baca.]';

export function solutionStepsExample(conclusion = 'Nyatakan jawaban dan tunjukkan bukti yang menentukannya.') {
  return JSON.stringify([{
    stepNumber: 1,
    category: '[Objek atau operasi khas butir ini]',
    title: '[Keputusan yang perlu dipahami siswa di sini]',
    content: '[Kenalkan ==hubungan penentu== dari data atau kutipan soal dan jelaskan mengapa hubungan itu relevan.]',
  }, {
    stepNumber: 2,
    category: '[Operasi atau pengujian bukti]',
    title: '[Bagaimana petunjuk tadi menentukan pilihan atau hasil?]',
    content: '[Gunakan ==bukti khusus butir ini== untuk menghitung, membandingkan, atau menguji opsi.]\n\n' + conclusion,
  }]);
}

type Step = { stepNumber: number; category: string; title: string; content: string };

// Match labels whose only distinguishing information is a numbered subset.
function comparisonSubject(label: string): string | undefined {
  const match = /^(?:cek|periksa|tinjau|uji|analisis|bandingkan)\s+(?:(bait|kalimat|pernyataan|paragraf|opsi)\s*)?\(?\d+\)?(?:\s*(?:dan|sampai|hingga|[,&–—-])\s*\(?\d+\)?)*$/i.exec(label.trim());
  return match ? (match[1]?.toLowerCase() ?? 'pernyataan') : undefined;
}

function groupComparisonSteps(steps: Step[]): Step[] {
  const grouped: Step[] = [];
  for (let i = 0; i < steps.length; i++) {
    const first = steps[i];
    const subject = comparisonSubject(first.category);
    const sections = [first];
    while (subject && i + 1 < steps.length && comparisonSubject(steps[i + 1].category) === subject) {
      sections.push(steps[++i]);
    }
    if (sections.length === 1) {
      grouped.push({ ...first, stepNumber: grouped.length + 1 });
    } else {
      grouped.push({
        stepNumber: grouped.length + 1,
        category: 'Bandingkan ' + subject,
        title: 'Bandingkan bukti pada setiap ' + subject,
        content: sections.map(step => [step.title, step.content].filter(Boolean).join('\n')).join('\n\n'),
      });
    }
  }
  return grouped;
}

export function readImportedSteps(raw: unknown[]) {
  return groupComparisonSteps(raw.map((entry, index) => {
    const step = (typeof entry === 'object' && entry ? entry : {}) as Record<string, unknown>;
    const fallback = 'Langkah ' + (index + 1);
    return {
      stepNumber: index + 1,
      category: String(step.category || fallback).trim(),
      title: String(step.title || fallback).trim(),
      content: String(step.content || '').trim(),
    };
  }));
}
