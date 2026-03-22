import React, { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import { useAuth } from './context/AuthContext'
import {
    LayoutDashboard, Building2, ClipboardList,
    BarChart3, Menu, X, Sun, Moon, Globe, Bell, ChevronRight, LogOut
} from 'lucide-react'

// Pages
import Login from './features/auth/Login'
import Dashboard from './features/dashboard/Dashboard'
import Directory from './features/directory/Directory'
import Triage from './features/triage/Triage'
import Analytics from './features/analytics/Analytics'

// Nav order: Triage → Directory → Dashboard → Analytics
const navItems = [
    { path: '/', icon: ClipboardList, labelKey: 'nav.triage' },
    { path: '/directory', icon: Building2, labelKey: 'nav.directory' },
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { path: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
]

export default function App() {
    const { isDark, toggle } = useTheme()
    const { lang, setLang, t } = useLanguage()
    const { user, isAuthenticated, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    // Gate: show login if not authenticated
    if (!isAuthenticated) return <Login />

    return (
        <div className={`min-h-screen flex ${isDark ? 'dark bg-surface-950 text-surface-100' : 'bg-surface-50 text-surface-900'}`}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isDark ? 'bg-surface-900 border-r border-surface-800' : 'bg-white border-r border-surface-200'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-200 dark:border-surface-800">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-primary-500/25">
                        T
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight">TRMS</h1>
                        <p className="text-[10px] text-surface-500 dark:text-surface-400 leading-tight">Tigray Referral System</p>
                    </div>
                    <button className="ml-auto lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => {
                        const Icon = item.icon
                        const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 shadow-sm'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/70 hover:text-surface-900 dark:hover:text-surface-200'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-primary-500' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'} />
                                <span>{t(item.labelKey)}</span>
                                {isActive && <ChevronRight size={14} className="ml-auto text-primary-400" />}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Bottom controls */}
                <div className={`px-4 py-4 border-t ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={toggle} className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-300 transition-colors" title="Toggle theme">
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            <span>{isDark ? 'Light' : 'Dark'}</span>
                        </button>
                        <button
                            onClick={() => setLang(lang === 'en' ? 'ti' : 'en')}
                            className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors px-2 py-1 rounded-lg hover:bg-surface-800/50"
                            title="Toggle language"
                        >
                            <Globe size={14} />
                            <span className="font-medium">{lang === 'en' ? 'ትግርኛ' : 'English'}</span>
                        </button>
                    </div>

                    {/* User card */}
                    <div className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? 'bg-surface-800/50' : 'bg-surface-100'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user?.name.split(' ').filter(w => !['Dr.', 'Sr.', 'Ato'].includes(w)).map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{user?.name}</p>
                            <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            title={t('common.logout')}
                            className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen flex flex-col">
                {/* Top bar */}
                <header className={`sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 h-14 border-b backdrop-blur-md ${isDark ? 'bg-surface-950/80 border-surface-800' : 'bg-white/80 border-surface-200'}`}>
                    <button className="lg:hidden p-2 rounded-lg hover:bg-surface-800/50" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="flex-1" />
                    <button className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors">
                        <Bell size={18} className="text-surface-500" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />
                    </button>
                </header>

                {/* Page content */}
                <div className="flex-1 p-4 lg:p-6">
                    <Routes>
                        <Route path="/" element={<Triage />} />
                        <Route path="/directory" element={<Directory />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                    </Routes>
                </div>
            </main>
        </div>
    )
}
