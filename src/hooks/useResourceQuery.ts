import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiCreate, apiDelete, apiList, apiUpdate, ApiError } from '@/lib/api/client';
import i18n from '@/i18n';
import type { ResourceName } from '@/types';

function errorMessage(err: unknown): string {
  return err instanceof ApiError || err instanceof Error ? err.message : i18n.t('apiErrors.unknownError');
}

/** i18next keys can't contain the dash in 'cv-versions', so map to a safe key. */
function resourceKey(resource: ResourceName): string {
  return resource === 'cv-versions' ? 'cvVersions' : resource;
}

export function useResourceList<T>(resource: ResourceName) {
  return useQuery({
    queryKey: [resource],
    queryFn: () => apiList<T>(resource),
  });
}

/**
 * Google Sheets round-trips are slow (often 1-2s+), so every mutation below
 * applies its change to the cache immediately (onMutate) and only rolls back
 * if the request actually fails. onSuccess reconciles the optimistic entry
 * with the server's authoritative response (e.g. server-computed fields like
 * lastActivity) without an extra round-trip.
 */

export function useResourceCreate<T extends { id: string }>(resource: ResourceName, _label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<T>) => apiCreate<T>(resource, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const previous = qc.getQueryData<T[]>([resource]);
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic = { ...data, id: tempId } as T;
      qc.setQueryData<T[]>([resource], (old) => [...(old ?? []), optimistic]);
      return { previous, tempId };
    },
    onSuccess: (created, _data, context) => {
      qc.setQueryData<T[]>([resource], (old) =>
        old?.map((item) => (item.id === context?.tempId ? created : item)) ?? [created],
      );
      toast.success(i18n.t(`toasts.${resourceKey(resource)}.created`));
    },
    onError: (err, _data, context) => {
      if (context?.previous) qc.setQueryData([resource], context.previous);
      toast.error(errorMessage(err));
    },
  });
}

export function useResourceUpdate<T extends { id: string }>(resource: ResourceName, _label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => apiUpdate<T>(resource, id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const previous = qc.getQueryData<T[]>([resource]);
      qc.setQueryData<T[]>([resource], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { previous };
    },
    onSuccess: (updated) => {
      qc.setQueryData<T[]>([resource], (old) => old?.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(i18n.t(`toasts.${resourceKey(resource)}.updated`));
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData([resource], context.previous);
      toast.error(errorMessage(err));
    },
  });
}

export function useResourceDelete<T extends { id: string }>(resource: ResourceName, _label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(resource, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const previous = qc.getQueryData<T[]>([resource]);
      qc.setQueryData<T[]>([resource], (old) => old?.filter((item) => item.id !== id));
      return { previous };
    },
    onSuccess: () => toast.success(i18n.t(`toasts.${resourceKey(resource)}.deleted`)),
    onError: (err, _id, context) => {
      if (context?.previous) qc.setQueryData([resource], context.previous);
      toast.error(errorMessage(err));
    },
  });
}

export function useResourceBulkDelete<T extends { id: string }>(resource: ResourceName, _label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => apiDelete(resource, id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) throw new Error(i18n.t('apiErrors.bulkDeleteFailed', { failed, total: ids.length }));
      return ids;
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const previous = qc.getQueryData<T[]>([resource]);
      const idSet = new Set(ids);
      qc.setQueryData<T[]>([resource], (old) => old?.filter((item) => !idSet.has(item.id)));
      return { previous };
    },
    onSuccess: (ids) => toast.success(i18n.t(`toasts.${resourceKey(resource)}.bulkDeleted`, { count: ids.length })),
    onError: (err, _ids, context) => {
      if (context?.previous) qc.setQueryData([resource], context.previous);
      toast.error(errorMessage(err));
    },
  });
}

export function useResourceBulkUpdate<T extends { id: string }>(resource: ResourceName, _label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<T> }) => {
      const results = await Promise.allSettled(ids.map((id) => apiUpdate<T>(resource, id, data)));
      const updated: T[] = [];
      let failed = 0;
      for (const r of results) {
        if (r.status === 'fulfilled') updated.push(r.value);
        else failed += 1;
      }
      if (failed > 0) throw new Error(i18n.t('apiErrors.bulkUpdateFailed', { failed, total: ids.length }));
      return updated;
    },
    onMutate: async ({ ids, data }) => {
      await qc.cancelQueries({ queryKey: [resource] });
      const previous = qc.getQueryData<T[]>([resource]);
      const idSet = new Set(ids);
      qc.setQueryData<T[]>([resource], (old) =>
        old?.map((item) => (idSet.has(item.id) ? { ...item, ...data } : item)),
      );
      return { previous };
    },
    onSuccess: (updated) => {
      qc.setQueryData<T[]>([resource], (old) => {
        const byId = new Map(updated.map((u) => [u.id, u]));
        return old?.map((item) => byId.get(item.id) ?? item);
      });
      toast.success(i18n.t(`toasts.${resourceKey(resource)}.bulkUpdated`, { count: updated.length }));
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData([resource], context.previous);
      toast.error(errorMessage(err));
    },
  });
}

export { errorMessage };
