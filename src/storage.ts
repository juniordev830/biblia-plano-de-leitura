import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalState<T>(key: string, fallback: T, decode: (raw: string) => T): [T, Dispatch<SetStateAction<T>>, string, (value: T) => void] {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return { value: raw === null ? fallback : decode(raw), error: '', persisted: raw !== null };
    } catch {
      return { value: fallback, error: 'Não foi possível ler os dados locais. Seus registros foram preservados. Use um backup válido para restaurar.' };
    }
  });
  const [state, setState] = useState(initial.value);
  const lastSaved = useRef<{ key: string; value: T } | null>(
    initial.persisted ? { key, value: initial.value } : null,
  );
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(Boolean(initial.error));

  function replaceState(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error('Não foi possível gravar o backup no navegador. Os registros anteriores foram preservados.');
    }
    lastSaved.current = { key, value };
    setState(value);
    setBlocked(false);
    setError('');
  }

  useEffect(() => {
    if (blocked) return;
    if (lastSaved.current?.key === key && Object.is(lastSaved.current.value, state)) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      lastSaved.current = { key, value: state };
      setError('');
    } catch {
      setError('O navegador impediu o armazenamento. As alterações podem se perder ao fechar a página.');
    }
  }, [blocked, key, state]);
  return [state, setState, error, replaceState];
}
