import { SHORT_ANSWER_FORMAT_TAG, solutionStepsExample } from './question-solution-layout';
import { supportsNumericSlot } from './question-import-answers';

export type QuestionLifecycleStatus =
  | 'DRAFT'
  | 'QC_SANDBOX'
  | 'NEEDS_REVISION'
  | 'READY'
  | 'RETIRED';

export type QuestionStatusType = QuestionLifecycleStatus;

export type TryoutCurationStatus =
  | 'DRAFT'
  | 'QC_SANDBOX'
  | 'NEEDS_REVISION'
  | 'PUBLISHED';

export type SolutionStepItem = {
  stepNumber: number;
  category?: string;
  title: string;
  content: string;
};

export type SoalAsliPackageSummary = {
  id: string;
  slug: string;
  title: string;
  subtest: string;
  subtestName: string;
  year: number;
  dateLabel?: string | null;
  durationMinutes: number;
  questionCount: number;
  archiveLabel?: string | null;
  sourceUrl?: string | null;
  isActive: boolean;
  actualQuestionCount: number;
  solvedCount: number;
  keyedCount: number;
};

export type SoalAsliQuestionOption = {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
};

export type SoalAsliQuestionItem = {
  id: string;
  number: number;
  subtest: string;
  type: string;
  difficulty: string;
  narration?: string | null;
  content: string;
  imageUrl?: string | null;
  points: number;
  correctAnswer?: string | null;
  options: SoalAsliQuestionOption[];
  solution?: {
    id?: string;
    steps?: SolutionStepItem[] | null;
    staticContent?: string | null;
    quickTrick?: string | null;
    keyFormula?: string | null;
    defaultView?: string | null;
  } | null;
};

export type SoalAsliPackageDetail = SoalAsliPackageSummary & {
  questions: SoalAsliQuestionItem[];
};

export type PracticeAssignedQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  topicTitle?: string | null;
  subtopicTitle?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isLiveInPractice?: boolean;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  tryoutStatus?: string | null;
  narration?: string | null;
  content: string;
  imageUrl?: string | null;
  points: number;
  correctAnswer?: string | null;
  assignedAt: string;
  assignedBy?: string | null;
  answeredCount: number;
  skippedCount: number;
  options: SoalAsliQuestionOption[];
  solution?: {
    id?: string;
    steps?: SolutionStepItem[] | null;
    staticContent?: string | null;
    quickTrick?: string | null;
    keyFormula?: string | null;
  } | null;
};

export type PracticePickerQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  topicTitle?: string | null;
  subtopicTitle?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isLiveInPractice?: boolean;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  tryoutStatus?: string | null;
  isLockedInTryout: boolean;
  hasSolution: boolean;
  narration?: string | null;
  content: string;
  points: number;
  createdAt: string;
};

export type SubtestStockStat = {
  total: number;
  minRemaining: number;
  maxAccessed: number;
};

export type PracticeWorkspaceResponse = {
  assignedQuestions: PracticeAssignedQuestion[];
  pickerPool: PracticePickerQuestion[];
  subtestStocks: Record<string, number>;
  subtestStockStats?: Record<string, SubtestStockStat>;
};

export type TryoutSubtestSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  order: number;
  questionCount: number;
};

export type TryoutAssignedQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  topicTitle?: string | null;
  subtopicTitle?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isLiveInPractice?: boolean;
  tryoutId?: string | null;
  subtestId?: string | null;
  subtestCode?: string | null;
  narration?: string | null;
  content: string;
  imageUrl?: string | null;
  points: number;
  correctAnswer?: string | null;
  answerCount: number;
  options: SoalAsliQuestionOption[];
  solution?: {
    id?: string;
    steps?: SolutionStepItem[] | null;
    staticContent?: string | null;
    quickTrick?: string | null;
    keyFormula?: string | null;
  } | null;
};

export type TryoutPickerQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  topicTitle?: string | null;
  subtopicTitle?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isLiveInPractice?: boolean;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  tryoutStatus?: string | null;
  isLockedInOtherTryout: boolean;
  isInPoolTryout: boolean;
  isInBank: boolean;
  isInPractice: boolean;
  hasSolution: boolean;
  narration?: string | null;
  content: string;
  points: number;
  createdAt: string;
};

export type TryoutBatchSummary = {
  batch: string;
  totalInBatch: number;
  eligibleCount: number;
  poolTryoutCount: number;
  bankCount: number;
  practiceCount: number;
  notReadyCount: number;
  lockedOtherCount: number;
  alreadyHereCount: number;
  subtestBreakdown: Record<string, number>;
};

