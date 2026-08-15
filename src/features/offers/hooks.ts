import {
  useResourceBulkDelete,
  useResourceCreate,
  useResourceDelete,
  useResourceList,
  useResourceUpdate,
} from '@/hooks/useResourceQuery';
import type { Offer } from '@/types';

const RESOURCE = 'offers' as const;

export const useOffers = () => useResourceList<Offer>(RESOURCE);
export const useCreateOffer = () => useResourceCreate<Offer>(RESOURCE, 'Offer');
export const useUpdateOffer = () => useResourceUpdate<Offer>(RESOURCE, 'Offer');
export const useDeleteOffer = () => useResourceDelete<Offer>(RESOURCE, 'Offer');
export const useBulkDeleteOffers = () => useResourceBulkDelete<Offer>(RESOURCE, 'offer');
