export function dateKey(date = new Date()): string {
  const part = (n: number) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + part(date.getMonth() + 1) + '-' + part(date.getDate());
}

export function addDays(day: string, offset: number): string {
  const date = parseCalendarDay(day);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function parseCalendarDay(day: string): Date {
  return new Date(day + 'T00:00:00Z');
}

export function monthOffset(month: string, delta: number): string {
  const date = parseCalendarDay(month + '-01');
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export function monthDays(month: string): string[] {
  const date = parseCalendarDay(month + '-01');
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  const count = date.getUTCDate();
  return Array.from({ length: count }, (_, index) => month + '-' + String(index + 1).padStart(2, '0'));
}
