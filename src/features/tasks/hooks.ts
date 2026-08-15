import { useResourceCreate, useResourceDelete, useResourceList, useResourceUpdate } from '@/hooks/useResourceQuery';
import type { Task } from '@/types';

const RESOURCE = 'tasks' as const;

export const useTasks = () => useResourceList<Task>(RESOURCE);
export const useCreateTask = () => useResourceCreate<Task>(RESOURCE, 'Task');
export const useUpdateTask = () => useResourceUpdate<Task>(RESOURCE, 'Task');
export const useDeleteTask = () => useResourceDelete<Task>(RESOURCE, 'Task');
