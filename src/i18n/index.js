import en from './en';
import hi from './hi';
import es from './es';

export const DICTS = { en, hi, es };
export const LANGUAGES = [['en', 'English'], ['hi', 'हिन्दी'], ['es', 'Español']];

/** t('nav.tickets'): falls back to English, then to the key itself. {name} placeholders are filled from vars. */
export function translate(lang, key, vars = {}) {
  const raw = DICTS[lang]?.[key] ?? en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
