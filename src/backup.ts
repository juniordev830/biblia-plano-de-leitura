import { allChapters, durations } from './plan.ts';
import type { Duration, ReadingPlan, ReadingState } from './plan.ts';

const FORMAT = 'biblia-plano-de-leitura';
const VERSION = 1;
export const MAX_BACKUP_SIZE = 1_000_000;

const validChapters = new Set(allChapters.map(chapter => chapter.code));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9998 || month < 1 || month > 12) return false;
  return day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Validate and copy the imported data, allowing only known fields and chapter IDs. */
function validateState(value: unknown): ReadingState {
  if (!isRecord(value) || !isRecord(value.plans) || !isRecord(value.notes)) {
    throw new Error('O arquivo não contém planos e anotações válidos.');
  }

  const plans: ReadingState['plans'] = {};
  for (const [key, rawPlan] of Object.entries(value.plans)) {
    const duration = Number(key) as Duration;
    if (!durations.includes(duration) || String(duration) !== key ||
        !isRecord(rawPlan) || !isValidDate(rawPlan.start) || !isRecord(rawPlan.done)) {
      throw new Error('O backup contém um plano de leitura inválido.');
    }

    const done: ReadingPlan['done'] = {};
    for (const [day, completedAt] of Object.entries(rawPlan.done)) {
      const number = Number(day);
      if (!Number.isInteger(number) || number < 1 || number > duration ||
          String(number) !== day || !isValidDate(completedAt)) {
        throw new Error('O backup contém marcações de leitura inválidas.');
      }
      done[number] = completedAt;
    }
    plans[duration] = { start: rawPlan.start, done };
  }

  const notes: ReadingState['notes'] = {};
  for (const [chapter, note] of Object.entries(value.notes)) {
    if (!validChapters.has(chapter) || typeof note !== 'string' || note.length > 4000) {
      throw new Error('O backup contém anotações inválidas.');
    }
    notes[chapter] = note;
  }
  return { plans, notes };
}

export function serializeBackup(state: ReadingState, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt, data: validateState(state) }, null, 2);
}

export function parseBackup(content: string): ReadingState {
  if (content.length > MAX_BACKUP_SIZE) {
    throw new Error('O arquivo excede o limite de 1 MB.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('O arquivo não contém um JSON válido.');
  }
  if (!isRecord(parsed) || parsed.format !== FORMAT || parsed.version !== VERSION) {
    throw new Error('Este arquivo não é um backup compatível do plano de leitura.');
  }
  return validateState(parsed.data);
}
