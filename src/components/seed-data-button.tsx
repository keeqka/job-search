import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { seedDemoData } from '@/lib/seed-data';
import { errorMessage } from '@/hooks/useResourceQuery';

/** Dev-only helper to populate the sheet with demo data for UI testing. */
export function SeedDataButton({ variant = 'outline' }: { variant?: 'outline' | 'ghost' }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const seed = useMutation({
    mutationFn: () => seedDemoData(queryClient),
    onSuccess: () => toast.success(t('seedData.success')),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!import.meta.env.DEV) return null;

  return (
    <Button variant={variant} onClick={() => seed.mutate()} disabled={seed.isPending}>
      <Sparkles className="size-4" />
      {seed.isPending ? t('seedData.loading') : t('seedData.load')}
    </Button>
  );
}
