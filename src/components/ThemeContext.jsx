import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const ThemeContext = createContext();

const defaultTheme = {
  colors: {
    primary: '#C9A96E',
    secondary: '#8B7355',
    background: '#FFFFFF',
    dark: '#0A0A0A',
    success: '#2D5F3F',
    warning: '#D4AF37',
    error: '#8B0000',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  borderRadius: 8,
  spacing: 'normal', // compact, normal, spacious
};

const presetThemes = {
  classicLuxury: {
    colors: {
      primary: '#C9A96E',
      secondary: '#8B7355',
      background: '#FFFFFF',
      dark: '#0A0A0A',
      success: '#2D5F3F',
      warning: '#D4AF37',
      error: '#8B0000',
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
    borderRadius: 8,
    spacing: 'normal',
  },
  modernMinimal: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      dark: '#000000',
      success: '#00A36C',
      warning: '#FFB800',
      error: '#FF3B30',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    borderRadius: 4,
    spacing: 'compact',
  },
  darkMode: {
    colors: {
      primary: '#C9A96E',
      secondary: '#B8A078',
      background: '#0A0A0A',
      dark: '#FFFFFF',
      success: '#4ADE80',
      warning: '#FACC15',
      error: '#EF4444',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    borderRadius: 12,
    spacing: 'spacious',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [designTheme, setDesignTheme] = useState(defaultTheme);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedDesign = localStorage.getItem('designTheme');
    setTheme(savedTheme);
    if (savedDesign) {
      try {
        setDesignTheme(JSON.parse(savedDesign));
      } catch (e) {
        setDesignTheme(defaultTheme);
      }
    }
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Apply CSS variables whenever designTheme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = designTheme.colors;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-dark', colors.dark);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--border-radius', `${designTheme.borderRadius}px`);
    root.style.setProperty('--font-heading', designTheme.fonts.heading);
    root.style.setProperty('--font-body', designTheme.fonts.body);
    
    // Spacing scale
    const spacingScale = {
      compact: { section: '40px', card: '12px', grid: '16px' },
      normal: { section: '60px', card: '16px', grid: '24px' },
      spacious: { section: '80px', card: '24px', grid: '32px' },
    };
    const sp = spacingScale[designTheme.spacing] || spacingScale.normal;
    root.style.setProperty('--spacing-section', sp.section);
    root.style.setProperty('--spacing-card', sp.card);
    root.style.setProperty('--spacing-grid', sp.grid);
  }, [designTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateDesignTheme = (newDesign) => {
    setDesignTheme(newDesign);
    localStorage.setItem('designTheme', JSON.stringify(newDesign));
  };

  const applyPreset = (presetName) => {
    if (presetThemes[presetName]) {
      updateDesignTheme(presetThemes[presetName]);
    }
  };

  const resetDesignTheme = () => {
    updateDesignTheme(defaultTheme);
  };

  const exportTheme = () => {
    return JSON.stringify(designTheme, null, 2);
  };

  const importTheme = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      updateDesignTheme(imported);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      designTheme,
      updateDesignTheme,
      applyPreset,
      resetDesignTheme,
      exportTheme,
      importTheme,
      presetThemes,
      defaultTheme,
    }}>
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