export type TryoutCurriculumTopic = {
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

export type TryoutWorkspaceResponse = {
  tryout: {
    id: string;
    code: number;
    title: string;
    description?: string | null;
    solutionPrice: number;
    batch: string;
    status: string;
    curationStatus?: TryoutCurationStatus;
    revisionNotes?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    isPublic: boolean;
    questionCount: number;
    totalDurationMinutes?: number;
  };
  subtests: TryoutSubtestSummary[];
  assignedQuestions: TryoutAssignedQuestion[];
  pickerPool: TryoutPickerQuestion[];
  batchSummaries: TryoutBatchSummary[];
  curriculumTopics?: TryoutCurriculumTopic[];
};

export const LIFECYCLE_SUBTESTS = [
  { value: 'PENALARAN_UMUM', code: 'PU', label: 'Penalaran Umum' },
  { value: 'PENGETAHUAN_KUANTITATIF', code: 'PK', label: 'Pengetahuan Kuantitatif' },
  { value: 'PENALARAN_MATEMATIKA', code: 'PM', label: 'Penalaran Matematika' },
  { value: 'PEMAHAMAN_BACAAN_MENULIS', code: 'PBM', label: 'Pemahaman Bacaan & Menulis' },
  { value: 'PENGETAHUAN_PEMAHAMAN_UMUM', code: 'PPU', label: 'Pengetahuan & Pemahaman Umum' },
  { value: 'LITERASI_INDONESIA', code: 'LBI', label: 'Literasi Bahasa Indonesia' },
  { value: 'LITERASI_INGGRIS', code: 'LBE', label: 'Literasi Bahasa Inggris' },
] as const;

export function normalizeSubtestKey(raw?: string | null): string {
  const s = (raw || '').toUpperCase().trim();
  if (s === 'PU' || s === 'PENALARAN_UMUM') return 'PENALARAN_UMUM';
  if (s === 'PK' || s === 'PENGETAHUAN_KUANTITATIF') return 'PENGETAHUAN_KUANTITATIF';
  if (s === 'PM' || s === 'PENALARAN_MATEMATIKA') return 'PENALARAN_MATEMATIKA';
  if (s === 'PBM' || s === 'PEMAHAMAN_BACAAN' || s === 'PEMAHAMAN_BACAAN_MENULIS') return 'PEMAHAMAN_BACAAN_MENULIS';
  if (s === 'PPU' || s === 'PENGETAHUAN_UMUM' || s === 'PENGETAHUAN_PEMAHAMAN_UMUM') return 'PENGETAHUAN_PEMAHAMAN_UMUM';
  if (s === 'LBI' || s === 'LITERASI_INDONESIA') return 'LITERASI_INDONESIA';
  if (s === 'LBE' || s === 'LITERASI_INGGRIS') return 'LITERASI_INGGRIS';
  return s || 'PENALARAN_UMUM';
}

export function getSubtestDisplay(raw?: string | null): { code: string; label: string } {
  const norm = normalizeSubtestKey(raw);
  const found = LIFECYCLE_SUBTESTS.find((item) => item.value === norm);
  return found ? { code: found.code, label: found.label } : { code: raw || 'SNBT', label: raw || 'SNBT' };
}

export function getDifficultyMeta(difficulty?: string | null): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  const d = (difficulty || 'MEDIUM').toUpperCase();
  if (d === 'EASY') {
    return {
      label: 'Mudah',
      bg: 'rgba(16, 185, 129, 0.14)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  }
  if (d === 'HARD') {
    return {
      label: 'Sulit',
      bg: 'rgba(244, 63, 94, 0.14)',
      color: '#fb7185',
      border: 'rgba(244, 63, 94, 0.35)',
    };
  }
  return {
    label: 'Sedang',
    bg: 'rgba(245, 158, 11, 0.14)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  };
}

export function getQuestionStatusBadge(status?: string | null): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  const s = (status || 'DRAFT').toUpperCase();
  if (s === 'READY') {
    return {
      label: 'Siap / Ready',
      bg: 'rgba(16, 185, 129, 0.14)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  }
  if (s === 'QC_SANDBOX') {
    return {
      label: 'Antrean QC',
      bg: 'rgba(59, 130, 246, 0.14)',
      color: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.35)',
    };
  }
  if (s === 'NEEDS_REVISION') {
    return {
      label: 'Kotak Revisi',
      bg: 'rgba(244, 63, 94, 0.16)',
      color: '#fb7185',
      border: 'rgba(244, 63, 94, 0.45)',
    };
  }
  if (s === 'RETIRED') {
    return {
      label: 'Nonaktif (Retired)',
      bg: 'rgba(113, 113, 122, 0.18)',
      color: '#a1a1aa',
      border: 'rgba(113, 113, 122, 0.35)',
    };
  }
  return {
    label: 'Draf',
    bg: 'rgba(245, 158, 11, 0.14)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  };
}

const QUESTION_QUALITY_RULES = 'Untuk PG, isi options dengan lima objek berurutan A–E. Setiap content harus berisi teks jawaban lengkap, berbeda, tanpa label huruf atau petunjuk kunci. Isi isCorrect dengan boolean dan tandai tepat satu jawaban benar. Selesaikan soal lalu cocokkan isi dan urutan opsi dengan semua rujukan di pembahasan. Untuk literasi, uji pemahaman bacaan sesuai subtopik. Gunakan bahasa Inggris untuk stimulus, pertanyaan, dan opsi LBE. Alokasikan isian numerik pada PK atau PM.';

export const SOLUTION_FORMATTING_RULES = [
  'PEDOMAN PEMBAHASAN UNTUK SISWA YANG BARU BELAJAR:',
  '- Jika quickTrick diminta, tunjukkan satu jalan pintas yang benar-benar menghemat langkah. Sebut petunjuk spesifik dalam soal, lalu langsung gunakan untuk memperoleh hasil atau menggugurkan opsi. Jika pembahasan sudah memakai cara tersingkat dan tidak ada jalan pintas lain yang sah, isi quickTrick dengan string kosong.',
  '- Jelaskan konsep dari dasar yang relevan dengan soal. Saat istilah teknis pertama muncul, berikan arti dengan bahasa sehari-hari, ciri pengenalnya, contoh konkret, dan alasan konsep itu berlaku pada soal.',
  '- Contoh metonimia: gaya bahasa yang memakai nama yang berkaitan erat dengan benda untuk menyebut benda itu. Pada "membeli Kijang", nama model mobil mewakili mobilnya. Jelaskan hubungan nama dan benda sebelum memberi label metonimia.',
  '- Selesaikan dulu butirnya. Cari keputusan yang paling sulit bagi pemula, lalu bangun penjelasan di sekitar keputusan itu. Perkenalkan konsep saat pertama kali dibutuhkan. Pilih titik awal, urutan, dan jumlah chapter dari jalan penyelesaian butir tersebut.',
  '- Misalnya, jika keluaran dua mesin diketahui, telusuri operasi dari mesin terakhir ke pertama dan cek masukan dengan menjalankannya maju. Pada soal tinggi layang-layang, mulai dari sketsa: bedakan sisi miring, tinggi terhadap tangan, dan tinggi terhadap tanah sesuai data. Pada soal sisa pembagian, satu argumen substitusi dapat sekaligus menerangkan mengapa suku yang memuat pembagi menjadi nol. Contoh ini menggambarkan cara memilih alur; tulis alur sendiri sesuai soal.',
  '- Gabungkan pemeriksaan (1)–(5) yang memakai cara berpikir sama dalam satu chapter. Hindari membagi halaman hanya karena nomor pernyataan atau urutan paragraf.',
  '- Rancang alur tiap butir sebelum menulis solutionSteps. Pisahkan pengenalan konsep atau pembacaan bukti dari penerapannya ketika keduanya diperlukan. Tambahkan chapter tersendiri untuk pemeriksaan batas, perbandingan tafsir, atau pengecekan hasil jika memberi pemahaman baru. Jumlah chapter mengikuti soal; jangan menyalin panjang array contoh ke seluruh batch.',
  '- Contoh puisi: jelaskan dahulu bahwa personifikasi memberi tindakan atau perasaan manusia kepada sesuatu yang bukan manusia. Di satu chapter, bandingkan pelaku dan kata kerja dalam SEMUA bait lalu simpulkan dengan kutipan penentu. Terapkan pola kriteria → bukti → keputusan juga saat membandingkan kalimat, data, atau opsi.',
  '- Sebelum mengirim, baca judul chapter berurutan. Satukan "Cek Bait 1 dan 3" dengan "Cek Bait 2", atau "Cek (1)–(2)" dengan "Cek (3)–(4)". Letakkan kesimpulan singkat di akhir analisis. Periksa kembali apakah alasan sudah cukup untuk diikuti pemula.',
  '- Pada soal, bacaan, dan pembahasan, tulis satu butir per baris. Awali daftar biasa dengan • dan spasi. Untuk pernyataan bernomor pertahankan (1), (2), dst. di awal baris masing-masing tanpa bullet tambahan. Sisakan satu baris kosong antarparagraf atau bait dan pertahankan baris asli puisi. Biarkan prosa biasa mengalir.',
  '- Untuk soal baru, letakkan stimulus di narration, pertanyaan di content, dan setiap opsi di field content milik opsi tersebut. Petunjuk format isian hanya sekali pada tag penutup yang disediakan. Jangan tampilkan contoh yang sama dengan kunci.',
  '- Sebelum hitungan, jelaskan apa yang dicari dan mengapa operasi tersebut diperlukan. Terangkan makna simbol, asumsi, dan alasan perubahan rumus sampai pembaca pemula dapat mengikuti.',
  '- Saat menguji opsi, tunjukkan bagian yang cocok atau bertentangan dengan konsep atau bukti, termasuk perbedaan istilah yang mudah tertukar.',
  '- Gunakan paragraf pendek, tabel perbandingan bila membantu, serta baris baru untuk pernyataan. Setiap halaman boleh digulir agar penjelasan tetap utuh.',
  '- Tulis category setelah isi chapter selesai: gunakan 2–5 kata yang menyebut objek, hubungan, atau operasi penentu pada soal. Dalam title, ungkapkan pertanyaan atau keputusan spesifik yang dijawab chapter itu. Isi nilai contoh pada skema JSON dengan tulisan sendiri.',
  '- Untuk batch, baca kembali urutan category, title, dan inti penalaran antarbutir. Jika dua butir berbeda strategi tetapi pembahasannya masih bisa saling ditukar, susun ulang pembahasan dari bukti atau operasi khas masing-masing. Mengganti judul dengan sinonim saja belum cukup. Butir yang sungguh memakai penalaran sama boleh berbagi istilah dan urutan.',
  '- Rumus inline di content, title, dan category memakai $...$. Rumus blok memakai $$...$$. Escape backslash LaTeX sesuai JSON dan pastikan hasil render dapat dibaca.',
  '- Keluarkan karakter teks asli dan spasi biasa. Hindari entity HTML seperti &#x20; serta penanda markdown yang belum selesai.',
  '- Dalam content setiap solutionSteps, pilih satu frasa pendek yang menjawab pertanyaan pada title dan membantu siswa mengambil langkah berikutnya. Sorot hubungan antarbesaran, syarat yang menentukan operasi, atau potongan bukti dengan ==stabilo kuning==. Baca frasa itu sendiri: maknanya harus jelas dalam konteks soal. Biarkan label, kalimat pengantar, dan huruf kunci jawaban tanpa stabilo. Letakkan penanda di luar rumus.',
  '- Jika quickTrick berisi jalan pintas, sorot hanya petunjuk yang membuatnya berlaku. Misalnya, untuk membandingkan waktu pengisian dua tahap, ==volume tambahan kedua tahap sama== menjelaskan mengapa waktunya dapat dibandingkan langsung dari debit. Pilih petunjuk sesuai butir yang sedang dibahas.',
  '- Beri ruang saat arah penalaran berganti: pisahkan alasan, hitungan atau bukti, dan kesimpulan dengan satu baris kosong (\\n\\n di dalam string JSON). Bila beberapa hitungan berurutan, tulis satu persamaan per baris.',
  '- keyFormula boleh berisi konsep inti beserta kapan dipakai. quickTrick merangkum jalan cepat yang sudah dijelaskan alasannya pada langkah utama.',
].join('\n');

export function buildRevisionContextPrompt(params: {
  id: string;
  subtest: string;
  difficulty: string;
  type: string;
  revisionNotes?: string | null;
  narration?: string | null;
  content: string;
  correctAnswer?: string | null;
  options: Array<{ content: string; isCorrect: boolean; order?: number }>;
  keyFormula?: string | null;
  quickTrick?: string | null;
  staticExplanation?: string | null;
  solutionSteps?: SolutionStepItem[];
}): string {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const currentJson = {
    subtest: params.subtest,
    difficulty: params.difficulty,
    type: params.type,
    narration: params.narration || '',
    content: params.content,
    correctAnswer: params.correctAnswer || '',
    options: (params.options || []).map((opt, i) => ({
      order: opt.order ?? i,
      label: letters[i] || String(i + 1),
      content: opt.content,
      isCorrect: Boolean(opt.isCorrect),
    })),
    keyFormula: params.keyFormula || '',
    quickTrick: params.quickTrick || '',
    staticExplanation: params.staticExplanation || '',
    solutionSteps: params.solutionSteps || [],
  };

  return [
    'Peran: Kamu adalah Kakak Tutor & Editor Soal UTBK SNBT terbaik untuk siswa SMA di platform JITU.',
    'Tugas: Perbaiki soal di bawah ini BERDASARKAN catatan revisi dari tim QC, dan pastikan bahasanya ringan serta mudah dipahami anak SMA.',
    '',
    '=== CATATAN REVISI QC (WAJIB DIPERBAIKI) ===',
    params.revisionNotes?.trim() || 'Periksa kembali ketepatan konsep, kunci jawaban, pengecoh, dan buat pembahasannya jauh lebih ringan serta mudah dipahami siswa SMA.',
    '',
    '=== DATA SOAL SAAT INI ===',
    JSON.stringify(currentJson, null, 2),
    '',
    QUESTION_QUALITY_RULES,
    SOLUTION_FORMATTING_RULES,
    '',
    '=== ATURAN OUTPUT ===',
    '1. Kembalikan HANYA 1 objek JSON valid (tanpa teks pengantar atau markdown tambahan jika memungkinkan, atau di dalam blok ```json).',
    '2. Gunakan format LaTeX $...$ untuk rumus inline dan $$...$$ di baris baru untuk persamaan inti; pastikan semua backslash di-escape ganda (\\\\) agar valid JSON.',
    '3. Untuk MULTIPLE_CHOICE, pastikan tepat 1 opsi memiliki "isCorrect": true. Untuk SHORT_ANSWER, isi field "correctAnswer".',
    '4. Jumlah item pada "solutionSteps" fleksibel (1-6 langkah) dengan gaya bahasa ramah anak SMA, mengikuti struktur JSON:',
    `{"subtest":"...","difficulty":"...","type":"...","narration":"...","content":"...","correctAnswer":"...","options":[{"content":"Opsi A","isCorrect":false},{"content":"Opsi B","isCorrect":true},{"content":"Opsi C","isCorrect":false},{"content":"Opsi D","isCorrect":false},{"content":"Opsi E","isCorrect":false}],"keyFormula":"Rumus inti yang dipakai + 1 kalimat kapan dipakainya","quickTrick":"Petunjuk khas soal dan cara memakainya untuk mempersingkat penyelesaian, atau string kosong","staticExplanation":"Ringkasan 1-2 kalimat kenapa jawabannya tepat","solutionSteps":${solutionStepsExample()}}`,
  ].join('\n');
}

export function buildSoalAsliSolutionPrompt(question: SoalAsliQuestionItem, packageTitle: string): string {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const optionsText = question.options.length > 0
    ? question.options.map((opt, idx) => `${letters[idx] || idx + 1}. ${opt.content}`).join('\n')
    : '(Soal Isian Singkat / tanpa opsi)';
  const keyFieldExample = question.options.length > 0 ? '"correctOptionLetter":"A"' : '"correctAnswer":"42"';
  const conclusionExample = question.options.length > 0
    ? 'Jadi, ==opsi ... adalah jawaban yang paling tepat==.'
    : 'Jadi, jawaban yang tepat adalah ==42==.';

  return [
    `Peran: Kamu adalah Kakak Tutor UTBK SNBT favorit siswa SMA di platform JITU.`,
    `Tugas: Tentukan KUNCI JAWABAN dan buat PEMBAHASAN yang jelas, ringan, serta gampang dipahami anak SMA untuk arsip soal asli berikut ("${packageTitle}", Soal No. ${question.number}).`,
    `PENTING: JANGAN mengubah isi teks soal maupun opsi jawaban. Berikan hanya kunci & pembahasan.`,
    '',
    '=== NASKAH SOAL ===',
    question.narration ? `Bacaan / Stimulus:\n${question.narration}\n` : '',
    `Pertanyaan:\n${question.content}`,
    '',
    '=== OPSI JAWABAN ===',
    optionsText,
    '',
    SOLUTION_FORMATTING_RULES,
    '',
    '=== FORMAT OUTPUT WAJIB (JSON VALID, JUMLAH STEP 1-6 ADAPTIF SESUAI SOAL) ===',
    `{${keyFieldExample},"keyFormula":"Rumus inti + kapan dipakainya","quickTrick":"Petunjuk khas soal dan cara memakainya untuk mempersingkat penyelesaian, atau string kosong","staticExplanation":"Ringkasan singkat kenapa jawaban itu benar","solutionSteps":${solutionStepsExample(conclusionExample)}}`,
    '',
    'Catatan: Pakai bahasa yang santai, jelas, tidak berbelit seperti buku kuliahan. Tambah/kurangi jumlah "solutionSteps" (1-6 langkah) sesuai kebutuhan soal agar setiap tahap penalaran tuntas, dan escape semua backslash LaTeX menjadi \\\\ agar JSON valid.',
  ].filter(Boolean).join('\n');
}

export function buildBalancedTryoutGapPrompt(params: {
  tryoutTitle: string;
  subtestValue: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  count: number;
  batchSuggestion: string;
  missingTopics: Array<{ topicTitle: string; subtopicTitle?: string; patterns?: string[] }>;
  existingCount: number;
  targetCount: number;
}): string {
  const sub = getSubtestDisplay(params.subtestValue);
  const safeCount = Math.max(1, Math.min(8, Math.round(params.count || 4)));
  const normSubtest = normalizeSubtestKey(params.subtestValue);
  const batchName = (params.batchSuggestion || 'to-batch-1').trim();
  const topicLines =
    params.missingTopics.length > 0
      ? params.missingTopics
          .slice(0, 6)
          .map((item, idx) => {
            const name = item.subtopicTitle
              ? `${item.topicTitle} -> ${item.subtopicTitle}`
              : item.topicTitle;
            const patternHint =
              item.patterns && item.patterns.length > 0
                ? ` (pola soal: ${item.patterns.slice(0, 2).join('; ')})`
                : '';
            return `${idx + 1}. ${name}${patternHint}`;
          })
          .join('\n')
      : '1. Variasikan topik inti UTBK sesuai kisi-kisi SNBT terbaru (hindari topik yang kembar).';

  const difficultyGuide =
    params.difficulty === 'EASY'
      ? 'EASY: Konsep dasar/literasi langsung, 1-2 langkah penalaran, cocok untuk pemanasan.'
      : params.difficulty === 'HARD'
        ? 'HARD: HOTS UTBK-SNBT asli, multi-konsep / analisis jebakan / pernyataan (1)-(4) atau P vs Q.'
        : 'MEDIUM: Standar rata-rata SNBT, butuh 2-3 langkah penalaran atau sintesis bacaan.';

  return [
    `Buat TEPAT ${safeCount} soal UTBK-SNBT baru (mini-batch ringan agar output tidak terpotong) untuk mengisi kekurangan Tryout "${params.tryoutTitle}".`,
    '',
    '=== SPESIFIKASI MINI-BATCH ===',
    `- Subtes: ${normSubtest} (${sub.code} - ${sub.label})`,
    `- Progres subtes saat ini: ${params.existingCount}/${params.targetCount} soal`,
    `- Kesulitan target batch ini: ${params.difficulty} (${difficultyGuide})`,
    `- Jumlah soal wajib: ${safeCount} soal (sebar merata ke topik prioritas di bawah, 1 soal per subtopik jika memungkinkan)`,
    `- Tag batch JSON wajib: "${batchName}"`,
    '',
    '=== PRIORITAS TOPIK / MATERI YANG MASIH KOSONG (0 SOAL DI TRYOUT INI) ===',
    topicLines,
    '',
    '=== ATURAN KUALITAS SOAL ===',
    '- Pastikan konteks bacaan/angka segar, logis, tidak ambigu, dan setiap pengecoh masuk akal.',
    '- Jika memakai model pernyataan (1), (2), (3), (4) atau P & Q, wajib pisahkan tiap pernyataan dengan baris baru (\\n).',
    '- Untuk LBI/LBE/PPU/PBM, buat teks bacaan/stimulus ringkas yang tajam (2-4 paragraf) agar token tetap hemat.',
    '',
    QUESTION_QUALITY_RULES,
    SOLUTION_FORMATTING_RULES,
    '',
    '=== FORMAT OUTPUT WAJIB: ARRAY JSON VALID TANPA TEKS PEMBUKA/PENUTUP ===',
    `[
  {
    "type": "PILIHAN_GANDA",
    "subtest": "${normSubtest}",
    "difficulty": "${params.difficulty}",
    "batch": "${batchName}",
    "topicTitle": "Nama Topik yang Dipakai",
    "narration": "Stimulus/bacaan soal (atau null jika tidak perlu)",
    "content": "Pertanyaan utama (gunakan \\\\n untuk baris baru)",
    "options": [
      { "content": "Opsi A", "isCorrect": false },
      { "content": "Opsi B", "isCorrect": true },
      { "content": "Opsi C", "isCorrect": false },
      { "content": "Opsi D", "isCorrect": false },
      { "content": "Opsi E", "isCorrect": false }
    ],
    "correctAnswer": null,
    "keyFormula": "Rumus/konsep inti + kapan dipakainya",
    "quickTrick": "Petunjuk khas soal dan cara memakainya untuk mempersingkat penyelesaian, atau string kosong",
    "staticExplanation": "Ringkasan 1-2 kalimat kenapa B benar",
    "solutionSteps": ${solutionStepsExample()}
  }
]`,
    '',
    `Wajib keluarkan TEPAT ${safeCount} objek dalam array JSON di atas, dan escape semua backslash LaTeX menjadi \\\\ agar langsung lolos JSON.parse().`,
  ].join('\n');
}

export const OFFICIAL_SNBT_SUBTEST_SPEC: Array<{
  code: string;
  value: string;
  label: string;
  defaultDuration: number;
  fullQuestionTarget: number;
  miniQuestionTarget: number;
  microQuestionTarget: number;
}> = [
  { code: 'PU', value: 'PENALARAN_UMUM', label: 'Penalaran Umum', defaultDuration: 30, fullQuestionTarget: 30, miniQuestionTarget: 15, microQuestionTarget: 5 },
  { code: 'PPU', value: 'PENGETAHUAN_PEMAHAMAN_UMUM', label: 'Pengetahuan & Pemahaman Umum', defaultDuration: 15, fullQuestionTarget: 20, miniQuestionTarget: 10, microQuestionTarget: 5 },
  { code: 'PBM', value: 'PEMAHAMAN_BACAAN_MENULIS', label: 'Pemahaman Bacaan & Menulis', defaultDuration: 25, fullQuestionTarget: 20, miniQuestionTarget: 10, microQuestionTarget: 5 },
  { code: 'PK', value: 'PENGETAHUAN_KUANTITATIF', label: 'Pengetahuan Kuantitatif', defaultDuration: 20, fullQuestionTarget: 20, miniQuestionTarget: 10, microQuestionTarget: 5 },
  { code: 'LBI', value: 'LITERASI_INDONESIA', label: 'Literasi Bahasa Indonesia', defaultDuration: 43, fullQuestionTarget: 30, miniQuestionTarget: 15, microQuestionTarget: 5 },
  { code: 'LBE', value: 'LITERASI_INGGRIS', label: 'Literasi Bahasa Inggris', defaultDuration: 20, fullQuestionTarget: 20, miniQuestionTarget: 10, microQuestionTarget: 5 },
  { code: 'PM', value: 'PENALARAN_MATEMATIKA', label: 'Penalaran Matematika', defaultDuration: 42, fullQuestionTarget: 20, miniQuestionTarget: 10, microQuestionTarget: 5 },
];

export type TryoutBalancePreset = 'FULL_160' | 'MINI_80' | 'MICRO_35';

export function getTryoutStatusBadge(status?: string | null): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  const s = (status || 'DRAFT').toUpperCase();
  if (s === 'PUBLISHED') {
    return {
      label: 'Published (Live)',
      bg: 'rgba(16, 185, 129, 0.14)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  }
  if (s === 'QC_SANDBOX') {
    return {
      label: 'Antrean QC',
      bg: 'rgba(59, 130, 246, 0.14)',
      color: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.35)',
    };
  }
  if (s === 'NEEDS_REVISION') {
    return {
      label: 'Kotak Revisi',
      bg: 'rgba(244, 63, 94, 0.16)',
      color: '#fb7185',
      border: 'rgba(244, 63, 94, 0.45)',
    };
  }
  return {
    label: 'Draf',
    bg: 'rgba(245, 158, 11, 0.14)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  };
}

export function extractJsonFromLlmText(raw: string): any {
  let cleaned = (raw || '').trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    cleaned = fenced[1].trim();
  }
  return JSON.parse(cleaned);
}

export type DifficultyComposition = {
  easy: number;
  medium: number;
  hard: number;
};

export const DIFFICULTY_COMPOSITION_PRESETS: Array<{
  id: string;
  label: string;
  ratio: DifficultyComposition;
}> = [
  { id: 'SNBT_STANDARD', label: 'Standar UTBK (30/50/20)', ratio: { easy: 30, medium: 50, hard: 20 } },
  { id: 'HOTS_HEAVY', label: 'Fokus HOTS (15/45/40)', ratio: { easy: 15, medium: 45, hard: 40 } },
  { id: 'FOUNDATION', label: 'Dasar / Pemanasan (50/35/15)', ratio: { easy: 50, medium: 35, hard: 15 } },
  { id: 'BALANCED', label: 'Merata (34/33/33)', ratio: { easy: 34, medium: 33, hard: 33 } },
];

export function normalizeDifficultyComposition(ratio?: DifficultyComposition): {
  easyShare: number;
  mediumShare: number;
  hardShare: number;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  rawTotal: number;
} {
  const rawEasy = Math.max(0, Number(ratio?.easy ?? 30) || 0);
  const rawMedium = Math.max(0, Number(ratio?.medium ?? 50) || 0);
  const rawHard = Math.max(0, Number(ratio?.hard ?? 20) || 0);
  const rawTotal = rawEasy + rawMedium + rawHard;

  if (rawTotal <= 0) {
    return {
      easyShare: 0.3,
      mediumShare: 0.5,
      hardShare: 0.2,
      easyPct: 30,
      mediumPct: 50,
      hardPct: 20,
      rawTotal: 100,
    };
  }

  const easyShare = rawEasy / rawTotal;
  const mediumShare = rawMedium / rawTotal;
  const hardShare = rawHard / rawTotal;
  const easyPct = Math.round(easyShare * 100);
  const hardPct = Math.round(hardShare * 100);
  const mediumPct = Math.max(0, 100 - easyPct - hardPct);

  return { easyShare, mediumShare, hardShare, easyPct, mediumPct, hardPct, rawTotal };
}

export type AutoBalanceSlot = {
  index: number;
  subtest: string;
  subtestShort: string;
  subtestLabel: string;
  topicId: string;
  topicTitle: string;
  subtopicId: string;
  subtopicTitle: string;
  questionType: 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  currentSubtopicCount: number;
  reason: string;
};

export type PackageAutoBalanceAnalysis = {
  totalInPackage: number;
  subtestCounts: Record<string, { count: number; targetQuota: number; short: string; label: string }>;
  difficultyCounts: { EASY: number; MEDIUM: number; HARD: number };
  typeCounts: { PILIHAN_GANDA: number; ISIAN_SINGKAT: number };
  targetDifficultyPct: { easy: number; medium: number; hard: number };
  targetIsianPct: number;
  existingDifficultyPct: { easy: number; medium: number; hard: number };
  existingIsianPct: number;
  deficit: {
    isian: number;
    pg: number;
    easy: number;
    medium: number;
    hard: number;
  };
  uncoveredSubtopicsCount: number;
  totalCurriculumSubtopics: number;
  slots: AutoBalanceSlot[];
};

export type QuestionTypeComposition = {
  pgCount?: number;
  isianCount?: number;
};

export function computePackageAutoBalancePlan(params: {
  destination: 'FOR_PRACTICE' | 'FOR_TRYOUT' | 'DRAFT';
  packageQuestions: Array<{
    subtest?: string | null;
    topicId?: string | null;
    subtopicId?: string | null;
    topicTitle?: string | null;
    subtopicTitle?: string | null;
    difficulty?: string | null;
    type?: string | null;
  }>;
  curriculumTopics: TryoutCurriculumTopic[];
  count: number;
  scopeSubtest?: string;
  targetIsianPct?: number;
  typeComposition?: QuestionTypeComposition;
  difficultyRatio?: DifficultyComposition;
}): PackageAutoBalanceAnalysis {
  const {
    destination,
    packageQuestions,
    curriculumTopics,
    count,
    scopeSubtest = 'AUTO',
    targetIsianPct,
    typeComposition,
    difficultyRatio,
  } = params;
  const safeCount = Math.max(1, Math.min(160, Number(count) || 5));
  const normRatio = normalizeDifficultyComposition(difficultyRatio);

  // Resolved target isian % (default 15%, or derived from typeComposition if provided)
  const resolvedTargetIsianPct =
    typeof targetIsianPct === 'number'
      ? Math.max(0, Math.min(100, Math.round(targetIsianPct)))
      : typeof typeComposition?.isianCount === 'number' && safeCount > 0
        ? Math.round((typeComposition.isianCount / safeCount) * 100)
        : 15;

  const subtestCounts: Record<string, { count: number; targetQuota: number; short: string; label: string }> = {};
  for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
    subtestCounts[spec.value] = {
      count: 0,
      targetQuota: destination === 'FOR_TRYOUT' ? spec.fullQuestionTarget : 20,
      short: spec.code,
      label: spec.label,
    };
  }

  const difficultyCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };
  const typeCounts = { PILIHAN_GANDA: 0, ISIAN_SINGKAT: 0 };
  const subtopicCountMap = new Map<string, number>();
  const subtopicTitleCountMap = new Map<string, number>();

  for (const q of packageQuestions) {
    const normSub = normalizeSubtestKey(q.subtest || '');
    if (subtestCounts[normSub]) {
      subtestCounts[normSub].count += 1;
    }
    const diff = String(q.difficulty || 'MEDIUM').toUpperCase();
    if (diff === 'EASY') difficultyCounts.EASY += 1;
    else if (diff === 'HARD') difficultyCounts.HARD += 1;
    else difficultyCounts.MEDIUM += 1;

    const t = String(q.type || 'PILIHAN_GANDA').toUpperCase();
    if (t === 'ISIAN_SINGKAT' || t === 'SHORT_ANSWER') {
      typeCounts.ISIAN_SINGKAT += 1;
    } else {
      typeCounts.PILIHAN_GANDA += 1;
    }

    if (q.subtopicId) {
      subtopicCountMap.set(q.subtopicId, (subtopicCountMap.get(q.subtopicId) || 0) + 1);
    }
    if (q.subtopicTitle) {
      const k = q.subtopicTitle.trim().toLowerCase();
      subtopicTitleCountMap.set(k, (subtopicTitleCountMap.get(k) || 0) + 1);
    }
  }

  const existingTotal = packageQuestions.length;
  const existingIsianPct = existingTotal > 0 ? Math.round((typeCounts.ISIAN_SINGKAT / existingTotal) * 100) : 0;
  const existingEasyPct = existingTotal > 0 ? Math.round((difficultyCounts.EASY / existingTotal) * 100) : 0;
  const existingHardPct = existingTotal > 0 ? Math.round((difficultyCounts.HARD / existingTotal) * 100) : 0;
  const existingMedPct = existingTotal > 0 ? Math.max(0, 100 - existingEasyPct - existingHardPct) : 0;

  // Gap / Deficit calculation: Target Settings - Existing State
  const totalAfterBatch = existingTotal + safeCount;
  const idealIsianTotal = Math.round((totalAfterBatch * resolvedTargetIsianPct) / 100);
  const isianDeficit = Math.max(0, idealIsianTotal - typeCounts.ISIAN_SINGKAT);
  const batchIsianTarget = Math.min(safeCount, isianDeficit);

  const idealEasyTotal = Math.round(totalAfterBatch * normRatio.easyShare);
  const idealHardTotal = Math.round(totalAfterBatch * normRatio.hardShare);
  const idealMedTotal = Math.max(0, totalAfterBatch - idealEasyTotal - idealHardTotal);
  const easyDeficit = idealEasyTotal - difficultyCounts.EASY;
  const medDeficit = idealMedTotal - difficultyCounts.MEDIUM;
  const hardDeficit = idealHardTotal - difficultyCounts.HARD;
  const pgDeficit = Math.max(0, (totalAfterBatch - idealIsianTotal) - typeCounts.PILIHAN_GANDA);

  type FlatSubtopic = {
    subtestKey: string;
    topicId: string;
    topicTitle: string;
    subtopicId: string;
    subtopicTitle: string;
    existingCount: number;
  };

  const allSubtopics: FlatSubtopic[] = [];
  for (const t of curriculumTopics || []) {
    const stKey = normalizeSubtestKey(t.subtest);
    for (const s of t.subtopics || []) {
      const byId = subtopicCountMap.get(s.id) || 0;
      const byTitle = subtopicTitleCountMap.get((s.title || '').trim().toLowerCase()) || 0;
      const existingCount = Math.max(byId, byTitle);
      allSubtopics.push({
        subtestKey: stKey,
        topicId: t.id,
        topicTitle: t.title,
        subtopicId: s.id,
        subtopicTitle: s.title,
        existingCount,
      });
    }
  }

  const uncoveredSubtopicsCount = allSubtopics.filter((s) => s.existingCount === 0).length;

  const simSubtestCounts: Record<string, number> = {};
  for (const k of Object.keys(subtestCounts)) {
    simSubtestCounts[k] = subtestCounts[k].count;
  }
  const simDiff = { ...difficultyCounts };
  const simSubtopicCounts = new Map<string, number>();
  for (const item of allSubtopics) {
    simSubtopicCounts.set(item.subtopicId, item.existingCount);
  }

  let remainingBatchIsian = batchIsianTarget;
  const slots: AutoBalanceSlot[] = [];

  for (let i = 0; i < safeCount; i++) {
    let chosenSubtestKey =
      scopeSubtest && scopeSubtest !== 'AUTO' ? normalizeSubtestKey(scopeSubtest) : '';
    if (!chosenSubtestKey || !subtestCounts[chosenSubtestKey]) {
      const eligible = safeCount - i <= remainingBatchIsian
        ? OFFICIAL_SNBT_SUBTEST_SPEC.filter(spec => supportsNumericSlot(spec.value))
        : OFFICIAL_SNBT_SUBTEST_SPEC;
      const rankedSubtests = eligible.slice().sort((a, b) => {
        const countA = simSubtestCounts[a.value] ?? 0;
        const countB = simSubtestCounts[b.value] ?? 0;
        const quotaA = destination === 'FOR_TRYOUT' ? a.fullQuestionTarget : 20;
        const quotaB = destination === 'FOR_TRYOUT' ? b.fullQuestionTarget : 20;
        const ratioA = countA / quotaA;
        const ratioB = countB / quotaB;
        if (Math.abs(ratioA - ratioB) > 0.01) return ratioA - ratioB;
        return countA - countB;
      });
      chosenSubtestKey = rankedSubtests[0]?.value || 'PENALARAN_UMUM';
    }

    const totalAfter = simDiff.EASY + simDiff.MEDIUM + simDiff.HARD + 1;
    const allCandidates: Array<{ diff: 'EASY' | 'MEDIUM' | 'HARD'; share: number; deficit: number }> = [
      { diff: 'EASY', share: normRatio.easyShare, deficit: totalAfter * normRatio.easyShare - simDiff.EASY },
      { diff: 'MEDIUM', share: normRatio.mediumShare, deficit: totalAfter * normRatio.mediumShare - simDiff.MEDIUM },
      { diff: 'HARD', share: normRatio.hardShare, deficit: totalAfter * normRatio.hardShare - simDiff.HARD },
    ];
    const candidates = allCandidates.filter((c) => c.share > 0).sort((a, b) => b.deficit - a.deficit);
    const chosenDiff: 'EASY' | 'MEDIUM' | 'HARD' = candidates[0]?.diff || 'MEDIUM';

    const candidateSubtopics = allSubtopics
      .filter((s) => s.subtestKey === chosenSubtestKey)
      .sort((a, b) => {
        const ca = simSubtopicCounts.get(a.subtopicId) ?? a.existingCount;
        const cb = simSubtopicCounts.get(b.subtopicId) ?? b.existingCount;
        return ca - cb;
      });

    const chosenSubtopic = candidateSubtopics[0];
    const subDisplay = getSubtestDisplay(chosenSubtestKey);
    const currentSubCount = chosenSubtopic
      ? (simSubtopicCounts.get(chosenSubtopic.subtopicId) ?? chosenSubtopic.existingCount)
      : 0;

    const useNumeric = remainingBatchIsian > 0 && supportsNumericSlot(chosenSubtestKey);
    const slotType = useNumeric ? 'ISIAN_SINGKAT' : 'PILIHAN_GANDA';
    if (useNumeric) remainingBatchIsian--;

    slots.push({
      index: i + 1,
      subtest: chosenSubtestKey,
      subtestShort: subDisplay.code,
      subtestLabel: subDisplay.label,
      topicId: chosenSubtopic?.topicId || '',
      topicTitle: chosenSubtopic?.topicTitle || `Topik ${subDisplay.label}`,
      subtopicId: chosenSubtopic?.subtopicId || '',
      subtopicTitle: chosenSubtopic?.subtopicTitle || `Subtopik Inti ${subDisplay.code} #${i + 1}`,
      questionType: slotType,
      difficulty: chosenDiff,
      currentSubtopicCount: currentSubCount,
      reason:
        currentSubCount === 0
          ? `Subtopik belum tercover di paket · Target ${slotType === 'ISIAN_SINGKAT' ? 'Isian Singkat' : 'PG'} ${chosenDiff} (mengejar target setting)`
          : `Subtopik baru ${currentSubCount} soal · Target ${slotType === 'ISIAN_SINGKAT' ? 'Isian Singkat' : 'PG'} ${chosenDiff}`,
    });

    simSubtestCounts[chosenSubtestKey] = (simSubtestCounts[chosenSubtestKey] ?? 0) + 1;
    simDiff[chosenDiff] += 1;
    if (chosenSubtopic) {
      simSubtopicCounts.set(chosenSubtopic.subtopicId, currentSubCount + 1);
    }
  }

  return {
    totalInPackage: packageQuestions.length,
    subtestCounts,
    difficultyCounts,
    typeCounts,
    targetDifficultyPct: {
      easy: normRatio.easyPct,
      medium: normRatio.mediumPct,
      hard: normRatio.hardPct,
    },
    targetIsianPct: resolvedTargetIsianPct,
    existingDifficultyPct: {
      easy: existingEasyPct,
      medium: existingMedPct,
      hard: existingHardPct,
    },
    existingIsianPct,
    deficit: {
      isian: isianDeficit,
      pg: pgDeficit,
      easy: easyDeficit,
      medium: medDeficit,
      hard: hardDeficit,
    },
    uncoveredSubtopicsCount,
    totalCurriculumSubtopics: allSubtopics.length,
    slots,
  };
}

export const PROMPT_SYSTEM_IDENTITY = `Kamu adalah Guru & Tutor Pembahasan UTBK SNBT terbaik di Indonesia di platform Jitu PTN yang ahli menyusun soal berstandar resmi BPPP SNBT Kemendikbudristek sekaligus menjelaskan jawabannya dengan bahasa yang santai, jelas, dan super gampang dipahami oleh anak SMA kelas 12.`;

export function buildQuestionTypeHeading(questionType: string): string {
  if (questionType === 'ISIAN_SINGKAT') {
    return 'SOAL ISIAN SINGKAT (STANDAR RESMI BPPP UTBK SNBT)';
  }
  if (questionType === 'CAMPURAN') {
    return 'KOMBINASI PILIHAN GANDA (A-E) DAN ISIAN SINGKAT (STANDAR RESMI UTBK SNBT TERBARU)';
  }
  return 'SOAL PILIHAN GANDA 5 OPSI (A, B, C, D, E)';
}

export function buildTypeSpecificRules(questionType: string): string {
  if (questionType === 'ISIAN_SINGKAT') {
    return `KETENTUAN KHUSUS PEMBUATAN SOAL ISIAN SINGKAT (STANDAR BPPP UTBK):
1. Target Subtes Resmi: Soal isian singkat resmi UTBK SNBT BPPP ditujukan untuk subtes Pengetahuan Kuantitatif (PK) dan Penalaran Matematika (PM).
2. Pertanyaan Menuntut Jawaban Pasti: Pertanyaan WAJIB dirumuskan secara eksplisit sehingga menghasilkan nilai akhir matematis tunggal dan pasti (tidak ambigu dan bukan berupa rentang jawaban).
3. PETUNJUK FORMAT MENJAWAB WAJIB DICANTUMKAN PADA TEKS SOAL:
   Pada akhir teks pertanyaan (field "content"), kamu WAJIB mencantumkan petunjuk format menjawab baku dalam tanda kurung siku berikut:
   "\\n\\n${SHORT_ANSWER_FORMAT_TAG}"
4. Kunci Jawaban (field "correctAnswer"):
   Field "correctAnswer" HARUS diisi string angka murni (contoh: "42" atau "1250"), BUKAN kalimat dan TANPA satuan (jangan tulis "42 cm" atau "x = 42").
5. Field "options": Harus berupa array kosong [] (karena bertipe isian singkat).
6. Field "type": Bernilai "ISIAN_SINGKAT".`;
  }

  if (questionType === 'CAMPURAN') {
    return `KETENTUAN TIPE SOAL CAMPURAN (PILIHAN GANDA & ISIAN SINGKAT):
1. Untuk butir bertipe "PILIHAN_GANDA":
   - "type": "PILIHAN_GANDA"
   - "options": 5 opsi (A, B, C, D, E) dengan tepat 1 "isCorrect": true dan 4 pengecoh logis yang mengeksploitasi miskonsepsi umum siswa.
   - "correctAnswer": null
2. Untuk butir bertipe "ISIAN_SINGKAT":
   - "type": "ISIAN_SINGKAT"
   - Pada akhir "content", WAJIB sertakan: "\\n\\n${SHORT_ANSWER_FORMAT_TAG}"
   - "correctAnswer": String angka bulat murni (contoh: "25") tanpa satuan dan tanpa desimal semu.
   - "options": Array kosong [].`;
  }

  return `KETENTUAN KHUSUS SOAL PILIHAN GANDA (A-E):
1. Opsi Jawaban: Tepat 5 pilihan ganda (A, B, C, D, E) pada array "options".
2. Tepat 1 opsi "isCorrect": true, dan 4 opsi lainnya "isCorrect": false.
3. Kualitas Pengecoh (Distraktor): 4 distraktor harus berasal dari miskonsepsi atau kesalahan hitung umum siswa (contoh: tanda aljabar terbalik, lupa mengalikan skalar, salah subtitusi), BUKAN angka asal.
4. "type": "PILIHAN_GANDA", dan "correctAnswer": null.`;
}

export function buildPassageInstruction(includePassage = true): string {
  return includePassage
    ? '- Untuk subtes berbasis literasi/bahasa (PBM, PPU, LBI, LBE) atau soal kontekstual naratif, cantumkan wacana/stimulus bermutu pada field "narration".'
    : '- Soal dibuat langsung fokus pertanyaan (kosongkan string "narration" jika tidak memerlukan teks wacana panjang).';
}

export function buildTrickInstruction(includeTricks = true): string {
  return includeTricks
    ? '- Pada bagian "solution", WAJIB cantumkan "keyFormula" (rumus inti + kapan dipakainya), "quickTrick" (Petunjuk khas soal dan cara memakainya untuk mempersingkat penyelesaian, atau string kosong), serta array "solutionSteps" berjumlah FLEKSIBEL (1-6 langkah) memakai bahasa ringan yang gampang dipahami siswa SMA (jangan dipaksa selalu 3 langkah).'
    : '- Pada bagian "solution", sertakan array "solutionSteps" berjumlah FLEKSIBEL (1-6 langkah) menyesuaikan karakteristik soal dengan gaya bahasa tutor yang santai, ringan, dan mudah dipahami anak SMA.';
}

export function buildJsonStructureExample(firstItem: {
  subtest: string;
  topicId?: string;
  subtopicId?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  type?: string;
  isSingle?: boolean;
}): string {
  const isIsian = firstItem.type === 'ISIAN_SINGKAT';
  const subtest = firstItem.subtest || 'PENALARAN_MATEMATIKA';
  const topicId = firstItem.topicId || '';
  const subtopicId = firstItem.subtopicId || '';
  const topic = firstItem.topic || 'Aljabar & Persamaan';
  const subtopic = firstItem.subtopic || 'Persamaan Kuadrat';
  const difficulty = firstItem.difficulty || 'MEDIUM';
  const type = isIsian ? 'ISIAN_SINGKAT' : 'PILIHAN_GANDA';
  const isSingle = Boolean(firstItem.isSingle);

  return `${isSingle ? '' : '[\n'}  {
    "subtest": "${subtest}",
    "topicId": "${topicId}",
    "subtopicId": "${subtopicId}",
    "topic": "${topic}",
    "subtopic": "${subtopic}",
    "difficulty": "${difficulty}",
    "type": "${type}",
    "narration": "Teks wacana atau konteks bacaan jika ada (kosongkan string jika tidak ada)",
    "content": "${
      isIsian
        ? `Pertanyaan soal yang spesifik dan menuntut angka pasti...\\n\\n${SHORT_ANSWER_FORMAT_TAG}`
        : 'Pertanyaan soal yang jelas, menuntut analisis nalar, dan tidak ambigu...'
    }",
    "points": 1,
    "correctAnswer": ${isIsian ? '"42"' : 'null'},
    "options": ${
      isIsian
        ? '[]'
        : `[
      { "content": "Pernyataan / opsi A", "isCorrect": false },
      { "content": "Pernyataan / opsi B", "isCorrect": true },
      { "content": "Pernyataan / opsi C", "isCorrect": false },
      { "content": "Pernyataan / opsi D", "isCorrect": false },
      { "content": "Pernyataan / opsi E", "isCorrect": false }
    ]`
    },
    "staticExplanation": "Ringkasan 1-2 kalimat santai kenapa opsi tersebut benar",
    "quickTrick": "Petunjuk khas soal dan cara memakainya untuk mempersingkat penyelesaian, atau string kosong",
    "keyFormula": "Rumus inti yang dipakai + 1 kalimat sederhana kapan rumus ini digunakan",
    "solutionSteps": ${solutionStepsExample()}
  }${isSingle ? '' : '\n]'}`;
}

export function buildAutoBalancedBatchPrompt(params: {
  packageLabel: string;
  slots: AutoBalanceSlot[];
  questionType?: string;
  customInstruction?: string;
  difficultyRatio?: DifficultyComposition;
  targetIsianPct?: number;
  existingTotalInPackage?: number;
  includePassage?: boolean;
  includeTricks?: boolean;
}): string {
  const {
    packageLabel,
    slots,
    customInstruction = '',
    includePassage = true,
    includeTricks = true,
  } = params;

  const totalSlots = slots.length;
  const pgSlots = slots.filter((s) => s.questionType === 'PILIHAN_GANDA');
  const isianSlots = slots.filter((s) => s.questionType === 'ISIAN_SINGKAT');

  const slotDiffSummary = slots.reduce(
    (acc, s) => {
      acc[s.difficulty] += 1;
      return acc;
    },
    { EASY: 0, MEDIUM: 0, HARD: 0 },
  );

  const resolvedQuestionType =
    pgSlots.length > 0 && isianSlots.length > 0
      ? 'CAMPURAN'
      : isianSlots.length > 0
      ? 'ISIAN_SINGKAT'
      : 'PILIHAN_GANDA';

  const questionTypeHeading = buildQuestionTypeHeading(resolvedQuestionType);

  const slotLines = slots
    .map(
      (s) =>
        `- Butir #${s.index}: Subtes="${s.subtest}" (${s.subtestShort}) | Tipe="${s.questionType}" | Topik="${s.topicTitle}" | Subtopik="${s.subtopicTitle}" | topicId="${s.topicId}" | subtopicId="${s.subtopicId}" | Difficulty="${s.difficulty}"`,
    )
    .join('\n');

  const targetSubtests = Array.from(new Set(slots.map((s) => s.subtestShort || s.subtest))).join(', ');
  const firstSlot = slots[0];

  return `${PROMPT_SYSTEM_IDENTITY}

TUGAS UTAMA:
Buatkan ${totalSlots} butir ${questionTypeHeading} yang 100% orisinal, terkalibrasi akurat, dan memenuhi standar kisi-kisi resmi BPPP SNBT untuk paket: "${packageLabel}".

SPESIFIKASI & DISTRIBUSI SOAL:
- Mode Penyusunan: Auto-Balance Berdasarkan Gap Kurikulum & Target Komposisi
- Tipe Soal: ${pgSlots.length} Pilihan Ganda (A-E) · ${isianSlots.length} Isian Singkat
- Tingkat Kesulitan: ${slotDiffSummary.EASY} Mudah · ${slotDiffSummary.MEDIUM} Sedang · ${slotDiffSummary.HARD} Sulit HOTS
Total Keseluruhan: ${totalSlots} butir soal

DAFTAR SLOT BUTIR (WAJIB DIIKUTI PERSIS SESUAI PEMETAAN DARI BUTIR #1 SAMPAI #${totalSlots}):
${slotLines}

PARAMETER SOAL:
- Target Subtes: ${targetSubtests}
- Notasi Matematika/Sains: Seluruh rumus, variabel matematika, pecahan, dan persamaan WAJIB ditulis dengan format LaTeX inline yang valid (contoh: $f(x) = ax^2 + bx + c$, $\\frac{a}{b}$, $\\sqrt{D}$, $x \\le 4$).
- Escape Karakter Backslash LaTeX (PENTING): Seluruh sintaks LaTeX di dalam string JSON WAJIB di-escape ganda (contoh: \\\\frac{a}{b}, \\\\sqrt{D}, \\\\le, \\\\ge) agar string JSON valid saat diparse.
- Kerapian Baris Teks Soal ("content" & "narration"): Gunakan newline ("\\n" dan "\\n\\n" dalam string JSON) untuk memisahkan paragraf serta daftar pernyataan bernomor (1), (2), (3), (4) atau perbandingan P dan Q agar setiap pernyataan turun ke baris baru dan mudah dibaca (contoh: "Pertanyaan?\\n\\n(1) ...\\n(2) ...\\n\\nPilih jawaban...").
${buildPassageInstruction(includePassage)}
${buildTrickInstruction(includeTricks)}
${customInstruction.trim() ? `\n- Catatan / Instruksi Khusus Penyusun:\n${customInstruction.trim()}` : ''}

${QUESTION_QUALITY_RULES}
${buildTypeSpecificRules(resolvedQuestionType)}

${SOLUTION_FORMATTING_RULES}

PRINSIP KOGNITIF & FORMAT MENJAWAB:
- Siswa tidak boleh dirugikan akibat format jawaban; format isian harus sangat jelas sehingga tidak ada kebingungan antara angka desimal vs bilangan bulat atau penggunaan satuan.
- Soal harus menguji daya nalar dan pemecahan masalah (Problem Solving / HOTS), bukan sekadar mengingat rumus tanpa pemahaman konsep.
- Stimulus bacaan/data autentik, relevan dengan fenomena nyata, dan bebas dari multitafsir atau ambiguitas kalimat.

FORMAT KELUARAN (OUTPUT RAW JSON MURNI):
- Berikan HANYA teks raw JSON murni langsung di dalam balasan obrolan (tanpa bungkus markdown code block seperti \`\`\`json dan tanpa teks pembuka/penutup).
- Karakter pertama respons wajib '[' dan karakter terakhir ']'.
- Seluruh rumus matematika / LaTeX di dalam string JSON WAJIB di-escape ganda (contoh: \\\\frac, \\\\sqrt, \\\\le, \\\\ge) agar string JSON valid saat diparse.

STRUKTUR JSON YANG WAJIB DIPATUHI:
${buildJsonStructureExample({
  subtest: firstSlot?.subtest || 'PENALARAN_MATEMATIKA',
  topicId: firstSlot?.topicId || '',
  subtopicId: firstSlot?.subtopicId || '',
  topic: firstSlot?.topicTitle || 'Aljabar & Persamaan',
  subtopic: firstSlot?.subtopicTitle || 'Persamaan Kuadrat',
  difficulty: firstSlot?.difficulty || 'MEDIUM',
  type: firstSlot?.questionType || 'PILIHAN_GANDA',
  isSingle: false,
})}`;
}

export function buildManualBatchPrompt(params: {
  packageLabel: string;
  totalCount: number;
  activeSubtestEntries: Array<[string, number]>;
  promptDifficulty: string;
  normalizedDifficultyComposition: { easyPct: number; mediumPct: number; hardPct: number };
  promptQuestionType: string;
  selectedSubtopicMeta?: {
    topicTitle: string;
    subtopicTitle: string;
    subtestLabel: string;
    patterns: string[];
    topicId?: string;
    subtopicId?: string;
  } | null;
  promptCustomTopic?: string;
  includePassage?: boolean;
  includeTricks?: boolean;
}): string {
  const {
    packageLabel,
    totalCount,
    activeSubtestEntries,
    promptDifficulty,
    normalizedDifficultyComposition,
    promptQuestionType,
    selectedSubtopicMeta,
    promptCustomTopic = '',
    includePassage = true,
    includeTricks = true,
  } = params;

  const subtestBreakdown =
    activeSubtestEntries.length > 0
      ? activeSubtestEntries
          .map(([subId, count]) => {
            const subMeta = LIFECYCLE_SUBTESTS.find((item) => item.value === subId);
            return `- ${subMeta?.label || subId}: ${count} butir soal`;
          })
          .join('\n')
      : '- Penalaran Matematika (PM): 5 butir soal';

  const targetSubtestNames =
    activeSubtestEntries.length > 0
      ? activeSubtestEntries
          .map(([subId]) => LIFECYCLE_SUBTESTS.find((item) => item.value === subId)?.label || subId)
          .join(', ')
      : 'Penalaran Matematika (PM)';

  const diffText =
    promptDifficulty === 'EASY'
      ? 'Mudah (Konseptual & Fundamental Dasar)'
      : promptDifficulty === 'HARD'
      ? 'Sulit (HOTS - High Order Thinking Skills, Analitis & Multi-Tahap)'
      : promptDifficulty === 'MIXED'
      ? `Campuran Berimbang (${normalizedDifficultyComposition.easyPct}% Mudah, ${normalizedDifficultyComposition.mediumPct}% Sedang, ${normalizedDifficultyComposition.hardPct}% Sulit HOTS)`
      : 'Sedang (Standar Resmi UTBK SNBT BPPP Kemendikbudristek)';

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

  const hasVerbal = activeSubtestEntries.some(([key]) => !supportsNumericSlot(key));
  const hasNumeric = !activeSubtestEntries.length || activeSubtestEntries.some(([key]) => supportsNumericSlot(key));
  const resolvedType = !hasNumeric ? 'PILIHAN_GANDA'
    : hasVerbal && promptQuestionType === 'ISIAN_SINGKAT' ? 'CAMPURAN' : promptQuestionType;
  const questionTypeHeading = buildQuestionTypeHeading(resolvedType);
  const primarySubtestId = activeSubtestEntries[0]?.[0] || 'PENALARAN_MATEMATIKA';

  return `${PROMPT_SYSTEM_IDENTITY}

TUGAS UTAMA:
Buatkan ${totalCount} butir ${questionTypeHeading} yang 100% orisinal, terkalibrasi akurat, dan memenuhi standar kisi-kisi resmi BPPP SNBT untuk paket: "${packageLabel}".

SPESIFIKASI & DISTRIBUSI SOAL:
${subtestBreakdown}
Total Keseluruhan: ${totalCount} butir soal

PARAMETER SOAL:
- Target Subtes: ${targetSubtestNames}
- Tingkat Kesulitan: ${diffText}
${topicLine}
- Notasi Matematika/Sains: Seluruh rumus, variabel matematika, pecahan, dan persamaan WAJIB ditulis dengan format LaTeX inline yang valid (contoh: $f(x) = ax^2 + bx + c$, $\\frac{a}{b}$, $\\sqrt{D}$, $x \\le 4$).
- Escape Karakter Backslash LaTeX (PENTING): Seluruh sintaks LaTeX di dalam string JSON WAJIB di-escape ganda (contoh: \\\\frac{a}{b}, \\\\sqrt{D}, \\\\le, \\\\ge) agar string JSON valid saat diparse.
- Kerapian Baris Teks Soal ("content" & "narration"): Gunakan newline ("\\n" dan "\\n\\n" dalam string JSON) untuk memisahkan paragraf serta daftar pernyataan bernomor (1), (2), (3), (4) atau perbandingan P dan Q agar setiap pernyataan turun ke baris baru dan mudah dibaca (contoh: "Pertanyaan?\\n\\n(1) ...\\n(2) ...\\n\\nPilih jawaban...").
${buildPassageInstruction(includePassage)}
${buildTrickInstruction(includeTricks)}

${QUESTION_QUALITY_RULES}
${buildTypeSpecificRules(resolvedType)}

${SOLUTION_FORMATTING_RULES}

PRINSIP KOGNITIF & FORMAT MENJAWAB:
- Siswa tidak boleh dirugikan akibat format jawaban; format isian harus sangat jelas sehingga tidak ada kebingungan antara angka desimal vs bilangan bulat atau penggunaan satuan.
- Soal harus menguji daya nalar dan pemecahan masalah (Problem Solving / HOTS), bukan sekadar mengingat rumus tanpa pemahaman konsep.
- Stimulus bacaan/data autentik, relevan dengan fenomena nyata, dan bebas dari multitafsir atau ambiguitas kalimat.

FORMAT KELUARAN (OUTPUT RAW JSON MURNI):
- Berikan HANYA teks raw JSON murni langsung di dalam balasan obrolan (tanpa bungkus markdown code block seperti \`\`\`json dan tanpa teks pembuka/penutup).
- Karakter pertama respons wajib '[' (atau '{' jika hanya 1 butir) dan karakter terakhir ']' (atau '}').
- Seluruh rumus matematika / LaTeX di dalam string JSON WAJIB di-escape ganda (contoh: \\\\frac, \\\\sqrt, \\\\le, \\\\ge) agar string JSON valid saat diparse.

STRUKTUR JSON YANG WAJIB DIPATUHI:
${buildJsonStructureExample({
  subtest: primarySubtestId,
  topicId: selectedSubtopicMeta?.topicId || '',
  subtopicId: selectedSubtopicMeta?.subtopicId || '',
  topic: selectedSubtopicMeta?.topicTitle || 'Aljabar & Persamaan',
  subtopic: selectedSubtopicMeta?.subtopicTitle || 'Persamaan Kuadrat',
  difficulty: promptDifficulty === 'MIXED' ? 'MEDIUM' : promptDifficulty,
  type: supportsNumericSlot(primarySubtestId) && resolvedType === 'ISIAN_SINGKAT' ? 'ISIAN_SINGKAT' : 'PILIHAN_GANDA',
  isSingle: totalCount <= 1,
})}`;
}
