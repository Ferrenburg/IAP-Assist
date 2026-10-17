'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useParams } from 'next/navigation';
import { apiClient, SharedOpPeriodData } from '../utils/api-client';

// The single source of truth for an operational period's shared data while
// the user is in /iap/[iapId]/period/[periodId]/*. Every form page reads from
// here instead of fetching independently. Updates fire to the shared-data
// endpoint and optimistically refresh local state so other consuming pages
// see the change without a refetch.

interface OpPeriodContextValue {
  data: SharedOpPeriodData | null;
  loading: boolean;
  error: string | null;
  /** Patch any subset of shared fields. Optimistic + persisted. */
  update: (patch: Partial<SharedOpPeriodData>) => Promise<void>;
  /** Re-fetch from the server (e.g. after a non-context-mediated change). */
  refresh: () => Promise<void>;
  iapId: string;
  periodId: string;
}

const OpPeriodContext = createContext<OpPeriodContextValue | undefined>(undefined);

export function OpPeriodProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ iapId: string; periodId: string }>();
  const iapId = params?.iapId ?? '';
  const periodId = params?.periodId ?? '';

  const [data, setData] = useState<SharedOpPeriodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against race conditions when iapId/periodId changes mid-fetch.
  const requestRef = useRef(0);

  // Debounce rapid keystroke updates so only one API call fires per burst.
  // Patches are accumulated so the final call always has the complete latest value.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<SharedOpPeriodData>>({});

  const fetchData = useCallback(async () => {
    if (!iapId || !periodId) {
      setLoading(false);
      return;
    }
    const myReq = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const { shared } = await apiClient.getSharedData(iapId, periodId);
      if (myReq === requestRef.current) {
        setData(shared);
      }
    } catch (err: any) {
      if (myReq === requestRef.current) {
        setError(err?.message ?? 'Failed to load shared data');
        setData(null);
      }
    } finally {
      if (myReq === requestRef.current) {
        setLoading(false);
      }
    }
  }, [iapId, periodId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Flush whatever is in pendingPatchRef to the server immediately.
  // Called by the debounce timer and on unmount to avoid losing in-flight edits.
  const flushPendingUpdate = useCallback(async () => {
    const patch = { ...pendingPatchRef.current };
    pendingPatchRef.current = {};
    if (Object.keys(patch).length === 0 || !iapId || !periodId) return;
    try {
      const { shared } = await apiClient.updateSharedData(iapId, periodId, patch);
      setData(shared);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save shared data');
      await fetchData();
    }
  }, [iapId, periodId, fetchData]);

  const update = useCallback(
    (patch: Partial<SharedOpPeriodData>): Promise<void> => {
      if (!iapId || !periodId) return Promise.resolve();

      // Optimistic update for instant UI feedback.
      setData((prev) => (prev ? { ...prev, ...patch } : prev));

      // Merge this patch into the accumulator. Rapid keystrokes on the same
      // field keep overwriting the same key, so the final flush always sends
      // the complete latest value — eliminating out-of-order server writes.
      Object.assign(pendingPatchRef.current, patch);

      // Reset the debounce window on every call.
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        void flushPendingUpdate();
      }, 400);

      return Promise.resolve();
    },
    [iapId, periodId, flushPendingUpdate],
  );

  // Flush any pending update when the provider unmounts (navigation away).
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      void flushPendingUpdate();
    };
  }, [flushPendingUpdate]);

  const value = useMemo<OpPeriodContextValue>(
    () => ({ data, loading, error, update, refresh: fetchData, iapId, periodId }),
    [data, loading, error, update, fetchData, iapId, periodId],
  );

  return <OpPeriodContext.Provider value={value}>{children}</OpPeriodContext.Provider>;
}

/** Throws if used outside the provider. Use inside iap/[iapId]/period/[periodId]/* pages. */
export function useOpPeriod() {
  const ctx = useContext(OpPeriodContext);
  if (!ctx) {
    throw new Error('useOpPeriod must be used within OpPeriodProvider');
  }
  return ctx;
}

/** Returns the context if mounted, otherwise undefined. Use from components
 *  that render both inside and outside the workspace segment (e.g. the
 *  shared workspace header used by /team and /iap/[id]/period/[pid]/*). */
export function useOpPeriodOptional() {
  return useContext(OpPeriodContext);
}
