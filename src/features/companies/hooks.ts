import {
  useResourceBulkDelete,
  useResourceCreate,
  useResourceDelete,
  useResourceList,
  useResourceUpdate,
} from '@/hooks/useResourceQuery';
import type { Company } from '@/types';

const RESOURCE = 'companies' as const;

export const useCompanies = () => useResourceList<Company>(RESOURCE);
export const useCreateCompany = () => useResourceCreate<Company>(RESOURCE, 'Company');
export const useUpdateCompany = () => useResourceUpdate<Company>(RESOURCE, 'Company');
export const useDeleteCompany = () => useResourceDelete<Company>(RESOURCE, 'Company');
export const useBulkDeleteCompanies = () => useResourceBulkDelete<Company>(RESOURCE, 'company');
