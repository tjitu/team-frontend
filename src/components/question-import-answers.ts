type AnswerOption = { content: string; isCorrect: boolean; order: number };

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

export function parseQuestionAnswers(input: unknown, index = 0) {
  const data = record(input);
  const fail = (message: string): never => { throw new Error(`Soal ${index + 1}: ${message}`); };
  if (typeof data.content !== 'string' || !data.content.trim()) fail('teks pertanyaan wajib diisi.');
  const rawType = String(data.type ?? '').toUpperCase();
  const isShortAnswer = ['SHORT_ANSWER', 'ISIAN_SINGKAT'].includes(rawType)
    || (!rawType && data.correctAnswer != null && (!data.options || (Array.isArray(data.options) && !data.options.length)));
  if (isShortAnswer) {
    const correctAnswer = String(data.correctAnswer ?? '').trim();
    if (!/^\d{1,4}$/.test(correctAnswer)) fail('kunci isian harus berupa angka 0–9999.');
    if (data.options != null && !(Array.isArray(data.options) && !data.options.length)) fail('isian harus tanpa opsi.');
    return { isShortAnswer, correctAnswer, options: [] as AnswerOption[] };
  }
  const raw = data.options;
  if (!Array.isArray(raw) || raw.length !== 5) return fail('lengkapi lima opsi A–E.');
  const legacyKey = data.keyAnswer == null ? null : String(data.keyAnswer).trim().toUpperCase();
  if (legacyKey !== null && !/^[A-E]$/.test(legacyKey)) fail('keyAnswer harus berupa huruf A–E.');
  const options = raw.map((item: unknown, i: number) => {
    const option = record(item);
    const letter = 'ABCDE'[i];
    const text = option.content ?? option.text;
    if (typeof text !== 'string' || !text.trim()) return fail(`teks opsi ${letter} kosong.`);
    if (option.isCorrect !== undefined && typeof option.isCorrect !== 'boolean') fail(`isCorrect opsi ${letter} harus boolean.`);
    if (legacyKey !== null && option.isCorrect !== undefined && option.isCorrect !== (legacyKey === letter)) fail('kedua penanda kunci berbeda.');
    return { content: text.trim(), isCorrect: option.isCorrect === true || legacyKey === letter, order: i + 1 };
  });
  if (new Set(options.map(o => o.content.normalize().replace(/\s+/g, ' '))).size !== 5) fail('teks opsi harus berbeda.');
  if (options.filter(o => o.isCorrect).length !== 1) fail('tandai tepat satu opsi benar.');
  return { isShortAnswer, correctAnswer: '', options };
}

export function supportsNumericSlot(subtest: string) {
  return ['PENGETAHUAN_KUANTITATIF', 'PENALARAN_MATEMATIKA', 'PK', 'PM'].includes(subtest);
}
