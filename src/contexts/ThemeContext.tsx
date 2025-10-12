'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('site-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    localStorage.setItem('site-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
