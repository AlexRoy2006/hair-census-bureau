import { useState, useEffect } from "react";
import { CENSUS_MESSAGES, type Language } from "@/config/censusMessages";

export type { Language };

const STORAGE_KEY = "mudi_lang_choice";

function getInitialLanguage(): Language {
  if (typeof window !== "undefined") {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ml") {
      return saved;
    }
  }
  return "en";
}

let globalLang: Language = getInitialLanguage();
const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  return globalLang;
}

export function setLanguage(lang: Language) {
  globalLang = lang;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, lang);
  }
  listeners.forEach((listener) => listener(lang));
}

export function useLanguage(): [Language, (lang: Language) => void] {
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handleUpdate = (newLang: Language) => setLang(newLang);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return [lang, setLanguage];
}

export function getTranslation<K extends keyof (typeof CENSUS_MESSAGES)["en"]>(
  key: K,
  lang: Language = globalLang
) {
  return CENSUS_MESSAGES[lang][key] ?? CENSUS_MESSAGES["en"][key];
}
