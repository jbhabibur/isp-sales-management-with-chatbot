"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@/lib/language";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("language");

    if (saved === "bn" || saved === "en") {
      setLanguageState(saved);
    }

    setReady(true);
  }, []);

  function setLanguage(value: Language) {
    setLanguageState(value);
    localStorage.setItem("language", value);
  }

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
