import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutosaveReturn {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  saveNow: () => Promise<void>;
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);

  const saveNow = useCallback(async () => {
    if (!enabled) return;

    try {
      setSaving(true);
      setError(null);
      await onSave(data);
      setLastSaved(new Date());
      previousDataRef.current = data;
    } catch (err: any) {
      console.error('Autosave error:', err);
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    // Skip first render to avoid saving on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = data;
      return;
    }

    if (!enabled) return;

    // Check if data has actually changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (!dataChanged) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveNow]);

  return {
    saving,
    lastSaved,
    error,
    saveNow,
  };
}
