import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getProfile, updateProfile } from '../lib/supabase';
import { useAuth } from './useAuth';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('currency') || 'INR';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save currency to localStorage
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // Load user preferences from Supabase
  useEffect(() => {
    if (user) {
      getProfile(user.id).then(profile => {
        if (profile) {
          if (profile.theme) setThemeState(profile.theme);
          if (profile.currency) setCurrencyState(profile.currency);
        }
      }).catch(console.error);
    }
  }, [user]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    if (user) {
      try {
        await updateProfile(user.id, { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  const setCurrency = async (newCurrency) => {
    setCurrencyState(newCurrency);
    if (user) {
      try {
        await updateProfile(user.id, { currency: newCurrency });
      } catch (error) {
        console.error('Failed to save currency:', error);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(() => ({
    theme,
    currency,
    setTheme,
    setCurrency,
    toggleTheme,
    isDark: theme === 'dark'
  }), [theme, currency]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
