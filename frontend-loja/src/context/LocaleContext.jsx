import { createContext, useMemo, useState } from "react";

import pt from "../locales/pt.js";
import en from "../locales/en.js";
import es from "../locales/es.js";

const dictionaries = { pt, en, es };
export const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem("bigsmoke-language") || "pt");
  const value = useMemo(() => ({
    locale,
    copy: dictionaries[locale] || pt,
    setLocale(next) {
      localStorage.setItem("bigsmoke-language", next);
      setLocale(next);
    }
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
