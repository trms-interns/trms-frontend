import React, { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import type { UserRole } from "./data/mockData";
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
  IconSend,
  IconList,
  IconStethoscope,
  IconUsers,
  IconServer,
  IconShield,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";

// Pages
import Login from "./features/auth/Login";
import FirstLoginPasswordReset from "./features/auth/FirstLoginPasswordReset";
import Dashboard from "./features/dashboard/Dashboard";
import Directory from "./features/directory/Directory";
import Triage from "./features/triage/Triage";
import Analytics from "./features/analytics/Analytics";
import CreateReferral from "./features/referrals/CreateReferral";
import MyReferrals from "./features/referrals/MyReferrals";
import DoctorDashboard from "./features/doctor/DoctorDashboard";
import DeptHeadDashboard from "./features/dept-head/DeptHeadDashboard";
import FacilityAdminDashboard from "./features/facility-admin/FacilityAdminDashboard";
import SysAdminDashboard from "./features/sys-admin/SysAdminDashboard";
import Profile from "./features/profile/Profile";
import { getUserInitials, trmsApi, type Notification } from "./lib/trmsApi";
import Modal from "./components/Modal";

// ─── Role-based navigation definitions ──────────────────────────────────────

interface NavItem {
  path: string;
  icon: typeof IconLayoutDashboard;
  labelKey: string;
}

const roleNavMap: Record<UserRole, NavItem[]> = {
  "Liaison Officer": [
    { path: "/", icon: IconClipboardList, labelKey: "nav.triage" },
    { path: "/referrals/new", icon: IconSend, labelKey: "nav.sendReferral" },
    { path: "/referrals/my", icon: IconList, labelKey: "nav.myReferrals" },
    { path: "/directory", icon: IconBuilding, labelKey: "nav.directory" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
    { path: "/analytics", icon: IconChartBar, labelKey: "nav.analytics" },
  ],
  Doctor: [
    { path: "/", icon: IconStethoscope, labelKey: "nav.patientQueue" },
    { path: "/referrals/new", icon: IconSend, labelKey: "nav.sendReferral" },
    { path: "/referrals/my", icon: IconList, labelKey: "nav.myReferrals" },
    { path: "/directory", icon: IconBuilding, labelKey: "nav.directory" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  ],
  "Department Head": [
    { path: "/", icon: IconUsers, labelKey: "nav.userManagement" },
    { path: "/referrals/my", icon: IconList, labelKey: "nav.referralOverview" },
    { path: "/directory", icon: IconBuilding, labelKey: "nav.directory" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  ],
  "Facility Administrator": [
    { path: "/", icon: IconSettings, labelKey: "nav.departments" },
    { path: "/directory", icon: IconBuilding, labelKey: "nav.serviceStatus" },
    { path: "/analytics", icon: IconChartBar, labelKey: "nav.reports" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  ],
  "System Administrator": [
    { path: "/", icon: IconServer, labelKey: "nav.facilityManagement" },
    { path: "/analytics", icon: IconChartBar, labelKey: "nav.reports" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  ],
  HEW: [
    { path: "/referrals/new", icon: IconSend, labelKey: "nav.sendReferral" },
    { path: "/referrals/my", icon: IconList, labelKey: "nav.myReferrals" },
    { path: "/directory", icon: IconBuilding, labelKey: "nav.directory" },
    { path: "/dashboard", icon: IconLayoutDashboard, labelKey: "nav.dashboard" },
  ],
};

// ─── Role-based home page component ─────────────────────────────────────────

function RoleHomePage({ role }: { role: UserRole }) {
  switch (role) {
    case "Liaison Officer":
      return <Triage />;
    case "Doctor":
      return <DoctorDashboard />;
    case "Department Head":
      return <DeptHeadDashboard />;
    case "Facility Administrator":
      return <FacilityAdminDashboard />;
    case "System Administrator":
      return <SysAdminDashboard />;
    case "HEW":
      return <CreateReferral />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const { isDark, toggle } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const initializedNotificationsRef = useRef(false);
  const latestNotificationIdRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const playNotificationSound = () => {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
      window.setTimeout(() => {
        void ctx.close();
      }, 350);
    } catch {
      // Ignore playback errors caused by browser policies.
    }
  };

  const loadNotifications = async (showLoader = true) => {
    try {
      if (showLoader) setNotificationsLoading(true);
      setNotificationsError("");
      const data = await trmsApi.getNotifications();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setNotifications(sorted);
    } catch (error: any) {
      setNotificationsError(
        error?.message || "Failed to load notifications.",
      );
    } finally {
      if (showLoader) setNotificationsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await trmsApi.markNotificationAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error: any) {
      setNotificationsError(
        error?.message || "Failed to mark notification as read.",
      );
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }

    const targetReferralId = item.targetId?.trim();
    if (targetReferralId) {
      navigate(`/referrals/my/${targetReferralId}`);
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.isRead)
      .map((item) => item.id);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(unreadIds.map((id) => trmsApi.markNotificationAsRead(id)));
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (error: any) {
      setNotificationsError(
        error?.message || "Failed to mark all notifications as read.",
      );
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      initializedNotificationsRef.current = false;
      latestNotificationIdRef.current = null;
      return;
    }

    if (notifications.length === 0) return;
    const currentLatestId = notifications[0]?.id || null;
    const previousLatestId = latestNotificationIdRef.current;

    if (!initializedNotificationsRef.current) {
      initializedNotificationsRef.current = true;
      latestNotificationIdRef.current = currentLatestId;
      return;
    }

    if (
      currentLatestId &&
      previousLatestId &&
      currentLatestId !== previousLatestId &&
      notifications.some((item) => !item.isRead)
    ) {
      playNotificationSound();
    }

    latestNotificationIdRef.current = currentLatestId;
  }, [isAuthenticated, notifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationsError("");
      setNotificationsLoading(false);
      return;
    }

    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications(false);
    }, 10000);

    const handleFocus = () => {
      void loadNotifications(false);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [notificationsOpen]);

  // Gate: show login if not authenticated
  if (!isAuthenticated) return <Login />;
  if (user?.mustChangePassword) return <FirstLoginPasswordReset />;

  const userRole = (user?.role || "Liaison Officer") as UserRole;
  const navItems = roleNavMap[userRole] || roleNavMap["Liaison Officer"];
  const allowedRolePaths = new Set(navItems.map((item) => item.path));
  const canAccessPath = (path: string) =>
    path === "/" || path === "/profile" || allowedRolePaths.has(path);
  const resolveBackendAssetUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;

    const base = import.meta.env.VITE_API_BASE_URL;
    if (typeof base === "string" && base.startsWith("http")) {
      try {
        return new URL(value, base).toString();
      } catch {
        return value;
      }
    }
    return value;
  };

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

        {/* Role badge */}
        {!sidebarCollapsed && (
          <div className={`px-4 py-2 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{userRole}</p>
          </div>
        )}

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

          {/* Profile link — visible to all */}
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${sidebarCollapsed ? "justify-center px-2" : ""} ${
              location.pathname === "/profile"
                ? "bg-primary-500/10 text-primary-600 shadow-sm dark:bg-[#2b4968]/25 dark:text-[#2b4968]"
                : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/70 hover:text-surface-900 dark:hover:text-surface-200"
            }`}
          >
            <IconUser
              size={25}
              className={`shrink-0 ${
                location.pathname === "/profile"
                  ? "text-primary-600 dark:text-[#2b4968]"
                  : "text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300"
              }`}
            />
            {!sidebarCollapsed && <span className="whitespace-nowrap">{t("nav.profile")}</span>}
          </NavLink>
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
            {user?.profileImageUrl ? (
              <img
                src={resolveBackendAssetUrl(user.profileImageUrl)}
                alt={`${user?.name || "User"} avatar`}
                className="w-8 h-8 rounded-full object-cover border border-surface-300 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name ? getUserInitials(user.name) : "TR"}
              </div>
            )}
            <div
              className={`flex-1 min-w-0 whitespace-nowrap ${sidebarCollapsed ? "hidden" : ""}`}
            >
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate">
                {user?.role}
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
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
          <div className="relative" ref={notificationPanelRef}>
            <button
              onClick={() => {
                const nextOpen = !notificationsOpen;
                setNotificationsOpen(nextOpen);
                if (nextOpen) void loadNotifications();
              }}
              className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
              title="Notifications"
            >
              <IconBell size={18} className="text-surface-500" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className={`absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-hidden z-50 ${isDark ? "bg-surface-900 border-surface-700" : "bg-white border-surface-200"}`}
              >
                <div
                  className={`px-3 py-2.5 border-b flex items-center justify-between ${isDark ? "border-surface-700" : "border-surface-200"}`}
                >
                  <p className="text-sm font-semibold">Notifications</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void loadNotifications()}
                      className={`text-[11px] font-medium ${isDark ? "text-surface-300 hover:text-surface-100" : "text-surface-600 hover:text-surface-900"}`}
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => void handleMarkAllAsRead()}
                      className={`text-[11px] font-medium ${isDark ? "text-primary-300 hover:text-primary-200" : "text-primary-700 hover:text-primary-800"}`}
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                {notificationsLoading ? (
                  <p className="px-3 py-6 text-xs text-surface-500">
                    Loading notifications...
                  </p>
                ) : notificationsError ? (
                  <p className="px-3 py-6 text-xs text-red-500">
                    {notificationsError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="px-3 py-6 text-xs text-surface-500">
                    No notifications yet.
                  </p>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`px-3 py-2.5 border-b last:border-b-0 ${isDark ? "border-surface-800" : "border-surface-100"} ${item.isRead ? "" : isDark ? "bg-primary-500/5" : "bg-primary-50/60"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => void handleNotificationClick(item)}
                            className="min-w-0 text-left"
                          >
                            <p className="text-xs font-medium break-words">
                              {item.message}
                            </p>
                            <p className="mt-1 text-[11px] text-surface-500">
                              {new Date(item.createdAt).toLocaleString()}
                              {item.type ? ` · ${item.type}` : ""}
                            </p>
                            {item.targetId && (
                              <p className="mt-1 text-[11px] text-primary-500">
                                Open referral details
                              </p>
                            )}
                          </button>
                          {!item.isRead && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleMarkAsRead(item.id);
                              }}
                              className={`shrink-0 text-[11px] font-medium ${isDark ? "text-primary-300 hover:text-primary-200" : "text-primary-700 hover:text-primary-800"}`}
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6">
          <Routes>
            {/* Home — role-dependent */}
            <Route path="/" element={<RoleHomePage role={userRole} />} />

            {/* Shared routes */}
            <Route
              path="/dashboard"
              element={canAccessPath("/dashboard") ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/directory"
              element={canAccessPath("/directory") ? <Directory /> : <Navigate to="/" replace />}
            />
            <Route
              path="/analytics"
              element={canAccessPath("/analytics") ? <Analytics /> : <Navigate to="/" replace />}
            />
            <Route path="/profile" element={<Profile />} />

            {/* Referral routes */}
            <Route
              path="/referrals/new"
              element={canAccessPath("/referrals/new") ? <CreateReferral /> : <Navigate to="/" replace />}
            />
            <Route
              path="/referrals/my"
              element={canAccessPath("/referrals/my") ? <MyReferrals /> : <Navigate to="/" replace />}
            />
            <Route
              path="/referrals/my/:referralId"
              element={canAccessPath("/referrals/my") ? <MyReferrals /> : <Navigate to="/" replace />}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {showLogoutConfirm && (
        <Modal
          title="Confirm Sign Out"
          onClose={() => setShowLogoutConfirm(false)}
          maxWidth="max-w-md"
          position="center"
        >
          <div className="space-y-4">
            <p className={`text-sm ${isDark ? "text-surface-300" : "text-surface-700"}`}>
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                {t("common.logout")}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? "border-surface-600 text-surface-300" : "border-surface-300"}`}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
