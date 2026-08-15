import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  Building2,
  Users,
  Handshake,
  ListTodo,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SeedDataButton } from '@/components/seed-data-button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', key: 'applications', icon: Briefcase },
  { to: '/interviews', key: 'interviews', icon: CalendarCheck },
  { to: '/companies', key: 'companies', icon: Building2 },
  { to: '/contacts', key: 'contacts', icon: Users },
  { to: '/offers', key: 'offers', icon: Handshake },
  { to: '/tasks', key: 'tasks', icon: ListTodo },
  { to: '/cv-versions', key: 'cvVersions', icon: FileText },
  { to: '/statistics', key: 'statistics', icon: BarChart3 },
  { to: '/settings', key: 'settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2 px-1 font-semibold tracking-tight">
          <Briefcase className="size-5 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Job Search CRM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                const label = t(`nav.${item.key}`);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={label}
                      render={
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={cn(isActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
                        />
                      }
                    >
                      <item.icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <SeedDataButton variant="ghost" />
      </SidebarFooter>
    </Sidebar>
  );
}
