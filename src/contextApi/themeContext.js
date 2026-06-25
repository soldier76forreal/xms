import React, { useState } from 'react';

const ThemeCtx = React.createContext({
  themeMode: 'light',
  toggleTheme: () => {},
});

export const ThemeContextProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    setThemeMode(next);
  };

  return (
    <ThemeCtx.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export default ThemeCtx;
