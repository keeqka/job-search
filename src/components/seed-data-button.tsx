import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedDemoData } from '@/lib/seed-data';
import { errorMessage } from '@/hooks/useResourceQuery';

/** Dev-only helper to populate the sheet with demo data for UI testing. */
export function SeedDataButton({ variant = 'outline' }: { variant?: 'outline' | 'ghost' }) {
  const queryClient = useQueryClient();
  const seed = useMutation({
    mutationFn: () => seedDemoData(queryClient),
    onSuccess: () => toast.success('Demo data loaded'),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!import.meta.env.DEV) return null;

  return (
    <Button variant={variant} onClick={() => seed.mutate()} disabled={seed.isPending}>
      <Sparkles className="size-4" />
      {seed.isPending ? 'Loading demo data...' : 'Load demo data'}
    </Button>
  );
}
