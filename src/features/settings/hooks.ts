import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClearAllData } from '@/lib/api/client';
import { errorMessage } from '@/hooks/useResourceQuery';
import i18n from '@/i18n';
import type { ResourceName } from '@/types';

const ALL_RESOURCES: ResourceName[] = [
  'applications',
  'companies',
  'contacts',
  'interviews',
  'offers',
  'cv-versions',
  'tasks',
];

export function useClearAllData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiClearAllData,
    onSuccess: () => {
      ALL_RESOURCES.forEach((resource) => qc.setQueryData([resource], []));
      toast.success(i18n.t('settings.allDataDeleted'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
