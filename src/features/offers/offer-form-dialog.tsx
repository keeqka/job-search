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
import { CURRENCIES, OFFER_DECISIONS, WORK_TYPES, type Offer } from '@/types';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { applicationLabel } from '@/features/applications/application-label';
import { useCreateOffer, useUpdateOffer } from '@/features/offers/hooks';

interface FormValues {
  applicationId: string;
  baseSalary: string;
  bonus: string;
  currency: string;
  grossNet: string;
  equity: string;
  vacation: string;
  remote: string;
  probation: string;
  benefits: string;
  offerDate: string;
  deadline: string;
  decision: string;
  notes: string;
}

const EMPTY: FormValues = {
  applicationId: '',
  baseSalary: '',
  bonus: '',
  currency: '',
  grossNet: '',
  equity: '',
  vacation: '',
  remote: '',
  probation: '',
  benefits: '',
  offerDate: '',
  deadline: '',
  decision: 'Pending',
  notes: '',
};

function toFormValues(offer?: Offer): FormValues {
  if (!offer) return EMPTY;
  return {
    applicationId: offer.applicationId ?? '',
    baseSalary: offer.baseSalary != null ? String(offer.baseSalary) : '',
    bonus: offer.bonus != null ? String(offer.bonus) : '',
    currency: offer.currency ?? '',
    grossNet: offer.grossNet ?? '',
    equity: offer.equity ?? '',
    vacation: offer.vacation ?? '',
    remote: offer.remote ?? '',
    probation: offer.probation ?? '',
    benefits: offer.benefits ?? '',
    offerDate: offer.offerDate?.slice(0, 10) ?? '',
    deadline: offer.deadline?.slice(0, 10) ?? '',
    decision: offer.decision ?? 'Pending',
    notes: offer.notes ?? '',
  };
}

export function OfferFormDialog({
  open,
  onOpenChange,
  offer,
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: Offer;
  defaultApplicationId?: string;
}) {
  const isEdit = !!offer;
  const [values, setValues] = useState<FormValues>(() => toFormValues(offer));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const pending = createOffer.isPending || updateOffer.isPending;

  useEffect(() => {
    if (open) {
      setValues(offer ? toFormValues(offer) : { ...EMPTY, applicationId: defaultApplicationId ?? '' });
      setErrors({});
    }
  }, [open, offer, defaultApplicationId]);

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
    if (!values.applicationId) nextErrors.applicationId = 'Application is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Offer> = {
      applicationId: values.applicationId,
      baseSalary: values.baseSalary ? Number(values.baseSalary) : undefined,
      bonus: values.bonus ? Number(values.bonus) : undefined,
      currency: (values.currency || undefined) as Offer['currency'],
      grossNet: (values.grossNet || undefined) as Offer['grossNet'],
      equity: values.equity.trim() || undefined,
      vacation: values.vacation.trim() || undefined,
      remote: (values.remote || undefined) as Offer['remote'],
      probation: values.probation.trim() || undefined,
      benefits: values.benefits.trim() || undefined,
      offerDate: values.offerDate || undefined,
      deadline: values.deadline || undefined,
      decision: values.decision as Offer['decision'],
      notes: values.notes.trim() || undefined,
    };

    if (isEdit) {
      await updateOffer.mutateAsync({ id: offer.id, data: payload });
    } else {
      await createOffer.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit offer' : 'New offer'}</DialogTitle>
            <DialogDescription>Record the terms of an offer so you can compare and decide.</DialogDescription>
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

            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="baseSalary">Base salary</Label>
                <Input id="baseSalary" type="number" value={values.baseSalary} onChange={(e) => set('baseSalary', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bonus">Bonus</Label>
                <Input id="bonus" type="number" value={values.bonus} onChange={(e) => set('bonus', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={values.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Gross/Net</Label>
                <Select value={values.grossNet} onValueChange={(v) => set('grossNet', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gross">Gross</SelectItem>
                    <SelectItem value="Net">Net</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="equity">Equity</Label>
                <Input id="equity" value={values.equity} onChange={(e) => set('equity', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vacation">Vacation</Label>
                <Input id="vacation" value={values.vacation} onChange={(e) => set('vacation', e.target.value)} placeholder="e.g. 20 days" />
              </div>
              <div className="grid gap-2">
                <Label>Remote</Label>
                <Select value={values.remote} onValueChange={(v) => set('remote', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="probation">Probation</Label>
                <Input id="probation" value={values.probation} onChange={(e) => set('probation', e.target.value)} placeholder="e.g. 3 months" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="benefits">Benefits</Label>
                <Input id="benefits" value={values.benefits} onChange={(e) => set('benefits', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="offerDate">Offer date</Label>
                <Input id="offerDate" type="date" value={values.offerDate} onChange={(e) => set('offerDate', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={values.deadline} onChange={(e) => set('deadline', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Decision *</Label>
                <Select value={values.decision} onValueChange={(v) => set('decision', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OFFER_DECISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton pending={pending}>{isEdit ? 'Save changes' : 'Create offer'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
