import {
  useResourceBulkDelete,
  useResourceCreate,
  useResourceDelete,
  useResourceList,
  useResourceUpdate,
} from '@/hooks/useResourceQuery';
import type { Contact } from '@/types';

const RESOURCE = 'contacts' as const;

export const useContacts = () => useResourceList<Contact>(RESOURCE);
export const useCreateContact = () => useResourceCreate<Contact>(RESOURCE, 'Contact');
export const useUpdateContact = () => useResourceUpdate<Contact>(RESOURCE, 'Contact');
export const useDeleteContact = () => useResourceDelete<Contact>(RESOURCE, 'Contact');
export const useBulkDeleteContacts = () => useResourceBulkDelete<Contact>(RESOURCE, 'contact');
