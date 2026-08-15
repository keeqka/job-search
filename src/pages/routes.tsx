import { Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/dashboard-page';
import { ApplicationsPage } from '@/pages/applications-page';
import { ApplicationDetailPage } from '@/pages/application-detail-page';
import { CompaniesPage } from '@/pages/companies-page';
import { ContactsPage } from '@/pages/contacts-page';
import { InterviewsPage } from '@/pages/interviews-page';
import { OffersPage } from '@/pages/offers-page';
import { TasksPage } from '@/pages/tasks-page';
import { CvVersionsPage } from '@/pages/cv-versions-page';
import { StatisticsPage } from '@/pages/statistics-page';
import { SettingsPage } from '@/pages/settings-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/applications" element={<ApplicationsPage />} />
      <Route path="/applications/:id" element={<ApplicationDetailPage />} />
      <Route path="/companies" element={<CompaniesPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/interviews" element={<InterviewsPage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/cv-versions" element={<CvVersionsPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
