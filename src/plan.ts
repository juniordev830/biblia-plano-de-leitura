import { books } from './canon.ts';
import { addDays } from './dates.ts';

export const durations = [30, 90, 180, 365] as const;
export type Duration = typeof durations[number];
export type Chapter = { code: string; number: number; label: string };
export type Entry = { day: number; date: string; chapters: Chapter[] };
export type ReadingPlan = { start: string; done: Record<number, string> };
export type ReadingState = { plans: Partial<Record<Duration, ReadingPlan>>; notes: Record<string, string> };

export const allChapters: Chapter[] = books.flatMap(book =>
  Array.from({ length: book.chapters }, (_, index) => ({
    code: book.code + ':' + (index + 1), number: index + 1, label: book.name + ' ' + (index + 1),
  })),
);

export function makePlan(duration: Duration, start: string): Entry[] {
  return Array.from({ length: duration }, (_, index) => ({
    day: index + 1,
    date: addDays(start, index),
    chapters: allChapters.slice(
      Math.floor(index * allChapters.length / duration),
      Math.floor((index + 1) * allChapters.length / duration),
    ),
  }));
}

export function summarize(plan: Entry[], done: ReadingPlan['done'], today: string) {
  const completed = plan.filter(entry => Boolean(done[entry.day]));
  const chapters = completed.reduce((sum, entry) => sum + entry.chapters.length, 0);
  const total = plan.reduce((sum, entry) => sum + entry.chapters.length, 0);
  return {
    completed: completed.length,
    percent: total > 0 ? Math.round(100 * chapters / total) : 0,
    remaining: plan.length - completed.length,
    overdue: plan.filter(entry => entry.date < today && !done[entry.day]).length,
    history: completed.sort((a, b) => done[b.day].localeCompare(done[a.day]) || b.day - a.day),
  };
}
