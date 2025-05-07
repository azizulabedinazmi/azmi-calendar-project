"use client"

import type { Language } from "@/lib/i18n"
import { useEffect, useState } from "react"

export function useLanguage(): [Language, (lang: Language) => void] {
  const [language, setLanguageState] = useState<Language>("en") // Default to English

  useEffect(() => {
    const storedLanguage = localStorage.getItem("preferred-language")
    if (storedLanguage === "en" || storedLanguage === "zh") {
      setLanguageState(storedLanguage)
    } else {
      setLanguageState("en") // Default to English
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("preferred-language", lang)
  }

  return [language, setLanguage]
}

