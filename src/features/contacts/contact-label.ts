import type { Contact } from '@/types';

/** "Name — Company", so contacts with the same name stay distinguishable in selects. */
export function contactLabel(contact: Contact, companyNameById: Map<string, string>): string {
  const company = contact.companyId ? companyNameById.get(contact.companyId) : undefined;
  return company ? `${contact.name} — ${company}` : contact.name;
}
