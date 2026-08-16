import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TASK_STATUSES, type Task, type TaskStatus } from '@/types';
import { PriorityBadge } from '@/features/applications/status-badge';
import { formatDate } from '@/lib/utils/computed';
import { useUpdateTask } from '@/features/tasks/hooks';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { useEnumLabel } from '@/i18n/enum-labels';

interface KanbanCardData {
  task: Task;
  context: string | null;
}

function KanbanCard({
  data,
  onOpen,
  dragging,
}: {
  data: KanbanCardData;
  onOpen: (task: Task) => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: data.task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const enumLabel = useEnumLabel();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(data.task)}
      className={cn(
        'cursor-grab select-none rounded-lg border bg-card p-3 text-sm shadow-sm active:cursor-grabbing',
        (isDragging || dragging) && 'opacity-50',
      )}
    >
      <div className="mb-1 font-medium">{enumLabel('taskType', data.task.type)}</div>
      {data.context && <TruncateTooltip className="mb-2 text-xs text-muted-foreground">{data.context}</TruncateTooltip>}
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={data.task.priority} />
        {data.task.dueDate && <span className="text-[11px] text-muted-foreground">{formatDate(data.task.dueDate)}</span>}
      </div>
      {data.task.notes && <TruncateTooltip className="mt-1.5 text-xs text-muted-foreground">{data.task.notes}</TruncateTooltip>}
    </div>
  );
}

function KanbanColumn({
  status,
  cards,
  onOpen,
}: {
  status: TaskStatus;
  cards: KanbanCardData[];
  onOpen: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const enumLabel = useEnumLabel();
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{enumLabel('taskStatus', status)}</span>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors',
          isOver ? 'border-primary bg-accent/50' : 'border-border',
        )}
      >
        {cards.map((c) => (
          <KanbanCard key={c.task.id} data={c} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function TasksKanbanBoard({
  tasks,
  contextFor,
  onOpen,
}: {
  tasks: Task[];
  contextFor: (task: Task) => string | null;
  onOpen: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, KanbanCardData[]>();
    for (const status of TASK_STATUSES) map.set(status, []);
    for (const task of tasks) {
      map.get(task.status)?.push({ task, context: contextFor(task) });
    }
    return map;
  }, [tasks, contextFor]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : undefined;
  const activeCard: KanbanCardData | undefined = activeTask
    ? { task: activeTask, context: contextFor(activeTask) }
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    updateTask.mutate({ id: task.id, data: { status: newStatus } });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} cards={grouped.get(status) ?? []} onOpen={onOpen} />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="w-72">
            <KanbanCard data={activeCard} onOpen={() => {}} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
