import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { Briefcase, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MultiSelectFilter } from '@/components/multi-select-filter';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { PRIORITIES, SOURCES, APPLICATION_STATUSES, type Application, type ApplicationStatus } from '@/types';
import {
  useApplications,
  useDeleteApplication,
  useBulkDeleteApplications,
  useBulkUpdateApplications,
} from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { buildColumns, type ApplicationRow } from '@/features/applications/columns';
import { ApplicationFormDialog } from '@/features/applications/application-form-dialog';
import { KanbanBoard } from '@/features/applications/kanban-board';
import { useSelection } from '@/hooks/useSelection';
import { useEnumLabel } from '@/i18n/enum-labels';

export function ApplicationsPage() {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  usePageTitle(t('nav.applications'));
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { data: companies = [] } = useCompanies();
  const deleteApplication = useDeleteApplication();
  const bulkDeleteApplications = useBulkDeleteApplications();
  const bulkUpdateApplications = useBulkUpdateApplications();
  const selection = useSelection();

  // Backed by the URL (not local state) so it survives navigating to a
  // detail page and back — otherwise "back" from a Kanban card always
  // landed on the Table tab.
  const view = searchParams.get('view') === 'kanban' ? 'kanban' : 'table';
  function setView(next: 'table' | 'kanban') {
    setSearchParams(next === 'kanban' ? { view: 'kanban' } : {}, { replace: true });
  }

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [salaryMin, setSalaryMin] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openCreate) {
      setEditing(undefined);
      setFormOpen(true);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const companyNameById = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);

  const rows: ApplicationRow[] = useMemo(
    () => (applications ?? []).map((a) => ({ ...a, companyName: companyNameById.get(a.companyId) ?? t('common.unknown') })),
    [applications, companyNameById, t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q) {
        const haystack = [row.companyName, row.position, row.status, row.source, row.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter.length && !statusFilter.includes(row.status)) return false;
      if (sourceFilter.length && !sourceFilter.includes(row.source)) return false;
      if (priorityFilter.length && !priorityFilter.includes(row.priority)) return false;
      if (companyFilter !== 'all' && row.companyId !== companyFilter) return false;
      if (salaryMin) {
        const value = row.salaryMax ?? row.salaryMin ?? 0;
        if (value < Number(salaryMin)) return false;
      }
      if (dateFrom && (!row.dateApplied || row.dateApplied.slice(0, 10) < dateFrom)) return false;
      if (dateTo && (!row.dateApplied || row.dateApplied.slice(0, 10) > dateTo)) return false;
      return true;
    });
  }, [rows, search, statusFilter, sourceFilter, priorityFilter, companyFilter, salaryMin, dateFrom, dateTo]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(app: Application) {
    setEditing(app);
    setFormOpen(true);
  }
  function openDetail(id: string) {
    navigate(`/applications/${id}`);
  }

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onDelete: setDeletingId, onOpen: openDetail, selection, t, enumLabel }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection.selected, t],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasActiveFilters =
    statusFilter.length > 0 ||
    sourceFilter.length > 0 ||
    priorityFilter.length > 0 ||
    companyFilter !== 'all' ||
    !!salaryMin ||
    !!dateFrom ||
    !!dateTo;

  function clearFilters() {
    setStatusFilter([]);
    setSourceFilter([]);
    setPriorityFilter([]);
    setCompanyFilter('all');
    setSalaryMin('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'kanban')}>
          <TabsList>
            <TabsTrigger value="table">{t('applications.table')}</TabsTrigger>
            <TabsTrigger value="kanban">{t('applications.kanban')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t('applications.new')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t('applications.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <MultiSelectFilter label={t('applications.statusLabel')} options={APPLICATION_STATUSES} selected={statusFilter} onChange={setStatusFilter} renderLabel={(v) => enumLabel('applicationStatus', v)} />
        <MultiSelectFilter label={t('applications.sourceLabel')} options={SOURCES} selected={sourceFilter} onChange={setSourceFilter} renderLabel={(v) => enumLabel('source', v)} />
        <MultiSelectFilter label={t('applications.priorityLabel')} options={PRIORITIES} selected={priorityFilter} onChange={setPriorityFilter} renderLabel={(v) => enumLabel('priority', v)} />
        <Select
          items={{
            all: t('applications.allCompanies'),
            ...Object.fromEntries(companies.map((c) => [c.id, <TruncateTooltip key={c.id}>{c.name}</TruncateTooltip>])),
          }}
          value={companyFilter}
          onValueChange={(v) => setCompanyFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder={t('applications.companyPlaceholder')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('applications.allCompanies')}</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <TruncateTooltip>{c.name}</TruncateTooltip>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder={t('applications.minSalary')}
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          className="w-full sm:w-28"
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-36" title={t('applications.appliedFrom')} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-36" title={t('applications.appliedTo')} />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" /> {t('common.clear')}
          </Button>
        )}
      </div>

      {view === 'table' && (
        <BulkActionsBar
          count={selection.count}
          onClear={selection.clear}
          onDelete={() => setBulkDeleteOpen(true)}
          deleting={bulkDeleteApplications.isPending}
        >
          <Select
            value=""
            onValueChange={(status) => {
              if (!status) return;
              bulkUpdateApplications.mutate(
                { ids: [...selection.selected], data: { status: status as ApplicationStatus } },
                { onSuccess: selection.clear },
              );
            }}
          >
            <SelectTrigger
              size="sm"
              disabled={bulkUpdateApplications.isPending}
              className="rounded-full border-transparent bg-transparent hover:bg-accent"
            >
              <SelectValue placeholder={t('applications.changeStatus')} />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{enumLabel('applicationStatus', s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </BulkActionsBar>
      )}

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={t('applications.failedToLoad')} onRetry={() => refetch()} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title={rows.length ? t('applications.noMatchFilters') : t('applications.noApplicationsYet')}
          description={rows.length ? undefined : t('applications.addFirstDescription')}
          action={!rows.length ? <Button onClick={openCreate}>{t('applications.addFirst')}</Button> : undefined}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && view === 'table' && (
        <div className="animate-in fade-in-0 duration-300 rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'actions' || cell.column.id === 'select'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && view === 'kanban' && (
        <KanbanBoard applications={filtered} companyNameById={companyNameById} onOpen={openDetail} />
      )}

      <ApplicationFormDialog open={formOpen} onOpenChange={setFormOpen} application={editing} />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t('applications.deleteTitle')}
        description={t('applications.deleteDescription')}
        onConfirm={() => {
          if (deletingId) deleteApplication.mutate(deletingId);
          setDeletingId(null);
        }}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t('applications.bulkDeleteTitle', { count: selection.count })}
        description={t('applications.bulkDeleteDescription')}
        onConfirm={() => {
          bulkDeleteApplications.mutate([...selection.selected], { onSuccess: selection.clear });
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
