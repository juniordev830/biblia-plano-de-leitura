import { test } from 'node:test';
import assert from 'node:assert/strict';
import { books } from '../src/canon.ts';
import { addDays, monthDays, monthOffset, parseCalendarDay } from '../src/dates.ts';
import { allChapters, durations, makePlan, summarize } from '../src/plan.ts';

test('catálogo cobre os 66 livros e 1189 capítulos', () => {
  assert.equal(books.length, 66);
  assert.equal(books.filter(book => book.testament === 'AT').length, 39);
  assert.equal(allChapters.length, 1189);
  assert.equal(allChapters.at(-1)?.label, 'Apocalipse 22');
});

for (const duration of durations) {
  test('plano de ' + duration + ' dias é equilibrado, ordenado e sem repetições', () => {
    const entries = makePlan(duration, '2028-02-28');
    assert.equal(entries.length, duration);
    assert.equal(entries[1].date, '2028-02-29');
    assert.deepEqual(entries.flatMap(entry => entry.chapters), allChapters);
    const workloads = entries.map(entry => entry.chapters.length);
    assert.ok(Math.max(...workloads) - Math.min(...workloads) <= 1);
  });
}

test('progresso e atraso respeitam a data e ignoram dias não pertencentes ao plano', () => {
  const entries = makePlan(30, '2026-03-01');
  const stats = summarize(entries, { 1: '2026-03-02', 3: '2026-03-04', 99: '2026-03-01' }, '2026-03-04');
  assert.equal(stats.completed, 2);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.remaining, 28);
  assert.equal(stats.percent, 7);
  assert.deepEqual(stats.history.map(entry => entry.day), [3, 1]);
});

test('calendário respeita fevereiro bissexto e mudança de ano', () => {
  assert.equal(monthDays('2028-02').length, 29);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(monthOffset('2026-12', 1), '2027-01');
  assert.equal(monthOffset('2027-01', -1), '2026-12');
});

test('datas do plano são civis mesmo se o fuso pulou um dia local', t => {
  const previous = process.env.TZ;
  process.env.TZ = 'Pacific/Apia';
  t.after(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });
  assert.deepEqual(makePlan(30, '2011-12-29').slice(0, 3).map(entry => entry.date), [
    '2011-12-29', '2011-12-30', '2011-12-31',
  ]);
  assert.equal(parseCalendarDay('2011-12-30').getUTCDay(), 5);
});
