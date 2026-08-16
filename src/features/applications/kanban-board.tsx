import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { KANBAN_STATUSES, TERMINAL_STATUSES, type Application, type ApplicationStatus } from '@/types';
import { PriorityBadge } from '@/features/applications/status-badge';
import { formatDate, formatSalaryRange } from '@/lib/utils/computed';
import { useUpdateApplicationStatus } from '@/features/applications/hooks';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { useEnumLabel } from '@/i18n/enum-labels';

interface KanbanCardData {
  application: Application;
  companyName: string;
}

function KanbanCard({ data, onOpen, dragging }: { data: KanbanCardData; onOpen: (id: string) => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: data.application.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(data.application.id)}
      className={cn(
        'cursor-grab select-none rounded-lg border bg-card p-3 text-sm shadow-sm active:cursor-grabbing',
        (isDragging || dragging) && 'opacity-50',
      )}
    >
      <TruncateTooltip className="mb-1 font-medium">{data.application.position}</TruncateTooltip>
      <TruncateTooltip className="mb-2 text-xs text-muted-foreground">{data.companyName}</TruncateTooltip>
      <div className="mb-2 text-xs text-muted-foreground">{formatSalaryRange(data.application)}</div>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={data.application.priority} />
        {data.application.nextActionDate && (
          <span className="text-[11px] text-muted-foreground">{formatDate(data.application.nextActionDate)}</span>
        )}
      </div>
      {data.application.nextAction && (
        <div className="mt-1.5 truncate text-xs text-muted-foreground">→ {data.application.nextAction}</div>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  cards,
  onOpen,
}: {
  status: ApplicationStatus;
  cards: KanbanCardData[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const enumLabel = useEnumLabel();
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{enumLabel('applicationStatus', status)}</span>
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
          <KanbanCard key={c.application.id} data={c} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  applications,
  companyNameById,
  onOpen,
}: {
  applications: Application[];
  companyNameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const updateStatus = useUpdateApplicationStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = new Map<ApplicationStatus, KanbanCardData[]>();
    for (const status of [...KANBAN_STATUSES, ...TERMINAL_STATUSES]) map.set(status, []);
    for (const app of applications) {
      const entry: KanbanCardData = { application: app, companyName: companyNameById.get(app.companyId) ?? t('common.unknown') };
      map.get(app.status)?.push(entry);
    }
    return map;
  }, [applications, companyNameById, t]);

  const activeCard = activeId
    ? applications
        .filter((a) => a.id === activeId)
        .map((a) => ({ application: a, companyName: companyNameById.get(a.companyId) ?? t('common.unknown') }))[0]
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ApplicationStatus;
    const app = applications.find((a) => a.id === active.id);
    if (!app || app.status === newStatus) return;
    updateStatus.mutate({ id: app.id, status: newStatus });
  }

  const terminalCount = TERMINAL_STATUSES.reduce((sum, s) => sum + (grouped.get(s)?.length ?? 0), 0);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} cards={grouped.get(status) ?? []} onOpen={onOpen} />
        ))}
      </div>

      {terminalCount > 0 && (
        <div className="mt-6 border-t pt-4">
          <button
            className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setShowTerminal((v) => !v)}
          >
            {showTerminal ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            {t('applications.closedApplications', { count: terminalCount })}
          </button>
          {showTerminal && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {TERMINAL_STATUSES.map((status) => (
                <KanbanColumn key={status} status={status} cards={grouped.get(status) ?? []} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      )}

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
