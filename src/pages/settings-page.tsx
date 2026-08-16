import { useState } from 'react';
import { Bell, Palette, Plug, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TypeToConfirmDialog } from '@/components/type-to-confirm-dialog';
import { useClearAllData } from '@/features/settings/hooks';

export function SettingsPage() {
  const { t } = useTranslation();
  usePageTitle(t('nav.settings'));
  const clearAllData = useClearAllData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const comingSoon = [
    { icon: User, title: t('settings.profileTitle'), description: t('settings.profileDescription') },
    { icon: Palette, title: t('settings.appearanceTitle'), description: t('settings.appearanceDescription') },
    { icon: Bell, title: t('settings.notificationsTitle'), description: t('settings.notificationsDescription') },
    { icon: Plug, title: t('settings.integrationsTitle'), description: t('settings.integrationsDescription') },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {comingSoon.map((item) => (
          <Card key={item.title} className="opacity-70">
            <CardHeader>
              <div className="flex items-center justify-between">
                <item.icon className="size-5 text-muted-foreground" />
                <Badge variant="secondary">{t('settings.comingSoon')}</Badge>
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t('settings.dangerZone')}</CardTitle>
          <CardDescription>{t('settings.dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">{t('settings.deleteAllData')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.deleteAllDataDescription')}</p>
            </div>
            <Button variant="destructive" className="shrink-0" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" />
              {t('settings.deleteAllData')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TypeToConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('settings.deleteAllDataTitle')}
        description={t('settings.deleteAllDataConfirmDescription')}
        confirmPhrase={t('settings.confirmPhrase')}
        confirmLabel={t('settings.deleteEverything')}
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
