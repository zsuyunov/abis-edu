import { useLanguage } from '@/contexts/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return {
    t,
    language,
    setLanguage,
    // Helper function for conditional translations
    tIf: (condition: boolean, key: string, fallback?: string) => 
      condition ? t(key) : (fallback || key),
    // Helper function for pluralization (basic implementation)
    tPlural: (key: string, count: number, pluralKey?: string) => 
      count === 1 ? t(key) : t(pluralKey || `${key}_plural`),
  };
};
