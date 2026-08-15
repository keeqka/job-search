import { useState } from 'react';
import { Bell, Palette, Plug, Trash2, User } from 'lucide-react';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TypeToConfirmDialog } from '@/components/type-to-confirm-dialog';
import { useClearAllData } from '@/features/settings/hooks';

const COMING_SOON = [
  { icon: User, title: 'Profile', description: 'Name, email and default preferences for your job search.' },
  { icon: Palette, title: 'Appearance', description: 'Theme, density and layout options beyond dark/light mode.' },
  { icon: Bell, title: 'Notifications', description: 'Reminders for follow-ups and upcoming interviews.' },
  { icon: Plug, title: 'Integrations', description: 'Connect calendars, email or other job boards.' },
];

export function SettingsPage() {
  usePageTitle('Settings');
  const clearAllData = useClearAllData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COMING_SOON.map((item) => (
          <Card key={item.title} className="opacity-70">
            <CardHeader>
              <div className="flex items-center justify-between">
                <item.icon className="size-5 text-muted-foreground" />
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions. Use with care.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">Delete all data</p>
              <p className="text-sm text-muted-foreground">
                Permanently removes every application, company, contact, interview, offer, task and
                CV version from your Google Sheet — including demo data and anything you've added
                yourself. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="shrink-0" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" />
              Delete all data
            </Button>
          </div>
        </CardContent>
      </Card>

      <TypeToConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete all data?"
        description="This will permanently erase every record in every sheet — applications, companies, contacts, interviews, offers, tasks and CV versions. There is no undo."
        confirmPhrase="delete all data"
        confirmLabel="Delete everything"
        pending={clearAllData.isPending}
        onConfirm={() => {
          clearAllData.mutate(undefined, {
            onSuccess: () => setConfirmOpen(false),
          });
        }}
      />
    </div>
  );
}
