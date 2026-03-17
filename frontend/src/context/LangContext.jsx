import { createContext, useContext, useState } from 'react';
import LANG from '../constants/translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('preferred-language') || 'en'
  );

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('preferred-language', code);
  };

  const t = LANG[lang] || LANG.en;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
