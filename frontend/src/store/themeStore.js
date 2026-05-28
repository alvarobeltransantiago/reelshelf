import { create } from 'zustand'

const STORAGE_KEY = 'reelshelf-theme'

function getStoredTheme() {
  return window.localStorage.getItem(STORAGE_KEY)
}

function resolveInitialTheme() {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)

  if (storedTheme === 'theme-light' || storedTheme === 'theme-dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark'
}

const useThemeStore = create((set, get) => ({
  theme: resolveInitialTheme(),
  hasStoredPreference: Boolean(getStoredTheme()),
  applyTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    document.documentElement.classList.add(theme)
    set({ theme })
  },
  initializeTheme() {
    get().applyTheme(get().theme)
  },
  syncWithSystem() {
    if (get().hasStoredPreference) {
      return
    }

    const nextTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark'
    get().applyTheme(nextTheme)
  },
  toggleTheme() {
    const nextTheme = get().theme === 'theme-dark' ? 'theme-light' : 'theme-dark'
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    set({ hasStoredPreference: true })
    get().applyTheme(nextTheme)
  },
}))

export default useThemeStore
