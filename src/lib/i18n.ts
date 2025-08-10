import { createI18n } from 'vue-i18n';
import en from '@/locale/en.json';
import es from '@/locale/es.json';

// Detectar idioma del navegador o usar español por defecto
const getDefaultLocale = (): string => {
  // Primero verificar si hay una preferencia guardada
  const savedLocale = localStorage.getItem('preferred-locale');
  if (savedLocale && ['en', 'es'].includes(savedLocale)) {
    return savedLocale;
  }

  // Si no, usar el idioma del navegador
  const browserLang = navigator.language.split('-')[0];
  const supportedLocales = ['en', 'es'];
  return supportedLocales.includes(browserLang) ? browserLang : 'es';
};

// Configuración de i18n
export const i18n = createI18n({
  legacy: false, // Usar Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    es,
  },
});

export default i18n;
