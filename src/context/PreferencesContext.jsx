import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICTS, LANGUAGES, translate } from '../i18n';

const Ctx = createContext(null);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

const initialTheme = () => read('deskflow_theme') || 'light';
const initialLang = () => {
  const saved = read('deskflow_lang');
  if (saved && DICTS[saved]) return saved;
  const nav = (navigator.language || 'en').slice(0, 2);

  return DICTS[nav] ? nav : 'en';
};

/** Colour theme and language: remembered per browser. */
export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setTheme = useCallback((t) => { setThemeState(t); write('deskflow_theme', t); }, []);
  const setLang = useCallback((l) => { if (DICTS[l]) { setLangState(l); write('deskflow_lang', l); } }, []);
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ theme, setTheme, lang, setLang, t, languages: LANGUAGES }), [theme, setTheme, lang, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
