"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => setLanguage("bn")}
        className={
          language === "bn" ? "font-bold text-primary" : "text-foreground"
        }
      >
        বাংলা
      </button>

      <span className="text-muted-foreground">|</span>

      <button
        onClick={() => setLanguage("en")}
        className={
          language === "en" ? "font-bold text-primary" : "text-foreground"
        }
      >
        English
      </button>
    </div>
  );
}
