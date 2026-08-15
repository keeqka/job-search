import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/computed';
import type { Interview } from '@/types';

export function InterviewDetailSheet({
  open,
  onOpenChange,
  interview,
  title,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview?: Interview;
  title: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!interview) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {interview.type} interview · {formatDate(interview.date)} · {interview.result}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>

          {interview.weakTopics && interview.weakTopics.length > 0 && (
            <Section title="Weak topics">
              <div className="flex flex-wrap gap-1.5">
                {interview.weakTopics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </Section>
          )}

          <Section title="Questions">{interview.questions}</Section>
          <Section title="My answers">{interview.myAnswers}</Section>
          <Section title="What went well">{interview.whatWentWell}</Section>
          <Section title="What went bad">{interview.whatWentBad}</Section>
          <Section title="Next step">{interview.nextStep}</Section>
          <Section title="Notes">{interview.notes}</Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title}</p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{children || '—'}</p>
    </div>
  );
}
