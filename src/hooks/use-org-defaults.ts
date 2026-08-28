'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api-client';

/**
 * Generic CRUD over the org-scoped defaults store (`/org/:dataType`).
 *
 * Every record here is org-wide and incident-independent, which is what makes
 * a "default" reusable — unlike the IAP-scoped `apiClient.getData` family,
 * whose records are namespaced by both incident and user.
 *
 * All six Defaults tabs share this hook; only the record shape differs.
 */
export function useOrgDefaults<T extends { id: string }>(dataType: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.getOrgData(dataType);
      setItems((data || []) as T[]);
    } catch (err: any) {
      console.error(`Failed to load ${dataType}:`, err);
      toast.error(`Could not load ${dataType.replace(/-/g, ' ')}`);
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (payload: Omit<T, 'id'>, successMessage = 'Saved') => {
      setSaving(true);
      try {
        const { item } = await apiClient.createOrgData(dataType, payload);
        setItems((prev) => [...prev, item as T]);
        toast.success(successMessage);
        return item as T;
      } catch (err: any) {
        console.error(`Failed to create ${dataType}:`, err);
        toast.error(err?.message || 'Could not save');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [dataType],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>, successMessage = 'Updated') => {
      setSaving(true);
      try {
        const { item } = await apiClient.updateOrgData(dataType, id, patch);
        setItems((prev) => prev.map((i) => (i.id === id ? (item as T) : i)));
        toast.success(successMessage);
        return item as T;
      } catch (err: any) {
        console.error(`Failed to update ${dataType}:`, err);
        toast.error(err?.message || 'Could not update');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [dataType],
  );

  const remove = useCallback(
    async (id: string, successMessage = 'Deleted') => {
      // Optimistic removal, rolled back if the request fails — deletes are the
      // one action here where waiting on a round-trip feels broken.
      const previous = items;
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await apiClient.deleteOrgData(dataType, id);
        toast.success(successMessage);
        return true;
      } catch (err: any) {
        console.error(`Failed to delete ${dataType}:`, err);
        toast.error(err?.message || 'Could not delete');
        setItems(previous);
        return false;
      }
    },
    [dataType, items],
  );

  return { items, loading, saving, add, update, remove, reload: load };
}
