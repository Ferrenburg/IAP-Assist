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

  const update = useCallback(
    async (patch: Partial<SharedOpPeriodData>) => {
      if (!iapId || !periodId) return;
      // Optimistic update.
      setData((prev) => (prev ? { ...prev, ...patch } : prev));
      try {
        const { shared } = await apiClient.updateSharedData(iapId, periodId, patch);
        setData(shared);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to save shared data');
        // Rollback on failure by re-fetching authoritative state.
        await fetchData();
        throw err;
      }
    },
    [iapId, periodId, fetchData],
  );

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
