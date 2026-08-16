import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/submit-button';
import { FieldError } from '@/components/field-error';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES, type Task } from '@/types';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { applicationLabel } from '@/features/applications/application-label';
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks';
import { useEnumLabel } from '@/i18n/enum-labels';
import { toDateKey } from '@/lib/utils/computed';

interface FormValues {
  applicationId: string;
  type: string;
  dueDate: string;
  priority: string;
  status: string;
  notes: string;
}

const EMPTY: FormValues = {
  applicationId: '',
  type: '',
  dueDate: '',
  priority: 'Medium',
  status: 'Todo',
  notes: '',
};

function toFormValues(task?: Task): FormValues {
  if (!task) return { ...EMPTY, dueDate: toDateKey(new Date()) };
  return {
    applicationId: task.applicationId ?? '',
    type: task.type ?? '',
    dueDate: task.dueDate?.slice(0, 10) ?? '',
    priority: task.priority ?? 'Medium',
    status: task.status ?? 'Todo',
    notes: task.notes ?? '',
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  defaultApplicationId?: string;
}) {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const isEdit = !!task;
  const [values, setValues] = useState<FormValues>(() => toFormValues(task));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const pending = createTask.isPending || updateTask.isPending;

  useEffect(() => {
    if (open) {
      setValues(task ? toFormValues(task) : { ...toFormValues(undefined), applicationId: defaultApplicationId ?? '' });
      setErrors({});
    }
  }, [open, task, defaultApplicationId]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K] | null) {
    setValues((v) => ({ ...v, [key]: value ?? '' }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  const companyNameById = new Map(companies.map((c) => [c.id, c.name]));
  const applicationItems = Object.fromEntries(
    applications.map((a) => [a.id, <TruncateTooltip key={a.id}>{applicationLabel(a, companyNameById)}</TruncateTooltip>]),
  );

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.type) nextErrors.type = t('taskForm.typeRequiredError');
    if (!values.status) nextErrors.status = t('taskForm.statusRequiredError');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Task> = {
      applicationId: values.applicationId || undefined,
      type: values.type as Task['type'],
      dueDate: values.dueDate || undefined,
      priority: values.priority as Task['priority'],
      status: values.status as Task['status'],
      notes: values.notes.trim() || undefined,
    };

    if (isEdit) {
      await updateTask.mutateAsync({ id: task.id, data: payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('taskForm.editTitle') : t('taskForm.newTitle')}</DialogTitle>
            <DialogDescription>{t('taskForm.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('taskForm.typeLabel')}</Label>
              <Select value={values.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger aria-invalid={!!errors.type}><SelectValue placeholder={t('interviewForm.selectType')} /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{enumLabel('taskType', tt)}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError message={errors.type} />
            </div>

            <div className="grid gap-2">
              <Label>{t('common.application')}</Label>
              <Select items={applicationItems} value={values.applicationId} onValueChange={(v) => set('applicationId', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {applications.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <TruncateTooltip>{applicationLabel(a, companyNameById)}</TruncateTooltip>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">{t('taskForm.dueDate')}</Label>
                <Input id="dueDate" type="date" value={values.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('applications.priorityLabel')}</Label>
                <Select value={values.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{enumLabel('priority', p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('taskForm.statusLabel')}</Label>
                <Select value={values.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{enumLabel('taskStatus', s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t('common.notes')}</Label>
              <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <SubmitButton pending={pending}>{isEdit ? t('common.saveChanges') : t('taskForm.createTask')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
