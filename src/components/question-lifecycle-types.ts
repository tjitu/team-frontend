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

export const SOLUTION_FORMATTING_RULES = [
  'ATURAN GAYA BAHASA & PENYUSUNAN PEMBAHASAN (WAJIB RAMAH ANAK SMA):',
  '- PERSONA & GAYA BAHASA: Tulis seperti kakak tutor bimbel UTBK yang sabar, ramah, dan langsung ke inti saat menjelaskan ke anak kelas 12 SMA. Gunakan bahasa Indonesia yang santai, sopan, ringan, dan mengalir (contoh: "masukkan ke rumus", "cukup cari $U_5$ saja", "nggak perlu cari satu-satu", "coba tes pakai angka", "hasilnya masih bisa beda-beda").',
  '- HINDARI BAHASA KAKU / DIKTAT KULIAH: Jangan memakai kata berat atau kaku seperti "substitusikan", "diperoleh nilai antara", "contoh penyangkal", "nilai tidak tunggal", "secara terpisah", "mendefinisikan variabel & besaran", "langkah perhitungan sistematis", atau menjelaskan dengan kalimat berbelit.',
  '- ALUR BERPIKIR BERTAHAP (JANGAN LOMPAT SIMBOL):',
  '  * Awali setiap langkah dengan 1 kalimat pengantar ringan tentang TUJUAN langkah itu ("Kenapa kita hitung ini?"), bukan langsung menempelkan deretan persamaan aljabar.',
  '  * Jika berpindah antar-bentuk rumus yang sering dilupakan siswa SMA (mis. $a + 4d = U_5$), tuliskan pengingat singkatnya ("Ingat, $U_5 = a + 4d$, jadi...") sebelum atau sesudah rumus.',
  '  * Pecah perhitungan panjang menjadi baris pendek (1 langkah kecil per baris, jangan menumpuk 3 tanda "=" memanjang dalam satu baris).',
  '- JUMLAH LANGKAH ("steps" / "solutionSteps") FLEKSIBEL (2 sampai 6 langkah) menyesuaikan karakteristik tiap soal — JANGAN dipaksa selalu 3 langkah:',
  '  * Soal langsung/konseptual/literasi singkat cukup 2-3 langkah.',
  '  * Soal hitung bertahap, multi-konsep, atau analisis pernyataan (1)-(4) pecah menjadi 4-6 langkah agar tiap slide fokus 1 hal kecil saja.',
  '  * Gunakan "category" (label tab, maks 1-2 kata) dan "title" yang natural untuk siswa (contoh category: "Pahami Soal", "Cek (1)", "Cek (2)", "Cari x", "Hitung Total", "Kesimpulan").',
  '- BATAS TINGGI PER SLIDE (BIAR RINGKAS & ENAK DIBACA):',
  '  * Tiap slide langkah cukup 3-5 baris singkat dan MAKSIMAL 1-2 blok persamaan $$...$$. Gunakan $...$ inline untuk hitungan ringan, dan $$...$$ hanya untuk persamaan utamanya.',
  '  * Jangan menulis 1 paragraf padat memanjang. Gunakan newline ("\\n" di JSON), bullet "- ...", dan "\\n\\n" antar bagian.',
  '- DUA TINGKAT PENEKANAN:',
  '  1. **teks** (Tebal Biasa): untuk info diketahui, angka penting, atau hasil sementara.',
  '  2. ==teks== (Stabilo Kuning Animasi — KETAT & SELEKTIF): MAKSIMAL 1-2 frasa pendek per langkah khusus untuk poin kunci / kesimpulan paling menentukan.',
  '- "keyFormula" & "quickTrick" (jika ada):',
  '  * "keyFormula": tuliskan rumus intinya saja + 1 kalimat sederhana kapan rumus itu dipakai.',
  '  * "quickTrick": tuliskan cara cepat ala kakak tutor (2-3 kalimat ringan yang langsung menunjukkan pola/eliminasi opsi paling gampang).',
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
    SOLUTION_FORMATTING_RULES,
    '',
    '=== ATURAN OUTPUT ===',
    '1. Kembalikan HANYA 1 objek JSON valid (tanpa teks pengantar atau markdown tambahan jika memungkinkan, atau di dalam blok ```json).',
    '2. Gunakan format LaTeX $...$ untuk rumus inline dan $$...$$ di baris baru untuk persamaan inti; pastikan semua backslash di-escape ganda (\\\\) agar valid JSON.',
    '3. Untuk MULTIPLE_CHOICE, pastikan tepat 1 opsi memiliki "isCorrect": true. Untuk SHORT_ANSWER, isi field "correctAnswer".',
    '4. Jumlah item pada "solutionSteps" fleksibel (2-6 langkah) dengan gaya bahasa ramah anak SMA, mengikuti struktur JSON:',
    '{"subtest":"...","difficulty":"...","type":"...","narration":"...","content":"...","correctAnswer":"...","options":[{"order":0,"content":"...","isCorrect":false}],"keyFormula":"Rumus inti yang dipakai + 1 kalimat kapan dipakainya","quickTrick":"Tips cepat ala kakak tutor (2-3 kalimat ringan cara ngeh pola/eliminasi opsi)","staticExplanation":"Ringkasan 1-2 kalimat kenapa jawabannya tepat","solutionSteps":[{"stepNumber":1,"category":"Pahami Soal","title":"Cari Tahu Targetnya","content":"Dari soal kita tahu:\\n- **Info 1:** ...\\n- **Info 2:** ...\\n\\n==Inti ide awal supaya gampang lanjut ke hitungan.=="},{"stepNumber":2,"category":"Tahap 1","title":"Langkah Awal (Tambah/Kurangi Step Sesuai Soal)","content":"Supaya gampang, kita hitung bagian ini dulu:\\n$$...$$\\nDari sini ketemu **...**, ==jadi jawabannya tinggal selangkah lagi==."}]}',
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
    '=== FORMAT OUTPUT WAJIB (JSON VALID, JUMLAH STEP 2-6 ADAPTIF SESUAI SOAL) ===',
    `{${keyFieldExample},"keyFormula":"Rumus inti + kapan dipakainya","quickTrick":"Trik cepat 30 detik ala kakak tutor","staticExplanation":"Ringkasan singkat kenapa jawaban itu benar","solutionSteps":[{"stepNumber":1,"category":"Pahami Soal","title":"Kenali Info & Targetnya","content":"Dari soal kita punya:\\n- **Info 1:** ...\\n\\n==Strategi paling gampang untuk mulai mengerjakan.=="},{"stepNumber":2,"category":"Tahap 1","title":"Hitung Bagian Inti","content":"Kita cari nilai utamanya dulu:\\n$$...$$\\nDari hitungan ini ketemu **...**."},{"stepNumber":3,"category":"Kesimpulan","title":"Jadi Jawabannya...","content":"${conclusionExample}"}]}`,
    '',
    'Catatan: Pakai bahasa yang santai, jelas, tidak berbelit seperti buku kuliahan. Tambah/kurangi jumlah "solutionSteps" (2-6 langkah) sesuai kebutuhan soal agar tiap slide tetap ringkas, dan escape semua backslash LaTeX menjadi \\\\ agar JSON valid.',
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
      { "id": "A", "label": "A", "content": "Opsi A" },
      { "id": "B", "label": "B", "content": "Opsi B" },
      { "id": "C", "label": "C", "content": "Opsi C" },
      { "id": "D", "label": "D", "content": "Opsi D" },
      { "id": "E", "label": "E", "content": "Opsi E" }
    ],
    "keyAnswer": "B",
    "keyFormula": "Rumus/konsep inti + kapan dipakainya",
    "quickTrick": "Trik cepat 30 detik ala kakak tutor",
    "staticExplanation": "Ringkasan 1-2 kalimat kenapa B benar",
    "solutionSteps": [
      { "stepNumber": 1, "category": "Pahami Soal", "title": "Kenali Info & Targetnya", "content": "Dari soal kita punya:\\n- **Info 1:** ...\\n\\n==Fokus inti langkah pertama.==" },
      { "stepNumber": 2, "category": "Tahap 1", "title": "Eksekusi Inti", "content": "Kita hitung / telaah bagian utamanya..." },
      { "stepNumber": 3, "category": "Kesimpulan", "title": "Jadi Jawabannya...", "content": "Jadi jawaban yang tepat adalah **B**." }
    ]
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
  typeComposition?: QuestionTypeComposition;
  difficultyRatio?: DifficultyComposition;
}): PackageAutoBalanceAnalysis {
  const {
    destination,
    packageQuestions,
    curriculumTopics,
    count,
    scopeSubtest = 'AUTO',
    typeComposition,
    difficultyRatio,
  } = params;
  const safeCount = Math.max(1, Math.min(25, Number(count) || 5));
  const normRatio = normalizeDifficultyComposition(difficultyRatio);

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

  // Track existing isian count per subtest
  const existingIsianBySubtest: Record<string, number> = {};
  for (const q of packageQuestions) {
    const t = String(q.type || 'PILIHAN_GANDA').toUpperCase();
    if (t === 'ISIAN_SINGKAT' || t === 'SHORT_ANSWER') {
      const normSub = normalizeSubtestKey(q.subtest || '');
      existingIsianBySubtest[normSub] = (existingIsianBySubtest[normSub] || 0) + 1;
    }
  }
  const simIsianBySubtest = { ...existingIsianBySubtest };

  const slots: AutoBalanceSlot[] = [];

  for (let i = 0; i < safeCount; i++) {
    let chosenSubtestKey =
      scopeSubtest && scopeSubtest !== 'AUTO' ? normalizeSubtestKey(scopeSubtest) : '';
    if (!chosenSubtestKey || !subtestCounts[chosenSubtestKey]) {
      const rankedSubtests = OFFICIAL_SNBT_SUBTEST_SPEC.slice().sort((a, b) => {
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

    // Automatic Question Type Allocation strictly based on SNBT BP3 Regulations:
    // Only PK (Pengetahuan Kuantitatif) and PM (Penalaran Matematika) have short answer questions (target 2-3 per 20 questions).
    // All other subtests are strictly 100% Multiple Choice (Pilihan Ganda A-E).
    const isMathSubtest =
      chosenSubtestKey === 'PENGETAHUAN_KUANTITATIF' || chosenSubtestKey === 'PENALARAN_MATEMATIKA';
    const targetIsianQuota = isMathSubtest ? 2 : 0;
    const currentIsianInSubtest = simIsianBySubtest[chosenSubtestKey] || 0;

    let slotType: 'PILIHAN_GANDA' | 'ISIAN_SINGKAT' = 'PILIHAN_GANDA';
    if (isMathSubtest && currentIsianInSubtest < targetIsianQuota) {
      slotType = 'ISIAN_SINGKAT';
      simIsianBySubtest[chosenSubtestKey] = currentIsianInSubtest + 1;
    }

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
          ? `Subtopik belum ada di paket (0 soal) · Target ${slotType === 'ISIAN_SINGKAT' ? 'Isian Singkat' : 'PG'} ${chosenDiff}`
          : `Subtopik baru ${currentSubCount} soal di paket · Target ${slotType === 'ISIAN_SINGKAT' ? 'Isian Singkat' : 'PG'} ${chosenDiff}`,
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
    uncoveredSubtopicsCount,
    totalCurriculumSubtopics: allSubtopics.length,
    slots,
  };
}

export function buildAutoBalancedBatchPrompt(params: {
  packageLabel: string;
  slots: AutoBalanceSlot[];
  questionType?: string;
  customInstruction?: string;
  difficultyRatio?: DifficultyComposition;
}): string {
  const {
    packageLabel,
    slots,
    customInstruction = '',
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

  const slotLines = slots
    .map(
      (s) =>
        `  - Butir #${s.index}: Subtes="${s.subtest}" (${s.subtestShort} - ${s.subtestLabel}) | Tipe="${s.questionType}" | Topik="${s.topicTitle}" | Subtopik="${s.subtopicTitle}" | topicId="${s.topicId}" | subtopicId="${s.subtopicId}" | Difficulty="${s.difficulty}" (${s.reason})`,
    )
    .join('\n');

  return `### IDENTITAS & PERAN SISTEM (ROLEPLAY)
Kamu adalah **Senior Assessment Specialist, Psychometrician, & Master Author Soal UTBK-SNBT di Jitu PTN**.
**Jitu PTN** adalah platform edukasi edtech terdepan di Indonesia yang mengkhususkan diri pada persiapan seleksi masuk Perguruan Tinggi Negeri (UTBK-SNBT). Jitu berfokus pada penalaran konseptual kritis (Higher-Order Thinking Skills / HOTS), eliminasi hafalan buta, dan penyajian pembahasan interaktif bertahap yang ramah siswa SMA (student-friendly, santai, komunikatif, tidak kaku, dengan trik cerdas "Jurus Jitu").

Seluruh butir soal yang kamu susun mengacu ketat pada standar resmi **Balai Pengelolaan Pengujian Pendidikan (BP3 / SNPMB Kemendikbudristek)** dengan karakteristik:
1. Stimulus bacaan/data autentik, relevan dengan fenomena nyata, dan tidak membosankan.
2. Logika inferensi yang presisi, bebas dari multitafsir atau ambiguitas kalimat.
3. Distraktor (opsi pengecoh) yang masuk akal dan berbasis miskonsepsi umum siswa, bukan angka/kata acak.
4. Daya beda psikometri tinggi yang secara efektif membedakan siswa berkemampuan tinggi dan rendah.

---

### MISI PEMBUATAN BATCH SOAL (AUTO-BALANCE ENGINE)
Buat tepat **${totalSlots} butir soal UTBK-SNBT baru** dengan mode **AUTO-BALANCE KURIKULUM & TIPE SOAL** untuk paket tujuan:
👉 **"${packageLabel}"**

**Komposisi Rencana Batch Ini:**
- **Tipe Soal:** ${pgSlots.length} Pilihan Ganda (A-E) · ${isianSlots.length} Isian Singkat
- **Tingkat Kesulitan:** ${slotDiffSummary.EASY} Mudah (Easy) · ${slotDiffSummary.MEDIUM} Sedang (Medium) · ${slotDiffSummary.HARD} Sulit (Hard HOTS)

---

### RENCANA DISTRIBUSI SLOT BUTIR (WAJIB DIIKUTI PERSIS DARI BUTIR #1 SAMPAI #${totalSlots}):
${slotLines}
${customInstruction.trim() ? `\n### INSTRUKSI TAMBAHAN DARI PENYUSUN:\n${customInstruction.trim()}\n` : ''}
---

### ATURAN KUALITAS & FORMAT STANDAR BP3 / JITU PTN:
1. **JSON Output Murni:** Kembalikan **HANYA** JSON Array valid \`[ ... ]\` berisi tepat ${totalSlots} objek butir soal tanpa teks pembuka/penutup di luar JSON.
2. **Field Metadata Wajib:** Setiap objek butir soal WAJIB menyertakan field \`"subtest"\`, \`"topicId"\`, \`"subtopicId"\`, \`"topic"\`, \`"subtopic"\`, \`"type"\`, dan \`"difficulty"\` persis sesuai pemetaan slot di atas!
3. **Ketentuan Tipe PILIHAN_GANDA:**
   - Field \`"type"\`: bernilai \`"PILIHAN_GANDA"\`.
   - Field \`"options"\`: berisi tepat 5 opsi (A, B, C, D, E) dengan tepat 1 \`"isCorrect": true\` dan 4 \`"isCorrect": false\`.
   - Field \`"correctAnswer"\`: bernilai \`null\`.
4. **Ketentuan Tipe ISIAN_SINGKAT (Standar SNBT):**
   - Field \`"type"\`: bernilai \`"ISIAN_SINGKAT"\`.
   - Field \`"options"\`: bernilai array kosong \`[]\`.
   - Field \`"correctAnswer"\`: string angka bilangan bulat eksak (contoh: \`"42"\`), tanpa satuan dan bukan desimal.
   - Pada akhir teks pertanyaan (field \`"content"\`), **WAJIB** cantumkan petunjuk format berikut:
     \`\\n\\n[PETUNJUK FORMAT: Tuliskan jawaban akhir hanya dalam bentuk bilangan bulat non-negatif (0-9999) tanpa satuan atau tanda baca. Contoh: 42]\`
5. **Format Soal & Rumus:**
   - Jika soal memuat pernyataan bernomor (1), (2), (3), (4) atau perbandingan P dan Q, wajib pisahkan setiap baris pernyataan dengan newline (\`\\n\`) di dalam \`"content"\`.
   - Wajib gunakan LaTeX format inline \`$...$\` atau block \`$$...$$\` untuk semua simbol dan rumus matematika.
6. **Pembahasan Pedagogis Khas Jitu PTN:**
   - Gunakan gaya bahasa tutor yang ramah, komunikatif, dan lugas (ala kakak pembimbing alumni PTN top).
   - Array \`"solutionSteps"\` wajib terdiri dari 2–5 langkah terstruktur dengan judul langkah yang jelas.
   - Cantumkan tag \`<hl>poin kesimpulan kunci</hl>\` maksimal 1 kali pada langkah inti untuk animasi stabilo interaktif.
   - Sertakan \`"quickTrick"\` (Jurus Cepat 30 detik JITU) dan \`"keyFormula"\` (rumus/konsep inti).

---

### CONTOH FORMAT JSON ARRAY VALID:
\`\`\`json
[
  {
    "subtest": "${slots[0]?.subtest || 'PENALARAN_UMUM'}",
    "topicId": "${slots[0]?.topicId || ''}",
    "subtopicId": "${slots[0]?.subtopicId || ''}",
    "topic": "${slots[0]?.topicTitle || 'Topik Inti'}",
    "subtopic": "${slots[0]?.subtopicTitle || 'Subtopik Inti'}",
    "difficulty": "${slots[0]?.difficulty || 'MEDIUM'}",
    "type": "${slots[0]?.questionType || 'PILIHAN_GANDA'}",
    "narration": "Stimulus bacaan atau konteks naratif jika diperlukan, atau null",
    "content": "Pertanyaan utama soal...",
    "options": [
      { "order": 1, "content": "Opsi A", "isCorrect": false },
      { "order": 2, "content": "Opsi B", "isCorrect": true },
      { "order": 3, "content": "Opsi C", "isCorrect": false },
      { "order": 4, "content": "Opsi D", "isCorrect": false },
      { "order": 5, "content": "Opsi E", "isCorrect": false }
    ],
    "correctAnswer": null,
    "quickTrick": "Jurus Cepat JITU: Perhatikan eliminasi langsung dari pola angka...",
    "keyFormula": "Konsep atau Teorema Utama",
    "solutionSteps": [
      { "order": 1, "title": "Pahami Masalah", "content": "Identifikasi data penting dari soal..." },
      { "order": 2, "title": "Eksekusi Solusi", "content": "Lakukan perhitungan matematis / penalaran inferensial..." },
      { "order": 3, "title": "Kesimpulan", "content": "Maka jawaban yang benar adalah <hl>Opsi B</hl>." }
    ]
  }
]
\`\`\`
Pastikan seluruh string JSON ter-escape dengan benar (misal backslash LaTeX ditulis ganda \`\\\\\`) agar valid ketika di-parse.`;
}
