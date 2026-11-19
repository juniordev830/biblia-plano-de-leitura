import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BACKUP_SIZE, parseBackup, parseLocalState, serializeBackup } from '../src/backup.ts';
import { allChapters } from '../src/plan.ts';
import type { ReadingState } from '../src/plan.ts';

const sample: ReadingState = {
  plans: { 30: { start: '2028-02-29', done: { 1: '2028-02-29', 30: '2028-03-30' } } },
  notes: { 'GN:1': 'Criação e começo de tudo.', 'JO:3': 'Anotar João 3:16.' },
};

test('lê o formato local existente e rejeita objetos corrompidos', () => {
  assert.deepEqual(parseLocalState(JSON.stringify(sample)), sample);
  assert.throws(() => parseLocalState('{"plans":null, "notes":{}}'), /planos e anotações válidos/);
});

test('backup mantém plano, marcações e anotações após exportação e importação', () => {
  const content = serializeBackup(sample, '2028-03-30T12:00:00.000Z');
  assert.deepEqual(parseBackup(content), sample);
  assert.match(content, /"version": 1/);
});

test('rejeita arquivos incompatíveis, inválidos e grandes demais', () => {
  assert.throws(() => parseBackup('texto sem json'), /JSON válido/);
  assert.throws(() => parseBackup('{}'), /backup compatível/);
  assert.throws(() => parseBackup('a'.repeat(MAX_BACKUP_SIZE + 1)), /32 MB/);
});

test('rejeita datas impossíveis, dias fora do plano e capítulos inexistentes', () => {
  const invalidDate = structuredClone(sample);
  invalidDate.plans[30]!.start = '2027-02-29';
  assert.throws(() => serializeBackup(invalidDate), /plano de leitura inválido/);

  const invalidDay = structuredClone(sample);
  invalidDay.plans[30]!.done[31] = '2028-03-30';
  assert.throws(() => serializeBackup(invalidDay), /marcações de leitura inválidas/);

  const invalidChapter = structuredClone(sample);
  invalidChapter.notes['ZZ:99'] = 'Não existe';
  assert.throws(() => serializeBackup(invalidChapter), /anotações inválidas/);
});

test('ignora propriedades extras do arquivo e devolve apenas dados conhecidos', () => {
  const raw = JSON.parse(serializeBackup(sample));
  raw.data.injected = { unexpected: true };
  raw.data.plans['30'].unsafe = true;
  assert.deepEqual(parseBackup(JSON.stringify(raw)), sample);
});

test('restaura exportações válidas com mais de um megabyte em UTF-8', () => {
  const notes = Object.fromEntries(allChapters.slice(0, 300).map(chapter => [chapter.code, '願'.repeat(4000)]));
  const state = { plans: {}, notes };
  const content = serializeBackup(state);
  assert.ok(new TextEncoder().encode(content).byteLength > 1_000_000);
  assert.deepEqual(parseBackup(content), state);
});

test('aplica o limite por bytes UTF-8 mesmo quando há menos caracteres', () => {
  assert.throws(() => parseBackup('願'.repeat(Math.floor(MAX_BACKUP_SIZE / 3) + 1)), /32 MB/);
});
