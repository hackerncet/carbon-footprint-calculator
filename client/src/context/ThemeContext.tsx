import React, { createContext, useContext, useEffect, useState } from 'react';

/** Supported theme values. */
type Theme = 'light' | 'dark';

/** Shape of the ThemeContext value. */
interface ThemeContextType {
  /** Current active theme. */
  theme: Theme;
  /** Toggles between light and dark theme. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Detects the user's preferred initial theme.
 * Priority: localStorage > OS-level `prefers-color-scheme` > 'light' fallback.
 */
function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;

  // Respect OS-level color scheme preference
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Provides theme state and toggle functionality to the component tree.
 * Persists the user's choice to localStorage and applies the `data-theme`
 * attribute on `<html>` for CSS variable switching.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to consume the current theme and toggle function.
 * @throws {Error} If used outside of a `ThemeProvider`.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
