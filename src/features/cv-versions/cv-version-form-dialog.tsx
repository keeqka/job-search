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
import type { CvVersion } from '@/types';
import { useCreateCvVersion, useUpdateCvVersion } from '@/features/cv-versions/hooks';

interface FormValues {
  version: string;
  targetRole: string;
  createdDate: string;
  fileUrl: string;
  description: string;
}

const EMPTY: FormValues = { version: '', targetRole: '', createdDate: '', fileUrl: '', description: '' };

function toFormValues(cv?: CvVersion): FormValues {
  if (!cv) return EMPTY;
  return {
    version: cv.version ?? '',
    targetRole: cv.targetRole ?? '',
    createdDate: cv.createdDate?.slice(0, 10) ?? '',
    fileUrl: cv.fileUrl ?? '',
    description: cv.description ?? '',
  };
}

export function CvVersionFormDialog({
  open,
  onOpenChange,
  cvVersion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvVersion?: CvVersion;
}) {
  const isEdit = !!cvVersion;
  const [values, setValues] = useState<FormValues>(() => toFormValues(cvVersion));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const createCv = useCreateCvVersion();
  const updateCv = useUpdateCvVersion();
  const pending = createCv.isPending || updateCv.isPending;

  useEffect(() => {
    if (open) {
      setValues(toFormValues(cvVersion));
      setErrors({});
    }
  }, [open, cvVersion]);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.version.trim()) nextErrors.version = 'Version is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<CvVersion> = {
      version: values.version.trim(),
      targetRole: values.targetRole.trim() || undefined,
      createdDate: values.createdDate || undefined,
      fileUrl: values.fileUrl.trim() || undefined,
      description: values.description.trim() || undefined,
    };

    if (isEdit) {
      await updateCv.mutateAsync({ id: cvVersion.id, data: payload });
    } else {
      await createCv.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit CV version' : 'New CV version'}</DialogTitle>
            <DialogDescription>Keep track of which resume you tailored for which roles.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                value={values.version}
                onChange={(e) => set('version', e.target.value)}
                placeholder="e.g. v3 — Frontend focus"
                aria-invalid={!!errors.version}
                autoFocus
              />
              <FieldError message={errors.version} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetRole">Target role</Label>
                <Input id="targetRole" value={values.targetRole} onChange={(e) => set('targetRole', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="createdDate">Created</Label>
                <Input id="createdDate" type="date" value={values.createdDate} onChange={(e) => set('createdDate', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input id="fileUrl" value={values.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton pending={pending}>{isEdit ? 'Save changes' : 'Create version'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
