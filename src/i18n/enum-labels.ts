import { useTranslation } from 'react-i18next';

/**
 * Enum values (e.g. ApplicationStatus, Priority) are stored/filtered/sent to
 * the API as fixed English strings — they must never be translated at the
 * data layer. This maps those literal values to a display label per
 * language. Kept out of the i18next resource tree (rather than using t()
 * with a dotted key built from the value) because several values contain
 * dots themselves (e.g. "Node.js", "HH.kz"), which would collide with
 * i18next's default key-separator.
 */
const LABELS = {
  en: {
    applicationStatus: {
      Wishlist: 'Wishlist',
      Applied: 'Applied',
      'Recruiter Screen': 'Recruiter Screen',
      'HR Interview': 'HR Interview',
      'Technical Interview': 'Technical Interview',
      'Final Interview': 'Final Interview',
      Offer: 'Offer',
      Accepted: 'Accepted',
      Rejected: 'Rejected',
      Withdrawn: 'Withdrawn',
      'No Response': 'No Response',
    },
    source: {
      LinkedIn: 'LinkedIn',
      'HH.kz': 'HH.kz',
      Telegram: 'Telegram',
      'Company Website': 'Company Website',
      Referral: 'Referral',
      Indeed: 'Indeed',
      Wellfound: 'Wellfound',
      'Habr Career': 'Habr Career',
      Other: 'Other',
    },
    priority: {
      High: 'High',
      Medium: 'Medium',
      Low: 'Low',
    },
    employmentType: {
      'Full-time': 'Full-time',
      'Part-time': 'Part-time',
      Contract: 'Contract',
      Freelance: 'Freelance',
      Other: 'Other',
    },
    workType: {
      Remote: 'Remote',
      Hybrid: 'Hybrid',
      Office: 'Office',
      Other: 'Other',
    },
    currency: {
      USD: 'USD',
      EUR: 'EUR',
      KZT: 'KZT',
      Other: 'Other',
    },
    industry: {
      FinTech: 'FinTech',
      Crypto: 'Crypto',
      SaaS: 'SaaS',
      'E-commerce': 'E-commerce',
      Banking: 'Banking',
      AI: 'AI',
      Consulting: 'Consulting',
      Gaming: 'Gaming',
      Other: 'Other',
    },
    companySize: {
      '1-10': '1-10',
      '11-50': '11-50',
      '51-200': '51-200',
      '201-500': '201-500',
      '501-1000': '501-1000',
      '1000+': '1000+',
      Unknown: 'Unknown',
    },
    contactRole: {
      Recruiter: 'Recruiter',
      HR: 'HR',
      'Hiring Manager': 'Hiring Manager',
      'Engineering Manager': 'Engineering Manager',
      'Tech Lead': 'Tech Lead',
      Employee: 'Employee',
      Agency: 'Agency',
      Other: 'Other',
    },
    interviewType: {
      HR: 'HR',
      Recruiter: 'Recruiter',
      Technical: 'Technical',
      'System Design': 'System Design',
      'Live Coding': 'Live Coding',
      'Pair Programming': 'Pair Programming',
      Manager: 'Manager',
      Final: 'Final',
      Other: 'Other',
    },
    interviewResult: {
      Scheduled: 'Scheduled',
      Passed: 'Passed',
      Failed: 'Failed',
      Waiting: 'Waiting',
      Cancelled: 'Cancelled',
    },
    offerDecision: {
      Pending: 'Pending',
      Accepted: 'Accepted',
      Rejected: 'Rejected',
      Negotiating: 'Negotiating',
      Expired: 'Expired',
    },
    taskType: {
      Apply: 'Apply',
      'Follow Up': 'Follow Up',
      'Prepare Interview': 'Prepare Interview',
      'Send CV': 'Send CV',
      'Contact Recruiter': 'Contact Recruiter',
      'Research Company': 'Research Company',
      'Prepare Coding': 'Prepare Coding',
      'Prepare System Design': 'Prepare System Design',
      Other: 'Other',
    },
    taskStatus: {
      Todo: 'Todo',
      'In Progress': 'In Progress',
      Done: 'Done',
      Cancelled: 'Cancelled',
    },
    grossNet: {
      Gross: 'Gross',
      Net: 'Net',
    },
  },
  ru: {
    applicationStatus: {
      Wishlist: 'Список желаемого',
      Applied: 'Отклик отправлен',
      'Recruiter Screen': 'Скрининг рекрутера',
      'HR Interview': 'HR-интервью',
      'Technical Interview': 'Техническое интервью',
      'Final Interview': 'Финальное интервью',
      Offer: 'Оффер',
      Accepted: 'Принят',
      Rejected: 'Отказ',
      Withdrawn: 'Отозван',
      'No Response': 'Без ответа',
    },
    source: {
      LinkedIn: 'LinkedIn',
      'HH.kz': 'HH.kz',
      Telegram: 'Telegram',
      'Company Website': 'Сайт компании',
      Referral: 'Рекомендация',
      Indeed: 'Indeed',
      Wellfound: 'Wellfound',
      'Habr Career': 'Habr Career',
      Other: 'Другое',
    },
    priority: {
      High: 'Высокий',
      Medium: 'Средний',
      Low: 'Низкий',
    },
    employmentType: {
      'Full-time': 'Полная занятость',
      'Part-time': 'Частичная занятость',
      Contract: 'Контракт',
      Freelance: 'Фриланс',
      Other: 'Другое',
    },
    workType: {
      Remote: 'Удалённо',
      Hybrid: 'Гибрид',
      Office: 'Офис',
      Other: 'Другое',
    },
    currency: {
      USD: 'USD',
      EUR: 'EUR',
      KZT: 'KZT',
      Other: 'Другое',
    },
    industry: {
      FinTech: 'Финтех',
      Crypto: 'Крипто',
      SaaS: 'SaaS',
      'E-commerce': 'Электронная коммерция',
      Banking: 'Банкинг',
      AI: 'ИИ',
      Consulting: 'Консалтинг',
      Gaming: 'Гейминг',
      Other: 'Другое',
    },
    companySize: {
      '1-10': '1-10',
      '11-50': '11-50',
      '51-200': '51-200',
      '201-500': '201-500',
      '501-1000': '501-1000',
      '1000+': '1000+',
      Unknown: 'Неизвестно',
    },
    contactRole: {
      Recruiter: 'Рекрутер',
      HR: 'HR',
      'Hiring Manager': 'Нанимающий менеджер',
      'Engineering Manager': 'Инженерный менеджер',
      'Tech Lead': 'Тех. лид',
      Employee: 'Сотрудник',
      Agency: 'Агентство',
      Other: 'Другое',
    },
    interviewType: {
      HR: 'HR',
      Recruiter: 'Рекрутер',
      Technical: 'Техническое',
      'System Design': 'Системный дизайн',
      'Live Coding': 'Лайв-кодинг',
      'Pair Programming': 'Парное программирование',
      Manager: 'С менеджером',
      Final: 'Финальное',
      Other: 'Другое',
    },
    interviewResult: {
      Scheduled: 'Запланировано',
      Passed: 'Пройдено',
      Failed: 'Провалено',
      Waiting: 'Ожидание',
      Cancelled: 'Отменено',
    },
    offerDecision: {
      Pending: 'На рассмотрении',
      Accepted: 'Принят',
      Rejected: 'Отклонён',
      Negotiating: 'Переговоры',
      Expired: 'Истёк',
    },
    taskType: {
      Apply: 'Откликнуться',
      'Follow Up': 'Уточнить статус',
      'Prepare Interview': 'Подготовиться к интервью',
      'Send CV': 'Отправить резюме',
      'Contact Recruiter': 'Связаться с рекрутером',
      'Research Company': 'Изучить компанию',
      'Prepare Coding': 'Подготовиться к кодингу',
      'Prepare System Design': 'Подготовиться к системному дизайну',
      Other: 'Другое',
    },
    taskStatus: {
      Todo: 'К выполнению',
      'In Progress': 'В процессе',
      Done: 'Готово',
      Cancelled: 'Отменено',
    },
    grossNet: {
      Gross: 'Гросс',
      Net: 'На руки',
    },
  },
} as const;

export type EnumCategory = keyof (typeof LABELS)['en'];

export function useEnumLabel() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  return function enumLabel(category: EnumCategory, value?: string | null): string {
    if (!value) return '';
    const table = LABELS[lang][category] as Record<string, string>;
    return table[value] ?? value;
  };
}
