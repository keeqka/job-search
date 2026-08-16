import { useState } from 'react';
import { ExternalLink, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  usePageTitle(t('nav.cvVersions'));
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
          <Plus className="size-4" /> {t('cvVersions.new')}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={t('cvVersions.failedToLoad')} onRetry={() => refetch()} />}

      {!isLoading && !isError && !cvVersions?.length && (
        <EmptyState
          icon={FileText}
          title={t('cvVersions.noVersionsYet')}
          description={t('cvVersions.emptyDescription')}
          action={<Button onClick={openCreate}>{t('cvVersions.addFirst')}</Button>}
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
                      <Pencil className="size-4" /> {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(cv.id)}>
                      <Trash2 className="size-4" /> {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cv.targetRole && <p className="text-muted-foreground">{t('cvVersions.target', { role: cv.targetRole })}</p>}
                <p className="text-muted-foreground">{t('cvVersions.created', { date: formatDate(cv.createdDate) })}</p>
                {cv.description && <p className="whitespace-pre-wrap">{cv.description}</p>}
                {cv.fileUrl && (
                  <a href={cv.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> {t('cvVersions.openFile')}
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
        title={t('cvVersions.deleteTitle')}
        onConfirm={() => {
          if (deletingId) deleteCv.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
