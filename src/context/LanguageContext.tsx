"use client";

import { createContext, useContext, useState } from "react";

export type Lang = "en" | "ko";

const LanguageContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({ lang: "en", toggle: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LanguageContext.Provider value={{ lang, toggle: () => setLang((l) => (l === "en" ? "ko" : "en")) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
