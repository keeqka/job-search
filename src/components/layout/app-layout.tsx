import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { GlobalSearch } from '@/components/layout/global-search';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { PageTitleProvider, usePageTitleState } from '@/components/layout/page-title-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [title, setTitle] = usePageTitleState(t('nav.dashboard'));

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            <LanguageToggle />
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate('/applications', { state: { openCreate: true } })}
            >
              <Plus className="size-4" />
              {t('header.application')}
            </Button>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-6">
          <PageTitleProvider onTitleChange={setTitle}>{children}</PageTitleProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
