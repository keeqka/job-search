import { Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Floating pill that appears above the content when rows are selected. Stays
 * mounted so hide/show is a real CSS transition, not an instant unmount. */
export function BulkActionsBar({
  count,
  onClear,
  onDelete,
  deleting,
  children,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  deleting?: boolean;
  children?: React.ReactNode;
}) {
  const visible = count > 0;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      )}
      aria-hidden={!visible}
    >
      <div
        className={cn(
          'flex items-center gap-1 rounded-full border bg-popover/90 py-2 pr-2 pl-4 text-sm shadow-lg backdrop-blur-md supports-backdrop-filter:bg-popover/75',
          visible && 'pointer-events-auto',
        )}
      >
        <span className="mr-2 font-medium whitespace-nowrap">{count} selected</span>
        {children}
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onDelete} disabled={deleting}>
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </Button>
        <Button size="sm" className="rounded-full" onClick={onClear}>
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
