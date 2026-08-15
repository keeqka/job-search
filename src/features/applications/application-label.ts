import type { Application } from '@/types';

/** "Position — Company", so applications with the same position title stay distinguishable in selects. */
export function applicationLabel(app: Application, companyNameById: Map<string, string>): string {
  const company = companyNameById.get(app.companyId);
  return company ? `${app.position} — ${company}` : app.position;
}
