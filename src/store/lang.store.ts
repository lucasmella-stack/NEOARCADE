import type { Lang } from "@/lib/i18n";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "es",
      setLang: (lang) => set({ lang }),
    }),
    { name: "neoarcade-lang" },
  ),
);
