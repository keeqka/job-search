import { useMemo, useState } from 'react';
import { ListTodo, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { Task } from '@/types';

export function TasksPage() {
  usePageTitle('Tasks');
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
    return `${app.position} — ${company?.name ?? 'Unknown'}`;
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
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New task
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load tasks." onRetry={() => refetch()} />}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Follow-ups, prep work and reminders you create will show up here."
          action={<Button onClick={openCreate}>Add your first task</Button>}
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
                    {task.type}
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
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(task.id)}>
                        <Trash2 className="size-4" /> Delete
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
        title="Delete this task?"
        onConfirm={() => {
          if (deletingId) deleteTask.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
