// ---------------------------------------------------------------------------
// Enums (as const tuples so they can drive <Select> options directly)
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES = [
  'Wishlist',
  'Applied',
  'Recruiter Screen',
  'HR Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'No Response',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const TERMINAL_STATUSES: ApplicationStatus[] = [
  'Rejected',
  'Withdrawn',
  'No Response',
];

export const PIPELINE_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Recruiter Screen',
  'HR Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Accepted',
];

export const KANBAN_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Recruiter Screen',
  'HR Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Accepted',
];

export const SOURCES = [
  'LinkedIn',
  'HH.kz',
  'Telegram',
  'Company Website',
  'Referral',
  'Indeed',
  'Wellfound',
  'Habr Career',
  'Other',
] as const;
export type Source = (typeof SOURCES)[number];

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Other',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_TYPES = ['Remote', 'Hybrid', 'Office', 'Other'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const CURRENCIES = ['USD', 'EUR', 'KZT', 'Other'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const INDUSTRIES = [
  'FinTech',
  'Crypto',
  'SaaS',
  'E-commerce',
  'Banking',
  'AI',
  'Consulting',
  'Gaming',
  'Other',
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
  'Unknown',
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const CONTACT_ROLES = [
  'Recruiter',
  'HR',
  'Hiring Manager',
  'Engineering Manager',
  'Tech Lead',
  'Employee',
  'Agency',
  'Other',
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const INTERVIEW_TYPES = [
  'HR',
  'Recruiter',
  'Technical',
  'System Design',
  'Live Coding',
  'Pair Programming',
  'Manager',
  'Final',
  'Other',
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_RESULTS = [
  'Scheduled',
  'Passed',
  'Failed',
  'Waiting',
  'Cancelled',
] as const;
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number];

export const WEAK_TOPICS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'NestJS',
  'SQL',
  'PostgreSQL',
  'Database Design',
  'Indexes',
  'Transactions',
  'Isolation Levels',
  'Query Optimization',
  'Redis',
  'REST',
  'GraphQL',
  'Docker',
  'AWS',
  'System Design',
  'Testing',
  'CI/CD',
  'Git',
  'Algorithms',
  'Behavioral',
  'English',
] as const;
export type WeakTopic = (typeof WEAK_TOPICS)[number];

export const OFFER_DECISIONS = [
  'Pending',
  'Accepted',
  'Rejected',
  'Negotiating',
  'Expired',
] as const;
export type OfferDecision = (typeof OFFER_DECISIONS)[number];

export const TASK_TYPES = [
  'Apply',
  'Follow Up',
  'Prepare Interview',
  'Send CV',
  'Contact Recruiter',
  'Research Company',
  'Prepare Coding',
  'Prepare System Design',
  'Other',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ['Todo', 'In Progress', 'Done', 'Cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface Application {
  id: string;
  companyId: string;
  position: string;
  status: ApplicationStatus;
  source: Source;
  vacancyUrl?: string;
  applicationUrl?: string;
  dateFound?: string;
  dateApplied?: string;
  lastActivity?: string;
  nextAction?: string;
  nextActionDate?: string;
  priority: Priority;
  salaryMin?: number;
  salaryMax?: number;
  currency?: Currency;
  employmentType?: EmploymentType;
  workType?: WorkType;
  location?: string;
  recruiterId?: string;
  cvVersion?: string;
  jobDescription?: string;
  coverLetter?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  linkedin?: string;
  industry?: Industry;
  location?: string;
  companySize?: CompanySize;
  techStack?: string;
  rating?: number;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  companyId?: string;
  role?: ContactRole;
  email?: string;
  telegram?: string;
  linkedin?: string;
  phone?: string;
  firstContact?: string;
  lastContact?: string;
  nextContact?: string;
  notes?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  date?: string;
  type: InterviewType;
  interviewerId?: string;
  result: InterviewResult;
  questions?: string;
  myAnswers?: string;
  whatWentWell?: string;
  whatWentBad?: string;
  weakTopics?: WeakTopic[];
  nextStep?: string;
  notes?: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  baseSalary?: number;
  bonus?: number;
  currency?: Currency;
  grossNet?: 'Gross' | 'Net';
  equity?: string;
  vacation?: string;
  remote?: WorkType;
  probation?: string;
  benefits?: string;
  offerDate?: string;
  deadline?: string;
  decision: OfferDecision;
  notes?: string;
}

export interface CvVersion {
  id: string;
  version: string;
  targetRole?: string;
  createdDate?: string;
  fileUrl?: string;
  description?: string;
}

export interface Task {
  id: string;
  applicationId?: string;
  type: TaskType;
  dueDate?: string;
  priority: Priority;
  status: TaskStatus;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Resource map (used by the generic API client / query hooks)
// ---------------------------------------------------------------------------

export type ResourceName =
  | 'applications'
  | 'companies'
  | 'contacts'
  | 'interviews'
  | 'offers'
  | 'cv-versions'
  | 'tasks';

export interface ResourceMap {
  applications: Application;
  companies: Company;
  contacts: Contact;
  interviews: Interview;
  offers: Offer;
  'cv-versions': CvVersion;
  tasks: Task;
}
