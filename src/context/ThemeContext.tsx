import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ThemeContextType {
    isDark: boolean
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true, toggle: () => { } })

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('trms-theme')
        return saved ? saved === 'dark' : true
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark)
        localStorage.setItem('trms-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggle = () => setIsDark(prev => !prev)

    return (
        <ThemeContext.Provider value={{ isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
