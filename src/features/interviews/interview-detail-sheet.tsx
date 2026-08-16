import { useTranslation } from 'react-i18next';
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
import { useEnumLabel } from '@/i18n/enum-labels';
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
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();

  if (!interview) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {t('interviews.typeInterview', { type: enumLabel('interviewType', interview.type) })} · {formatDate(interview.date)} · {enumLabel('interviewResult', interview.result)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="size-4" /> {t('common.edit')}
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> {t('common.delete')}
            </Button>
          </div>

          {interview.weakTopics && interview.weakTopics.length > 0 && (
            <Section title={t('interviewForm.weakTopics')}>
              <div className="flex flex-wrap gap-1.5">
                {interview.weakTopics.map((topic) => (
                  <Badge key={topic} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </Section>
          )}

          <Section title={t('interviewForm.questionsAsked')}>{interview.questions}</Section>
          <Section title={t('interviewForm.myAnswers')}>{interview.myAnswers}</Section>
          <Section title={t('interviewForm.whatWentWell')}>{interview.whatWentWell}</Section>
          <Section title={t('interviewForm.whatWentBad')}>{interview.whatWentBad}</Section>
          <Section title={t('interviewForm.nextStep')}>{interview.nextStep}</Section>
          <Section title={t('common.notes')}>{interview.notes}</Section>
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
