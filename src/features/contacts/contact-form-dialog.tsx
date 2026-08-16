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
import { CONTACT_ROLES, type Contact } from '@/types';
import { useCompanies } from '@/features/companies/hooks';
import { useCreateContact, useUpdateContact } from '@/features/contacts/hooks';
import { toDateKey } from '@/lib/utils/computed';
import { useEnumLabel } from '@/i18n/enum-labels';

interface FormValues {
  name: string;
  companyId: string;
  role: string;
  email: string;
  telegram: string;
  linkedin: string;
  phone: string;
  firstContact: string;
  lastContact: string;
  nextContact: string;
  notes: string;
}

const EMPTY: FormValues = {
  name: '',
  companyId: '',
  role: '',
  email: '',
  telegram: '',
  linkedin: '',
  phone: '',
  firstContact: '',
  lastContact: '',
  nextContact: '',
  notes: '',
};

function toFormValues(contact?: Contact): FormValues {
  if (!contact) {
    const today = toDateKey(new Date());
    return { ...EMPTY, firstContact: today, lastContact: today, nextContact: today };
  }
  return {
    name: contact.name ?? '',
    companyId: contact.companyId ?? '',
    role: contact.role ?? '',
    email: contact.email ?? '',
    telegram: contact.telegram ?? '',
    linkedin: contact.linkedin ?? '',
    phone: contact.phone ?? '',
    firstContact: contact.firstContact?.slice(0, 10) ?? '',
    lastContact: contact.lastContact?.slice(0, 10) ?? '',
    nextContact: contact.nextContact?.slice(0, 10) ?? '',
    notes: contact.notes ?? '',
  };
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultCompanyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  defaultCompanyId?: string;
}) {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const isEdit = !!contact;
  const [values, setValues] = useState<FormValues>(() => toFormValues(contact));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { data: companies = [] } = useCompanies();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const pending = createContact.isPending || updateContact.isPending;

  useEffect(() => {
    if (open) {
      setValues(contact ? toFormValues(contact) : { ...toFormValues(undefined), companyId: defaultCompanyId ?? '' });
      setErrors({});
    }
  }, [open, contact, defaultCompanyId]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K] | null) {
    setValues((v) => ({ ...v, [key]: value ?? '' }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  const companyItems = Object.fromEntries(
    companies.map((c) => [c.id, <TruncateTooltip key={c.id}>{c.name}</TruncateTooltip>]),
  );

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = t('contactForm.nameRequiredError');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Contact> = {
      name: values.name.trim(),
      companyId: values.companyId || undefined,
      role: (values.role || undefined) as Contact['role'],
      email: values.email.trim() || undefined,
      telegram: values.telegram.trim() || undefined,
      linkedin: values.linkedin.trim() || undefined,
      phone: values.phone.trim() || undefined,
      firstContact: values.firstContact || undefined,
      lastContact: values.lastContact || undefined,
      nextContact: values.nextContact || undefined,
      notes: values.notes.trim() || undefined,
    };

    if (isEdit) {
      await updateContact.mutateAsync({ id: contact.id, data: payload });
    } else {
      await createContact.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('contactForm.editTitle') : t('contactForm.newTitle')}</DialogTitle>
            <DialogDescription>{t('contactForm.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('companyForm.nameLabel')}</Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  autoFocus
                />
                <FieldError message={errors.name} />
              </div>
              <div className="grid gap-2">
                <Label>{t('applicationDetail.role')}</Label>
                <Select value={values.role} onValueChange={(v) => set('role', v)}>
                  <SelectTrigger><SelectValue placeholder={t('contactForm.selectRole')} /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((r) => <SelectItem key={r} value={r}>{enumLabel('contactRole', r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('common.company')}</Label>
              <Select items={companyItems} value={values.companyId} onValueChange={(v) => set('companyId', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <TruncateTooltip>{c.name}</TruncateTooltip>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('contactForm.email')}</Label>
                <Input id="email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('contactForm.phone')}</Label>
                <Input id="phone" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telegram">{t('contactForm.telegram')}</Label>
                <Input id="telegram" value={values.telegram} onChange={(e) => set('telegram', e.target.value)} placeholder="@username" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">{t('common.linkedin')}</Label>
                <Input id="linkedin" value={values.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstContact">{t('contactForm.firstContact')}</Label>
                <Input id="firstContact" type="date" value={values.firstContact} onChange={(e) => set('firstContact', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastContact">{t('contactForm.lastContact')}</Label>
                <Input id="lastContact" type="date" value={values.lastContact} onChange={(e) => set('lastContact', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextContact">{t('contactForm.nextContact')}</Label>
                <Input id="nextContact" type="date" value={values.nextContact} onChange={(e) => set('nextContact', e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t('common.notes')}</Label>
              <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <SubmitButton pending={pending}>{isEdit ? t('common.saveChanges') : t('contactForm.createContact')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
