import { useResourceCreate, useResourceDelete, useResourceList, useResourceUpdate } from '@/hooks/useResourceQuery';
import type { Interview } from '@/types';

const RESOURCE = 'interviews' as const;

export const useInterviews = () => useResourceList<Interview>(RESOURCE);
export const useCreateInterview = () => useResourceCreate<Interview>(RESOURCE, 'Interview');
export const useUpdateInterview = () => useResourceUpdate<Interview>(RESOURCE, 'Interview');
export const useDeleteInterview = () => useResourceDelete<Interview>(RESOURCE, 'Interview');
