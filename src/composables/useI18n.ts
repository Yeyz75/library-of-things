import { useI18n as useVueI18n } from 'vue-i18n';

export const useI18n = () => {
  const { t, locale, availableLocales } = useVueI18n();

  const changeLocale = (newLocale: string) => {
    if (availableLocales.includes(newLocale)) {
      locale.value = newLocale;
      // Guardar preferencia en localStorage
      localStorage.setItem('preferred-locale', newLocale);
    }
  };

  const getCurrentLocale = () => locale.value;

  return {
    t,
    locale,
    availableLocales,
    changeLocale,
    getCurrentLocale,
  };
};

export default useI18n;
