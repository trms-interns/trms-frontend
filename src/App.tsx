import React, { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import {
  IconLayoutDashboard,
  IconBuilding,
  IconClipboardList,
  IconChartBar,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
  IconWorld,
  IconBell,
  IconChevronRight,
  IconLogout,
} from "@tabler/icons-react";

// Pages
import Login from "./features/auth/Login";
import Dashboard from "./features/dashboard/Dashboard";
import Directory from "./features/directory/Directory";
import Triage from "./features/triage/Triage";
import Analytics from "./features/analytics/Analytics";

// Nav order: Triage → Directory → Dashboard → Analytics
const navItems = [
  { path: "/", icon: IconClipboardList, labelKey: "nav.triage" },
  { path: "/directory", icon: IconBuilding, labelKey: "nav.directory" },
  { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  { path: "/analytics", icon: IconChartBar, labelKey: "nav.analytics" },
];

export default function App() {
  const { isDark, toggle } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Gate: show login if not authenticated
  if (!isAuthenticated) return <Login />;

  return (
    <div
      className={`min-h-screen flex ${isDark ? "dark bg-surface-950 text-surface-100" : "bg-surface-50 text-surface-900"}`}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col overflow-hidden transition-[width,transform] duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${sidebarCollapsed ? "w-26.25" : "w-65"} ${isDark ? "bg-surface-900 border-r border-surface-800" : "bg-white border-r border-surface-200"}`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 border-b border-surface-200 dark:border-surface-800 h-16 ${sidebarCollapsed ? "px-3" : "px-3"}`}
        >
          <div className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-primary-500/25 shrink-0">
            T
          </div>
          <div
            className={`flex-1 whitespace-nowrap ${sidebarCollapsed ? "hidden" : ""}`}
          >
            <h1 className="text-base font-bold tracking-tight">TRMS</h1>
          </div>
          <div
            className={`ml-auto flex items-center ${sidebarCollapsed ? "gap-0" : "gap-1"}`}
          >
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className={`${sidebarCollapsed ? "p-1.5" : "p-2"} rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-colors`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <IconMenu2 size={25} />
            </button>
            <button
              className={`lg:hidden ${sidebarCollapsed ? "p-1" : "p-1"}`}
              onClick={() => setSidebarOpen(false)}
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav
          className={`flex-1 py-4 px-3 space-y-1 overflow-y-auto ${sidebarCollapsed ? "px-2" : ""}`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${sidebarCollapsed ? "justify-center px-2" : ""} ${
                  isActive
                    ? "bg-primary-500/10 text-primary-600 shadow-sm dark:bg-[#2b4968]/25 dark:text-[#2b4968]"
                    : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/70 hover:text-surface-900 dark:hover:text-surface-200"
                }`}
              >
                <Icon
                  size={25}
                  className={`shrink-0 ${
                    isActive
                      ? "text-primary-600 dark:text-[#2b4968]"
                      : "text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300"
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                )}
                {!sidebarCollapsed && isActive && (
                  <IconChevronRight
                    size={14}
                    className="ml-auto text-primary-400 dark:text-[#2b4968]"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div
          className={`px-4 py-4 border-t ${isDark ? "border-surface-800" : "border-surface-200"}`}
        >
          <div
            className={`flex items-center mb-3 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            <button
              onClick={toggle}
              className={`flex items-center gap-2 text-xs text-surface-500 hover:text-surface-300 transition-colors px-2 py-1 rounded-lg hover:bg-surface-800/50 cursor-pointer ${sidebarCollapsed ? "hidden" : ""}`}
              title="Toggle theme"
            >
              {isDark ? <IconSun size={25} /> : <IconMoon size={25} />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "ti" : "en")}
              className={`flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors px-2 py-1 rounded-lg hover:bg-surface-800/50 cursor-pointer ${sidebarCollapsed ? "hidden" : ""}`}
              title="Toggle language"
            >
              <IconWorld size={25} />
              <span className="font-medium">
                {lang === "en" ? "ትግርኛ" : "English"}
              </span>
            </button>
          </div>

          {/* User card */}
          <div
            className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? "bg-surface-800/50" : "bg-surface-100"} ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name
                .split(" ")
                .filter((w) => !["Dr.", "Sr.", "Ato"].includes(w))
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div
              className={`flex-1 min-w-0 whitespace-nowrap ${sidebarCollapsed ? "hidden" : ""}`}
            >
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate">
                {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              title={t("common.logout")}
              className={`p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${sidebarCollapsed ? "hidden" : ""}`}
            >
              <IconLogout size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top bar */}
        <header
          className={`sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 h-14 border-b backdrop-blur-md ${isDark ? "bg-surface-950/80 border-surface-800" : "bg-white/80 border-surface-200"}`}
        >
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-surface-800/50"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu2 size={20} />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors">
            <IconBell size={18} className="text-surface-500" />
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
  );
}
