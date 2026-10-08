import { Moon, Sun } from 'lucide-react';
import { usePrefs } from '../../context/PreferencesContext';

/** Light / dark switch. `onDark` styles it for the dark top bar. */
export function ThemeToggle({ onDark = false }) {
  const { theme, setTheme, t } = usePrefs();
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('common.theme')} title={t('common.theme')}
      className={`p-1.5 rounded-lg ${onDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}><Icon className="w-4 h-4" aria-hidden="true" /></button>
  );
}

export function LanguageSelect({ onDark = false }) {
  const { lang, setLang, languages, t } = usePrefs();
  return (
    <select aria-label={t('common.language')} value={lang} onChange={(e) => setLang(e.target.value)}
      className={`rounded-lg text-xs font-semibold py-1 pl-2 pr-1 border ${onDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-300'}`}>
      {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
  );
}
