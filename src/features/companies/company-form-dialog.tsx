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
import { COMPANY_SIZES, INDUSTRIES, type Company } from '@/types';
import { useCreateCompany, useUpdateCompany } from '@/features/companies/hooks';

interface FormValues {
  name: string;
  website: string;
  linkedin: string;
  industry: string;
  location: string;
  companySize: string;
  techStack: string;
  rating: string;
  notes: string;
}

const EMPTY: FormValues = {
  name: '',
  website: '',
  linkedin: '',
  industry: '',
  location: '',
  companySize: '',
  techStack: '',
  rating: '',
  notes: '',
};

function toFormValues(company?: Company): FormValues {
  if (!company) return EMPTY;
  return {
    name: company.name ?? '',
    website: company.website ?? '',
    linkedin: company.linkedin ?? '',
    industry: company.industry ?? '',
    location: company.location ?? '',
    companySize: company.companySize ?? '',
    techStack: company.techStack ?? '',
    rating: company.rating != null ? String(company.rating) : '',
    notes: company.notes ?? '',
  };
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSaved?: (company: Company) => void;
}) {
  const isEdit = !!company;
  const [values, setValues] = useState<FormValues>(() => toFormValues(company));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const pending = createCompany.isPending || updateCompany.isPending;

  useEffect(() => {
    if (open) {
      setValues(toFormValues(company));
      setErrors({});
    }
  }, [open, company]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K] | null) {
    setValues((v) => ({ ...v, [key]: value ?? '' }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = 'Company name is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Company> = {
      name: values.name.trim(),
      website: values.website.trim() || undefined,
      linkedin: values.linkedin.trim() || undefined,
      industry: (values.industry || undefined) as Company['industry'],
      location: values.location.trim() || undefined,
      companySize: (values.companySize || undefined) as Company['companySize'],
      techStack: values.techStack.trim() || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      notes: values.notes.trim() || undefined,
    };

    const saved = isEdit
      ? await updateCompany.mutateAsync({ id: company.id, data: payload })
      : await createCompany.mutateAsync(payload);

    onOpenChange(false);
    onSaved?.(saved);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit company' : 'New company'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update company details.' : 'Add a company you are targeting or have applied to.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={!!errors.name}
                autoFocus
              />
              <FieldError message={errors.name} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={values.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={values.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Industry</Label>
                <Select value={values.industry} onValueChange={(v) => set('industry', v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Company size</Label>
                <Select value={values.companySize} onValueChange={(v) => set('companySize', v)}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={values.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input id="rating" type="number" min={1} max={5} value={values.rating} onChange={(e) => set('rating', e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="techStack">Tech stack</Label>
              <Input id="techStack" value={values.techStack} onChange={(e) => set('techStack', e.target.value)} placeholder="React, Node.js, PostgreSQL..." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>
              {isEdit ? 'Save changes' : 'Create company'}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
