import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { settingsService, Theme, ThemeMode } from '../services/settingsService';

/** Light from 6:00 to 18:00 (local time), dark otherwise */
function getEffectiveThemeFromTime(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

interface ThemeContextType {
  /** Effective theme for styling (dark | light); when mode is 'auto', derived from time */
  theme: Theme;
  /** User preference: dark, light, or auto (time-based) */
  themeMode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.removeAttribute('data-theme');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('teamup_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved as ThemeMode;
    return 'dark';
  });
  const [timeBasedTheme, setTimeBasedTheme] = useState<Theme>(getEffectiveThemeFromTime);

  const effectiveTheme = useMemo((): Theme => {
    if (themeMode === 'auto') return timeBasedTheme;
    return themeMode;
  }, [themeMode, timeBasedTheme]);

  useEffect(() => {
    if (user?.id) {
      settingsService.getTheme(user.id).then((saved) => {
        setThemeModeState(saved);
      });
    } else {
      const saved = localStorage.getItem('teamup_theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light' || saved === 'auto') {
        setThemeModeState(saved);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (themeMode !== 'auto') return;
    const tick = () => setTimeBasedTheme(getEffectiveThemeFromTime());
    tick();
    const interval = setInterval(tick, 60 * 1000);
    return () => clearInterval(interval);
  }, [themeMode]);

  const setTheme = useCallback(
    (value: ThemeMode) => {
      setThemeModeState(value);
      if (user?.id) {
        settingsService.saveTheme(user.id, value).catch((err) =>
          console.error('Failed to save theme:', err),
        );
      } else {
        localStorage.setItem('teamup_theme', value);
      }
    },
    [user?.id],
  );

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, themeMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
