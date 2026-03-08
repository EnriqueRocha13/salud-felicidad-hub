import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { translations, Lang } from "./translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectLanguage(): Lang {
  const nav = navigator.language || (navigator as any).userLanguage || "es";
  return nav.startsWith("en") ? "en" : "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("app-lang") as Lang | null;
    return stored || detectLanguage();
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("app-lang", l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[lang][key] || key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
