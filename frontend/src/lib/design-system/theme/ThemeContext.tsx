'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';

import { lightTheme, darkTheme } from '../tokens';
import { ColorMode, DesignTokens, ThemeContextType } from '../types/tokens';

// Create theme context with default values
const ThemeContext = createContext<ThemeContextType>({
  colorMode: 'light',
  setColorMode: () => {},
  toggleColorMode: () => {},
  tokens: lightTheme,
});

interface ThemeProviderProps {
  children: ReactNode;
  defaultColorMode?: ColorMode;
}

/**
 * Theme provider component that manages color mode and provides access to design tokens
 */
export function ThemeProvider({ 
  children, 
  defaultColorMode = 'light' 
}: ThemeProviderProps) {
  // Initialize color mode from local storage or system preference if available
  const [colorMode, setColorMode] = useState<ColorMode>(defaultColorMode);
  const [tokens, setTokens] = useState<DesignTokens>(
    defaultColorMode === 'dark' ? darkTheme : lightTheme
  );

  // Update tokens when color mode changes
  useEffect(() => {
    setTokens(colorMode === 'dark' ? darkTheme : lightTheme);
    
    // Update document attributes for CSS variables
    document.documentElement.setAttribute('data-theme', colorMode);
    
    // Save preference to local storage
    localStorage.setItem('fluxori-color-mode', colorMode);
  }, [colorMode]);

  // Initialize from system preference or local storage
  useEffect(() => {
    // Check for saved preference
    const savedMode = localStorage.getItem('fluxori-color-mode') as ColorMode | null;
    
    if (savedMode) {
      setColorMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Use system preference if no saved preference
      setColorMode('dark');
    }
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply if user hasn't set a preference
      if (!localStorage.getItem('fluxori-color-mode')) {
        setColorMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setColorMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        setColorMode,
        toggleColorMode,
        tokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}