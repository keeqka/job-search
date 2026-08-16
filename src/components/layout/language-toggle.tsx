import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LANGUAGES = ['en', 'ru'] as const;

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.includes(i18n.language as (typeof LANGUAGES)[number])
    ? (i18n.language as (typeof LANGUAGES)[number])
    : 'en';
  const next = current === 'en' ? 'ru' : 'en';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => i18n.changeLanguage(next)}
      aria-label={t('header.language')}
      title={t('header.language')}
      className="text-xs font-semibold uppercase"
    >
      {current}
    </Button>
  );
}
