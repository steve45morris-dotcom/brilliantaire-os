'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

const THEMES = [
  { id: 'light', name: 'Light Mode', icon: 'Sun' },
  { id: 'dark', name: 'Dark Mode', icon: 'Moon' },
  { id: 'custom-brand', name: 'Cyber Brand', icon: 'Zap' },
];

export const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark' || currentTheme === 'custom-brand') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', themeId);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle border border-border-subtle hover:border-border-active flex items-center justify-center">
        <Icon
          name={THEMES.find((t) => t.id === currentTheme)?.icon || 'Moon'}
          size={18}
        />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow-2xl bg-base-100/90 backdrop-blur-md border border-border-subtle rounded-box w-52 z-[100] mt-1"
      >
        <li className="menu-title text-[9px] uppercase tracking-wider text-base-content/40 px-3 py-1">Select Theme</li>
        {THEMES.map((theme) => (
          <li key={theme.id}>
            <button
              onClick={() => handleThemeChange(theme.id)}
              className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-all ${
                currentTheme === theme.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-base-content/5 text-base-content/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name={theme.icon} size={14} />
                {theme.name}
              </span>
              {currentTheme === theme.id && <Icon name="Check" size={12} className="text-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
