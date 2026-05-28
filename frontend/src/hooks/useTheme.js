import useThemeStore from '../store/themeStore'

export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return {
    theme,
    toggleTheme,
    isDark: theme === 'theme-dark',
  }
}
