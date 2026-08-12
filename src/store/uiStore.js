import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// language + dark mode persist. cycle: en -> am -> ar -> en
const ORDER = ['en', 'am', 'ar'];
export const useUiStore = create(
  persist(
    (set, get) => ({
      language: 'en',
      dark: false,
      setLanguage: (language) => set({ language }),
      cycleLanguage: () => {
        const next = ORDER[(ORDER.indexOf(get().language) + 1) % ORDER.length];
        set({ language: next });
        return next;
      },
      toggleDark: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: 'kitman-ui' }
  )
);
