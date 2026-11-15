import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>, string, (value: T) => void] {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  });
  const [error, setError] = useState('');
  const restored = useRef<{ key: string; value: T } | null>(null);

  function replaceState(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error('Não foi possível gravar o backup no navegador. Os registros anteriores foram preservados.');
    }
    restored.current = { key, value };
    setState(value);
    setError('');
  }

  useEffect(() => {
    if (restored.current?.key === key && restored.current.value === state) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      setError('');
    } catch {
      setError('O navegador impediu o armazenamento. As alterações podem se perder ao fechar a página.');
    }
  }, [key, state]);
  return [state, setState, error, replaceState];
}
