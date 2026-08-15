import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Submit button that shows a spinner + "Saving..." while a (often slow, Google Sheets-backed) mutation is pending. */
export function SubmitButton({
  pending,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? 'Saving...' : children}
    </Button>
  );
}
