import { useMemo, useState } from 'react';
import { ListTodo, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { PriorityBadge } from '@/features/applications/status-badge';
import { formatDate } from '@/lib/utils/computed';
import { useTasks, useDeleteTask, useUpdateTask } from '@/features/tasks/hooks';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { TaskFormDialog } from '@/features/tasks/task-form-dialog';
import { TasksKanbanBoard } from '@/features/tasks/tasks-kanban-board';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { useEnumLabel } from '@/i18n/enum-labels';
import type { Task } from '@/types';

export function TasksPage() {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  usePageTitle(t('nav.tasks'));
  const { data: tasks, isLoading, isError, refetch } = useTasks();
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applicationById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  function contextFor(task: Task) {
    if (!task.applicationId) return null;
    const app = applicationById.get(task.applicationId);
    if (!app) return null;
    const company = companyById.get(app.companyId);
    return `${app.position} — ${company?.name ?? t('common.unknown')}`;
  }

  const sorted = useMemo(() => {
    const rank: Record<Task['status'], number> = { Todo: 0, 'In Progress': 1, Done: 2, Cancelled: 3 };
    return [...(tasks ?? [])].sort((a, b) => {
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    });
  }, [tasks]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }
  function toggleDone(task: Task) {
    updateTask.mutate({ id: task.id, data: { status: task.status === 'Done' ? 'Todo' : 'Done' } });
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
          <Plus className="size-4" /> {t('tasks.new')}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={t('tasks.failedToLoad')} onRetry={() => refetch()} />}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title={t('tasks.noTasksYet')}
          description={t('tasks.emptyDescription')}
          action={<Button onClick={openCreate}>{t('tasks.addFirst')}</Button>}
        />
      )}

      {!isLoading && !isError && sorted.length > 0 && view === 'table' && (
        <div className="animate-in fade-in-0 duration-300 space-y-2">
          {sorted.map((task) => {
            const context = contextFor(task);
            const isDone = task.status === 'Done';
            return (
              <div
                key={task.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                onClick={() => openEdit(task)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isDone} onCheckedChange={() => toggleDone(task)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={isDone ? 'text-sm line-through text-muted-foreground' : 'text-sm font-medium'}>
                    {enumLabel('taskType', task.type)}
                  </p>
                  {context && <TruncateTooltip className="text-xs text-muted-foreground">{context}</TruncateTooltip>}
                </div>
                <PriorityBadge priority={task.priority} />
                <span className="w-20 text-right text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(task)}>
                        <Pencil className="size-4" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(task.id)}>
                        <Trash2 className="size-4" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && view === 'kanban' && (
        <TasksKanbanBoard tasks={sorted} contextFor={contextFor} onOpen={openEdit} />
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editing} />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t('tasks.deleteTitle')}
        onConfirm={() => {
          if (deletingId) deleteTask.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
