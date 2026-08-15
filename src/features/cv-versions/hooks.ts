import { useResourceCreate, useResourceDelete, useResourceList, useResourceUpdate } from '@/hooks/useResourceQuery';
import type { CvVersion } from '@/types';

const RESOURCE = 'cv-versions' as const;

export const useCvVersions = () => useResourceList<CvVersion>(RESOURCE);
export const useCreateCvVersion = () => useResourceCreate<CvVersion>(RESOURCE, 'CV Version');
export const useUpdateCvVersion = () => useResourceUpdate<CvVersion>(RESOURCE, 'CV Version');
export const useDeleteCvVersion = () => useResourceDelete<CvVersion>(RESOURCE, 'CV Version');
