import { useEffect, useState } from 'react';
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
import { MultiSelectFilter } from '@/components/multi-select-filter';
import { INTERVIEW_RESULTS, INTERVIEW_TYPES, WEAK_TOPICS, type Interview } from '@/types';
import { useApplications } from '@/features/applications/hooks';
import { applicationLabel } from '@/features/applications/application-label';
import { useCompanies } from '@/features/companies/hooks';
import { useContacts } from '@/features/contacts/hooks';
import { contactLabel } from '@/features/contacts/contact-label';
import { useCreateInterview, useUpdateInterview } from '@/features/interviews/hooks';

interface FormValues {
  applicationId: string;
  date: string;
  type: string;
  interviewerId: string;
  result: string;
  questions: string;
  myAnswers: string;
  whatWentWell: string;
  whatWentBad: string;
  weakTopics: string[];
  nextStep: string;
  notes: string;
}

const EMPTY: FormValues = {
  applicationId: '',
  date: '',
  type: '',
  interviewerId: '',
  result: 'Scheduled',
  questions: '',
  myAnswers: '',
  whatWentWell: '',
  whatWentBad: '',
  weakTopics: [],
  nextStep: '',
  notes: '',
};

function toFormValues(interview?: Interview): FormValues {
  if (!interview) return EMPTY;
  return {
    applicationId: interview.applicationId ?? '',
    date: interview.date?.slice(0, 10) ?? '',
    type: interview.type ?? '',
    interviewerId: interview.interviewerId ?? '',
    result: interview.result ?? 'Scheduled',
    questions: interview.questions ?? '',
    myAnswers: interview.myAnswers ?? '',
    whatWentWell: interview.whatWentWell ?? '',
    whatWentBad: interview.whatWentBad ?? '',
    weakTopics: interview.weakTopics ?? [],
    nextStep: interview.nextStep ?? '',
    notes: interview.notes ?? '',
  };
}

export function InterviewFormDialog({
  open,
  onOpenChange,
  interview,
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview?: Interview;
  defaultApplicationId?: string;
}) {
  const isEdit = !!interview;
  const [values, setValues] = useState<FormValues>(() => toFormValues(interview));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const createInterview = useCreateInterview();
  const updateInterview = useUpdateInterview();
  const pending = createInterview.isPending || updateInterview.isPending;

  useEffect(() => {
    if (open) {
      setValues(interview ? toFormValues(interview) : { ...EMPTY, applicationId: defaultApplicationId ?? '' });
      setErrors({});
    }
  }, [open, interview, defaultApplicationId]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K] | null) {
    setValues((v) => ({ ...v, [key]: value ?? '' }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  const companyNameById = new Map(companies.map((c) => [c.id, c.name]));
  const applicationItems = Object.fromEntries(
    applications.map((a) => [a.id, <TruncateTooltip key={a.id}>{applicationLabel(a, companyNameById)}</TruncateTooltip>]),
  );
  const contactItems = Object.fromEntries(
    contacts.map((c) => [c.id, <TruncateTooltip key={c.id}>{contactLabel(c, companyNameById)}</TruncateTooltip>]),
  );

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.applicationId) nextErrors.applicationId = 'Application is required';
    if (!values.type) nextErrors.type = 'Type is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Interview> = {
      applicationId: values.applicationId,
      date: values.date || undefined,
      type: values.type as Interview['type'],
      interviewerId: values.interviewerId || undefined,
      result: values.result as Interview['result'],
      questions: values.questions.trim() || undefined,
      myAnswers: values.myAnswers.trim() || undefined,
      whatWentWell: values.whatWentWell.trim() || undefined,
      whatWentBad: values.whatWentBad.trim() || undefined,
      weakTopics: values.weakTopics.length ? (values.weakTopics as Interview['weakTopics']) : undefined,
      nextStep: values.nextStep.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    if (isEdit) {
      await updateInterview.mutateAsync({ id: interview.id, data: payload });
    } else {
      await createInterview.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit interview' : 'New interview'}</DialogTitle>
            <DialogDescription>Track interview details, questions and takeaways.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Application *</Label>
              <Select items={applicationItems} value={values.applicationId} onValueChange={(v) => set('applicationId', v)}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.applicationId}><SelectValue placeholder="Select application" /></SelectTrigger>
                <SelectContent>
                  {applications.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <TruncateTooltip>{applicationLabel(a, companyNameById)}</TruncateTooltip>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.applicationId} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={values.type} onValueChange={(v) => set('type', v)}>
                  <SelectTrigger aria-invalid={!!errors.type}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FieldError message={errors.type} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Result *</Label>
                <Select value={values.result} onValueChange={(v) => set('result', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_RESULTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Interviewer</Label>
              <Select items={contactItems} value={values.interviewerId} onValueChange={(v) => set('interviewerId', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <TruncateTooltip>{contactLabel(c, companyNameById)}</TruncateTooltip>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Weak topics</Label>
              <MultiSelectFilter
                label="Weak topics"
                options={WEAK_TOPICS}
                selected={values.weakTopics}
                onChange={(v) => setValues((prev) => ({ ...prev, weakTopics: v }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="questions">Questions asked</Label>
              <Textarea id="questions" rows={3} value={values.questions} onChange={(e) => set('questions', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="myAnswers">My answers</Label>
              <Textarea id="myAnswers" rows={3} value={values.myAnswers} onChange={(e) => set('myAnswers', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="whatWentWell">What went well</Label>
                <Textarea id="whatWentWell" rows={2} value={values.whatWentWell} onChange={(e) => set('whatWentWell', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatWentBad">What went bad</Label>
                <Textarea id="whatWentBad" rows={2} value={values.whatWentBad} onChange={(e) => set('whatWentBad', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nextStep">Next step</Label>
              <Input id="nextStep" value={values.nextStep} onChange={(e) => set('nextStep', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton pending={pending}>{isEdit ? 'Save changes' : 'Create interview'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
