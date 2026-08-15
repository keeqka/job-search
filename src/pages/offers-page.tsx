import { useMemo, useState } from 'react';
import { Handshake, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { formatDate, formatSalaryRange } from '@/lib/utils/computed';
import { useOffers, useDeleteOffer, useBulkDeleteOffers } from '@/features/offers/hooks';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { OfferFormDialog } from '@/features/offers/offer-form-dialog';
import { useSelection } from '@/hooks/useSelection';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import type { Offer } from '@/types';

const DECISION_STYLES: Record<Offer['decision'], string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Accepted: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  Negotiating: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  Expired: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
};

export function OffersPage() {
  usePageTitle('Offers');
  const { data: offers, isLoading, isError, refetch } = useOffers();
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const deleteOffer = useDeleteOffer();
  const bulkDeleteOffers = useBulkDeleteOffers();
  const selection = useSelection();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const applicationById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const offerIds = useMemo(() => (offers ?? []).map((o) => o.id), [offers]);

  function contextFor(offer: Offer) {
    const app = applicationById.get(offer.applicationId);
    if (!app) return { position: 'Unknown', company: 'Unknown' };
    return { position: app.position, company: companyById.get(app.companyId)?.name ?? 'Unknown' };
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(offer: Offer) {
    setEditing(offer);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New offer
        </Button>
      </div>

      <BulkActionsBar
        count={selection.count}
        onClear={selection.clear}
        onDelete={() => setBulkDeleteOpen(true)}
        deleting={bulkDeleteOffers.isPending}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load offers." onRetry={() => refetch()} />}

      {!isLoading && !isError && !offers?.length && (
        <EmptyState
          icon={Handshake}
          title="No offers yet"
          description="Once you get an offer, log the terms here to compare and decide."
          action={<Button onClick={openCreate}>Add your first offer</Button>}
        />
      )}

      {!isLoading && !isError && !!offers?.length && (
        <div className="animate-in fade-in-0 duration-300 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selection.isAllSelected(offerIds)}
                    onCheckedChange={() => selection.toggleAll(offerIds)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Base salary</TableHead>
                <TableHead>Offer date</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const { position, company } = contextFor(offer);
                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selection.selected.has(offer.id)}
                        onCheckedChange={() => selection.toggle(offer.id)}
                        aria-label={`Select offer for ${position}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-56">
                      <TruncateTooltip className="font-medium">{position}</TruncateTooltip>
                      <TruncateTooltip className="text-xs text-muted-foreground">{company}</TruncateTooltip>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSalaryRange({ salaryMin: offer.baseSalary, salaryMax: offer.baseSalary, currency: offer.currency })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(offer.offerDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(offer.deadline)}</TableCell>
                    <TableCell>
                      <Badge className={DECISION_STYLES[offer.decision]} variant="secondary">{offer.decision}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(offer)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(offer.id)}>
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <OfferFormDialog open={formOpen} onOpenChange={setFormOpen} offer={editing} />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this offer?"
        onConfirm={() => {
          if (deletingId) deleteOffer.mutate(deletingId);
          setDeletingId(null);
        }}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selection.count} ${selection.count === 1 ? 'offer' : 'offers'}?`}
        onConfirm={() => {
          bulkDeleteOffers.mutate([...selection.selected], { onSuccess: selection.clear });
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
