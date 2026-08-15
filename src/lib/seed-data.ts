import type { QueryClient } from '@tanstack/react-query';
import { apiCreate } from '@/lib/api/client';
import type { Application, Company, Contact, Interview, Offer } from '@/types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const COMPANIES: Partial<Company>[] = [
  { name: 'Acme Corp', industry: 'FinTech', location: 'Remote', companySize: '201-500', techStack: 'React, Node.js, PostgreSQL', rating: 4 },
  { name: 'Globex', industry: 'SaaS', location: 'Berlin', companySize: '51-200', techStack: 'TypeScript, Next.js, AWS', rating: 5 },
  { name: 'Initech', industry: 'Consulting', location: 'Almaty', companySize: '1000+', techStack: 'Java, Spring', rating: 3 },
  { name: 'Umbrella Labs', industry: 'AI', location: 'Remote', companySize: '11-50', techStack: 'Python, React, GraphQL', rating: 4 },
  { name: 'Stark Industries', industry: 'E-commerce', location: 'Astana', companySize: '501-1000', techStack: 'React, NestJS, Redis', rating: 5 },
];

const CONTACTS: (Partial<Contact> & { companyIndex: number })[] = [
  { companyIndex: 0, name: 'Alice Recruiter', role: 'Recruiter', email: 'alice@acme.example' },
  { companyIndex: 1, name: 'Bob HR', role: 'HR', email: 'bob@globex.example' },
  { companyIndex: 2, name: 'Carol Manager', role: 'Hiring Manager', email: 'carol@initech.example' },
  { companyIndex: 3, name: 'Dan Lead', role: 'Tech Lead', email: 'dan@umbrella.example' },
  { companyIndex: 4, name: 'Eve Agency', role: 'Agency', email: 'eve@agency.example' },
];

const APPLICATIONS: (Partial<Application> & { companyIndex: number; contactIndex?: number })[] = [
  { companyIndex: 0, contactIndex: 0, position: 'Senior Frontend Engineer', status: 'Technical Interview', source: 'LinkedIn', priority: 'High', dateFound: daysAgo(20), dateApplied: daysAgo(18), salaryMin: 3500, salaryMax: 4500, currency: 'USD', workType: 'Remote', employmentType: 'Full-time' },
  { companyIndex: 1, contactIndex: 1, position: 'Full-stack Developer', status: 'HR Interview', source: 'Referral', priority: 'High', dateFound: daysAgo(15), dateApplied: daysAgo(14), salaryMin: 3000, salaryMax: 4000, currency: 'EUR', workType: 'Hybrid', employmentType: 'Full-time' },
  { companyIndex: 2, contactIndex: 2, position: 'Backend Engineer', status: 'Applied', source: 'HH.kz', priority: 'Medium', dateFound: daysAgo(10), dateApplied: daysAgo(9), salaryMin: 900000, salaryMax: 1200000, currency: 'KZT', workType: 'Office', employmentType: 'Full-time' },
  { companyIndex: 3, contactIndex: 3, position: 'React Engineer', status: 'Offer', source: 'Company Website', priority: 'High', dateFound: daysAgo(30), dateApplied: daysAgo(28), salaryMin: 4000, salaryMax: 5000, currency: 'USD', workType: 'Remote', employmentType: 'Full-time' },
  { companyIndex: 4, contactIndex: 4, position: 'Frontend Developer', status: 'Rejected', source: 'Indeed', priority: 'Low', dateFound: daysAgo(25), dateApplied: daysAgo(24), salaryMin: 2500, salaryMax: 3200, currency: 'USD', workType: 'Office', employmentType: 'Full-time', rejectionReason: 'Went with another candidate' },
  { companyIndex: 0, position: 'Staff Engineer', status: 'Wishlist', source: 'LinkedIn', priority: 'Medium', dateFound: daysAgo(3) },
  { companyIndex: 1, position: 'Platform Engineer', status: 'No Response', source: 'Wellfound', priority: 'Low', dateFound: daysAgo(40), dateApplied: daysAgo(38) },
  { companyIndex: 2, position: 'Tech Lead', status: 'Final Interview', source: 'Habr Career', priority: 'High', dateFound: daysAgo(22), dateApplied: daysAgo(20), salaryMin: 1500000, salaryMax: 1800000, currency: 'KZT', workType: 'Hybrid', employmentType: 'Full-time' },
  { companyIndex: 3, position: 'Contract Frontend Dev', status: 'Withdrawn', source: 'Telegram', priority: 'Low', dateFound: daysAgo(12), dateApplied: daysAgo(11), employmentType: 'Contract' },
  { companyIndex: 4, position: 'Software Engineer', status: 'Recruiter Screen', source: 'Other', priority: 'Medium', dateFound: daysAgo(6), dateApplied: daysAgo(5) },
];

export async function seedDemoData(queryClient: QueryClient): Promise<void> {
  const companies: Company[] = [];
  for (const c of COMPANIES) {
    companies.push(await apiCreate<Company>('companies', c));
  }

  const contacts: Contact[] = [];
  for (const c of CONTACTS) {
    const { companyIndex, ...data } = c;
    contacts.push(await apiCreate<Contact>('contacts', { ...data, companyId: companies[companyIndex].id }));
  }

  const applications: Application[] = [];
  for (const a of APPLICATIONS) {
    const { companyIndex, contactIndex, ...data } = a;
    applications.push(
      await apiCreate<Application>('applications', {
        ...data,
        companyId: companies[companyIndex].id,
        recruiterId: contactIndex != null ? contacts[contactIndex].id : undefined,
      }),
    );
  }

  const interviewSeeds: (Partial<Interview> & { appIndex: number })[] = [
    { appIndex: 0, type: 'Recruiter', result: 'Passed', date: daysAgo(15), questions: 'Tell me about yourself', myAnswers: 'Walked through my background' },
    { appIndex: 0, type: 'Technical', result: 'Scheduled', date: daysAgo(-2), weakTopics: ['System Design', 'Algorithms'] },
    { appIndex: 1, type: 'HR', result: 'Passed', date: daysAgo(10) },
    { appIndex: 3, type: 'Technical', result: 'Passed', date: daysAgo(20), weakTopics: ['Redis'] },
    { appIndex: 3, type: 'Final', result: 'Passed', date: daysAgo(12) },
  ];
  for (const i of interviewSeeds) {
    const { appIndex, ...data } = i;
    await apiCreate<Interview>('interviews', { ...data, applicationId: applications[appIndex].id });
  }

  await apiCreate<Offer>('offers', {
    applicationId: applications[3].id,
    baseSalary: 4800,
    bonus: 500,
    currency: 'USD',
    grossNet: 'Gross',
    remote: 'Remote',
    decision: 'Pending',
    offerDate: daysAgo(10),
    deadline: daysAgo(-5),
  });

  await queryClient.invalidateQueries();
}
