import { useState } from 'react';
import { ExternalLink, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { formatDate } from '@/lib/utils/computed';
import { useCvVersions, useDeleteCvVersion } from '@/features/cv-versions/hooks';
import { CvVersionFormDialog } from '@/features/cv-versions/cv-version-form-dialog';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import type { CvVersion } from '@/types';

export function CvVersionsPage() {
  usePageTitle('CV Versions');
  const { data: cvVersions, isLoading, isError, refetch } = useCvVersions();
  const deleteCv = useDeleteCvVersion();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CvVersion | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(cv: CvVersion) {
    setEditing(cv);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New version
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load CV versions." onRetry={() => refetch()} />}

      {!isLoading && !isError && !cvVersions?.length && (
        <EmptyState
          icon={FileText}
          title="No CV versions yet"
          description="Track the different resume variants you use for different roles."
          action={<Button onClick={openCreate}>Add your first CV version</Button>}
        />
      )}

      {!isLoading && !isError && !!cvVersions?.length && (
        <div className="animate-in fade-in-0 duration-300 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvVersions.map((cv) => (
            <Card key={cv.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="min-w-0 flex-1 text-base">
                  <TruncateTooltip>{cv.version}</TruncateTooltip>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(cv)}>
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(cv.id)}>
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cv.targetRole && <p className="text-muted-foreground">Target: {cv.targetRole}</p>}
                <p className="text-muted-foreground">Created {formatDate(cv.createdDate)}</p>
                {cv.description && <p className="whitespace-pre-wrap">{cv.description}</p>}
                {cv.fileUrl && (
                  <a href={cv.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> Open file
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CvVersionFormDialog open={formOpen} onOpenChange={setFormOpen} cvVersion={editing} />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this CV version?"
        onConfirm={() => {
          if (deletingId) deleteCv.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
