import type { ColumnDef, Table } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, PriorityBadge } from '@/features/applications/status-badge';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { formatDate, formatSalaryRange, isFollowUpNeeded } from '@/lib/utils/computed';
import type { useSelection } from '@/hooks/useSelection';
import type { Application } from '@/types';

export interface ApplicationRow extends Application {
  companyName: string;
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) {
    return (
      <Button
        variant="ghost"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {label}
        <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    );
  };
}

export function buildColumns(opts: {
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
  selection: ReturnType<typeof useSelection>;
}): ColumnDef<ApplicationRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }: { table: Table<ApplicationRow> }) => {
        const ids = table.getRowModel().rows.map((r) => r.original.id);
        return (
          <Checkbox
            checked={opts.selection.isAllSelected(ids)}
            onCheckedChange={() => opts.selection.toggleAll(ids)}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={opts.selection.selected.has(row.original.id)}
          onCheckedChange={() => opts.selection.toggle(row.original.id)}
          aria-label={`Select ${row.original.position}`}
        />
      ),
    },
    {
      accessorKey: 'companyName',
      header: sortableHeader('Company'),
      cell: ({ row }) => (
        <button
          className="max-w-48 font-medium hover:underline text-left"
          onClick={() => opts.onOpen(row.original.id)}
        >
          <TruncateTooltip>{row.original.companyName}</TruncateTooltip>
        </button>
      ),
    },
    {
      accessorKey: 'position',
      header: sortableHeader('Position'),
      cell: ({ row }) => (
        <button className="max-w-48 text-left hover:underline" onClick={() => opts.onOpen(row.original.id)}>
          <TruncateTooltip>{row.original.position}</TruncateTooltip>
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={row.original.status} />
          {isFollowUpNeeded(row.original) && (
            <AlertCircle className="size-3.5 text-amber-500" aria-label="Follow up needed" />
          )}
        </div>
      ),
      filterFn: (row, id, value: string[]) => !value?.length || value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      filterFn: (row, id, value: string[]) => !value?.length || value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      filterFn: (row, id, value: string[]) => !value?.length || value.includes(row.getValue(id)),
    },
    {
      id: 'salary',
      header: 'Salary',
      accessorFn: (row) => row.salaryMax ?? row.salaryMin ?? 0,
      cell: ({ row }) => <span className="text-muted-foreground">{formatSalaryRange(row.original)}</span>,
    },
    {
      accessorKey: 'dateApplied',
      header: sortableHeader('Date Applied'),
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.dateApplied)}</span>,
    },
    {
      accessorKey: 'nextAction',
      header: 'Next Action',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.nextAction || '—'}</span>,
    },
    {
      accessorKey: 'nextActionDate',
      header: sortableHeader('Next Action Date'),
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.nextActionDate)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => opts.onOpen(row.original.id)}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => opts.onEdit(row.original)}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => opts.onDelete(row.original.id)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
