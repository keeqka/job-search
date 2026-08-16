import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiUpdate } from '@/lib/api/client';
import i18n from '@/i18n';
import {
  useResourceBulkDelete,
  useResourceBulkUpdate,
  useResourceCreate,
  useResourceDelete,
  useResourceList,
  useResourceUpdate,
  errorMessage,
} from '@/hooks/useResourceQuery';
import type { Application, ApplicationStatus } from '@/types';

const RESOURCE = 'applications' as const;

export const useApplications = () => useResourceList<Application>(RESOURCE);
export const useCreateApplication = () => useResourceCreate<Application>(RESOURCE, 'Application');
export const useUpdateApplication = () => useResourceUpdate<Application>(RESOURCE, 'Application');
export const useDeleteApplication = () => useResourceDelete<Application>(RESOURCE, 'Application');
export const useBulkDeleteApplications = () => useResourceBulkDelete<Application>(RESOURCE, 'application');
export const useBulkUpdateApplications = () => useResourceBulkUpdate<Application>(RESOURCE, 'application');

/** Optimistic status update used by the Kanban board drag & drop. */
export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      apiUpdate<Application>(RESOURCE, id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: [RESOURCE] });
      const previous = qc.getQueryData<Application[]>([RESOURCE]);
      qc.setQueryData<Application[]>([RESOURCE], (old) =>
        old?.map((a) => (a.id === id ? { ...a, status } : a)) ?? old,
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData([RESOURCE], context.previous);
      toast.error(errorMessage(err));
    },
    onSuccess: () => toast.success(i18n.t('applications.statusUpdated')),
    onSettled: () => qc.invalidateQueries({ queryKey: [RESOURCE] }),
  });
}
