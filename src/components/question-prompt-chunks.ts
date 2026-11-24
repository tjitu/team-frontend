import type { AutoBalanceSlot } from './question-lifecycle-types';

export interface PromptChunk {
  id: string;
  prompt: string;
  slots: AutoBalanceSlot[];
  keys: string[];
  saved: number;
}

export interface PromptPlan {
  version?: number;
  chunks: PromptChunk[];
}

export function buildChunkPlan(
  total: number, count: number, slots: AutoBalanceSlot[],
  makePrompt: (offset: number, size: number) => string,
): PromptPlan {
  if (total > 160 || count < 2 || count > total) {
    throw new Error('Pilih maksimal 160 soal dan minimal satu soal per chunk.');
  }
  let offset = 0;
  const planId = crypto.randomUUID();
  const chunks = Array.from({ length: count }, (_, index) => {
    const size = Math.floor(total / count) + Number(index < total % count);
    const id = `${planId}/${index + 1}`;
    const prompt = makePrompt(offset, size)
      .replace(/^- Karakter pertama respons wajib .*$/m,
        `- Kembalikan objek JSON dengan "chunkId": "${id}" dan "questions": array berisi tepat ${size} soal sesuai urutan.`)
      .replace(/(STRUKTUR JSON YANG WAJIB DIPATUHI:\n)([\s\S]+)$/, (_, heading: string, example: string) =>
        heading + JSON.stringify({ chunkId: id }).slice(0, -1) + ', "questions": ' +
        (example.trimStart().startsWith('[') ? example : '[' + example + ']') + '}');
    const chunk = {
      id, prompt,
      slots: slots.slice(offset, offset + size), saved: 0,
      keys: Array.from({ length: size }, () => crypto.randomUUID()),
    };
    offset += size;
    return chunk;
  });
  return { version: 2, chunks };
}

export function readPlan(scope: string): PromptPlan | null {
  const raw = localStorage.getItem('team-question-chunks:' + scope);
  return raw ? JSON.parse(raw) : null;
}

export function writePlan(scope: string, plan: PromptPlan | null) {
  const key = 'team-question-chunks:' + scope;
  if (plan) localStorage.setItem(key, JSON.stringify(plan));
  else localStorage.removeItem(key);
  window.dispatchEvent(new Event("question-plan-change"));
}

export function detectChunk(value: unknown, plan: PromptPlan | null) {
  if (value && typeof value === 'object' && ('chunkId' in value || 'questions' in value)) {
    const chunk = plan?.chunks.find(c => 'chunkId' in value && c.id === value.chunkId);
    if (!chunk) throw new Error('ID chunk tidak cocok dengan rencana paket ini.');
    if (chunk.saved === chunk.keys.length) throw new Error('Chunk ini sudah selesai diimpor.');
    if (!('questions' in value) || !Array.isArray(value.questions) || value.questions.length !== chunk.keys.length) {
      throw new Error(`Chunk ini harus berisi tepat ${chunk.keys.length} soal.`);
    }
    return { items: value.questions, chunk };
  }
  if (plan) throw new Error('Tempel JSON lengkap beserta chunkId dari prompt paket ini.');
  return { items: Array.isArray(value) ? value : [value], chunk: null };
}
