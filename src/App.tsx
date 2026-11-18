import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseBackup, serializeBackup, validateBackupSize } from './backup.ts';
import { addDays, dateKey, monthDays, monthOffset, parseCalendarDay } from './dates.ts';
import { durations, makePlan, summarize } from './plan.ts';
import type { Duration, ReadingPlan, ReadingState } from './plan.ts';
import { useLocalState } from './storage.ts';

const initial: ReadingState = { plans: {}, notes: {} };
const formatDay = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
const formatMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function App() {
  const today = dateKey();
  const [state, setState, error, replaceState] = useLocalState('leitura-v1', initial);
  const [duration, setDuration] = useState<Duration>(365);
  const [placeholderStart] = useState(today);
  const current = state.plans[duration] ?? { start: placeholderStart, done: {} };
  const plan = useMemo(() => makePlan(duration, current.start), [duration, current.start]);
  const [targetDate, setTargetDate] = useState('');
  const [monthView, setMonthView] = useState('');
  const [noteKey, setNoteKey] = useState('');
  const [backupFeedback, setBackupFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const byDate = useMemo(() => new Map(plan.map(entry => [entry.date, entry])), [plan]);
  const selected = byDate.get(targetDate) ?? byDate.get(today) ??
    plan.find(entry => !current.done[entry.day]) ?? plan[0];
  const month = monthView || selected.date.slice(0, 7);
  const stats = summarize(plan, current.done, today);
  const chapter = selected.chapters.find(chapter => chapter.code === noteKey) ?? selected.chapters[0];
  const days = monthDays(month);
  const blanks = Array.from({ length: (parseCalendarDay(days[0]).getUTCDay() + 6) % 7 });

  function updatePlan(update: (value: ReadingPlan) => ReadingPlan) {
    setState(previous => ({
      ...previous,
      plans: { ...previous.plans, [duration]: update(previous.plans[duration] ?? current) },
    }));
  }

  function chooseDay(key: string) {
    setTargetDate(key);
    setMonthView(key.slice(0, 7));
    setNoteKey('');
  }

  function toggleReading() {
    updatePlan(value => {
      const done = { ...value.done };
      if (done[selected.day]) delete done[selected.day];
      else done[selected.day] = today;
      return { ...value, done };
    });
  }

  function exportData() {
    try {
      const backup = serializeBackup(state);
      const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plano-leitura-backup-' + today + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupFeedback({ message: 'Backup preparado para download.', error: false });
    } catch {
      setBackupFeedback({ message: 'Não foi possível exportar os dados atuais.', error: true });
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      validateBackupSize(file.size);
      const imported = parseBackup(await file.text());
      if (!window.confirm('Restaurar este backup? Os planos e anotações atuais serão substituídos.')) return;
      replaceState(imported);
      setDuration(durations.find(value => imported.plans[value]) ?? duration);
      setTargetDate('');
      setMonthView('');
      setNoteKey('');
      setBackupFeedback({ message: 'Backup restaurado. Confira seus planos e anotações.', error: false });
    } catch (cause) {
      setBackupFeedback({
        message: cause instanceof Error ? cause.message : 'Não foi possível ler o backup.',
        error: true,
      });
    }
  }

  return <div className="stack">
    {error && <p role="alert" className="error">{error}</p>}
    <section className="panel stack" aria-label="Plano e metas">
      <div className="two collapse">
        <label>Prazo
          <select value={duration} onChange={event => {
            setDuration(Number(event.target.value) as Duration);
            setTargetDate('');
            setMonthView('');
          }}>{durations.map(value => <option key={value} value={value}>{value} dias</option>)}</select>
        </label>
        <label>Início do plano
          <input type="date" required value={current.start} min="1900-01-01" max="9998-12-31" onChange={event => {
            const start = event.target.value;
            if (!start || !event.target.validity.valid) return;
            updatePlan(value => ({ ...value, start }));
            chooseDay(start);
          }} />
        </label>
      </div>
      <div className="three">
        <div className="stat">Leitura concluída<strong>{stats.percent}%</strong></div>
        <div className="stat">Dias concluídos<strong>{stats.completed}/{plan.length}</strong></div>
        <div className="stat">Dias em atraso<strong>{stats.overdue}</strong></div>
      </div>
      <progress value={stats.percent} max={100} aria-label="Percentual de capítulos lidos" />
      <p className="muted">Meta atual de {selected.chapters.length} capítulos no dia {selected.day}. Reagendar mantém as marcações por número de dia.</p>
    </section>
    <section className="panel stack" aria-label="Backup dos dados">
      <div>
        <h2>Backup dos seus estudos</h2>
        <p className="muted">Salve seus planos, leituras concluídas e anotações em um arquivo JSON. Os dados permanecem no seu dispositivo.</p>
      </div>
      <div className="two collapse">
        <button onClick={exportData}>Baixar backup</button>
        <label>Restaurar backup (.json)
          <input type="file" accept=".json,application/json" onChange={importData} />
        </label>
      </div>
      {backupFeedback && <p role={backupFeedback.error ? 'alert' : 'status'} className={backupFeedback.error ? 'error' : 'muted'}>{backupFeedback.message}</p>}
    </section>
    <div className="split">
      <section className="panel stack">
        <div className="row between">
          <h2>{selected.day}º dia · {formatDay.format(parseCalendarDay(selected.date))}</h2>
          <button className="primary" onClick={toggleReading}>{current.done[selected.day] ? 'Desmarcar leitura' : 'Concluir leitura'}</button>
        </div>
        <ul className="list reading-list">{selected.chapters.map(item => <li className="subtle" key={item.code}>{item.label}</li>)}</ul>
        <label>Capítulo da anotação
          <select value={chapter.code} onChange={event => setNoteKey(event.target.value)}>
            {selected.chapters.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </label>
        <label>Anotação do capítulo
          <textarea maxLength={4000} value={state.notes[chapter.code] ?? ''} onChange={event => {
            const note = event.target.value;
            setState(previous => {
              const notes = { ...previous.notes };
              if (note.trim()) notes[chapter.code] = note;
              else delete notes[chapter.code];
              return { ...previous, notes };
            });
          }} placeholder="O que chamou sua atenção na leitura?" />
        </label>
      </section>
      <aside className="stack">
        <section className="panel">
          <div className="row between">
            <button aria-label="Mês anterior" disabled={month <= '1900-01'} onClick={() => setMonthView(monthOffset(month, -1))}>←</button>
            <h2 className="month-title">{formatMonth.format(parseCalendarDay(month + '-01'))}</h2>
            <button aria-label="Próximo mês" disabled={month >= '9999-12'} onClick={() => setMonthView(monthOffset(month, 1))}>→</button>
          </div>
          <div className="calendar" aria-label="Calendário de leitura">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <small key={day}>{day}</small>)}
            {blanks.map((_, index) => <span key={index} />)}
            {days.map(day => {
              const entry = byDate.get(day);
              const done = entry && current.done[entry.day];
              return <button key={day} disabled={!entry} aria-pressed={day === selected.date}
                aria-label={formatDay.format(parseCalendarDay(day)) + (done ? ', concluído' : '')}
                className={done ? 'done-day' : ''} onClick={() => chooseDay(day)}>
                {Number(day.slice(-2))}{done ? '✓' : ''}
              </button>;
            })}
          </div>
          <div className="row calendar-actions">
            <button disabled={!byDate.has(today)} onClick={() => chooseDay(today)}>Hoje</button>
            <button disabled={!byDate.has(addDays(selected.date, 1))} onClick={() => chooseDay(addDays(selected.date, 1))}>Próxima leitura</button>
          </div>
        </section>
        <section className="panel">
          <h2>Histórico de leituras</h2>
          {!stats.history.length && <p className="muted">Os dias concluídos aparecem aqui.</p>}
          <ul className="list">{stats.history.map(entry => <li key={entry.day}>
            <button className="selection" onClick={() => chooseDay(entry.date)}>Dia {entry.day} · lido em {formatDay.format(parseCalendarDay(current.done[entry.day]))}</button>
          </li>)}</ul>
        </section>
      </aside>
    </div>
  </div>;
}
