import React from "react";
import { Link } from "react-router-dom"; // used by quickActions
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useReferrals } from "../../context/ReferralContext";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import DashboardMiniChart from "../../components/DashboardMiniChart";
import {
  IconFileText,
  IconClock,
  IconClipboardList,
  IconCircleCheck,
  IconBuilding,
  IconChartBar,
  IconRefresh,
} from "@tabler/icons-react";

export default function Dashboard() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { referrals, loading, syncNow, isSyncing, lastSyncedAt, syncError } =
    useReferrals();

  // Get recent referrals
  const recentRefs = referrals.slice(0, 5);

  // Calculate stats from real referral data
  const totalReferrals = referrals.length;
  const pendingSync = referrals.filter((r) =>
    ["draft", "pending_sending"].includes(r.status),
  ).length;
  const activeTriage = referrals.filter(r => r.status === 'pending_receiving').length;
  const completedToday = referrals.filter(r => r.status === 'completed').length;

  const quickActions = [
    {
      icon: IconClipboardList,
      label: t("nav.triage"),
      to: "/",
      color: "from-red-500 to-red-600",
    },
    {
      icon: IconBuilding,
      label: t("nav.directory"),
      to: "/directory",
      color: "from-accent-500 to-accent-600",
    },
    {
      icon: IconChartBar,
      label: t("nav.analytics"),
      to: "/analytics",
      color: "from-purple-500 to-purple-700",
    },
  ];

  const statusChartData = [
    { label: "Pending", value: referrals.filter((r) => r.status === "pending_receiving").length, colorClass: "bg-amber-500" },
    { label: "Accepted", value: referrals.filter((r) => r.status === "accepted").length, colorClass: "bg-emerald-500" },
    { label: "Rejected", value: referrals.filter((r) => r.status === "rejected").length, colorClass: "bg-red-500" },
    { label: "Completed", value: referrals.filter((r) => r.status === "completed").length, colorClass: "bg-primary-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">{t("dash.title")}</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<IconFileText size={20} />}
          label={t("dash.totalReferrals")}
          value={totalReferrals}
          color="from-primary-500 to-primary-700"
        />
        <StatCard
          icon={<IconClock size={20} />}
          label={t("dash.pendingSync")}
          value={pendingSync}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          icon={<IconClipboardList size={20} />}
          label={t("dash.activeTriage")}
          value={activeTriage}
          color="from-red-500 to-red-600"
        />
        <StatCard
          icon={<IconCircleCheck size={20} />}
          label={t("dash.completedToday")}
          value={completedToday}
          color="from-accent-500 to-accent-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div
          className={`rounded-2xl p-5 border ${isDark ? "bg-surface-800/60 border-surface-700/50" : "bg-white border-surface-200"}`}
        >
          <h3 className="text-sm font-semibold mb-4">
            {t("dash.quickActions")}
          </h3>
          <div className="space-y-3">
            {quickActions.map((qa) => (
              <Link
                key={qa.to}
                to={qa.to}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isDark ? "bg-surface-850 hover:bg-surface-700/60" : "bg-surface-50 hover:bg-surface-100"}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${qa.color} flex items-center justify-center text-white`}
                >
                  <qa.icon size={16} />
                </div>
                <span className="text-sm font-medium">{qa.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sync status */}
        <div
          className={`rounded-2xl p-5 border ${isDark ? "bg-surface-800/60 border-surface-700/50" : "bg-white border-surface-200"}`}
        >
          <h3 className="text-sm font-semibold mb-3">Sync Status</h3>
          <p className="text-xs text-surface-500">
            {lastSyncedAt
              ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
              : "Last synced: never"}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            Pending local changes: {pendingSync}
          </p>
          {syncError && <p className="text-xs text-red-500 mt-2">{syncError}</p>}
          <button
            onClick={() => void syncNow()}
            disabled={isSyncing}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 disabled:opacity-60 transition-colors"
          >
            <IconRefresh size={14} />
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <DashboardMiniChart title="Referral Status Overview" data={statusChartData} />

      <div
        className={`rounded-2xl p-5 border ${isDark ? "bg-surface-800/60 border-surface-700/50" : "bg-white border-surface-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{t("dash.recentActivity")}</h3>
        </div>
        {loading ? (
          <p className="text-sm text-surface-500">Loading referrals...</p>
        ) : recentRefs.length === 0 ? (
          <p className="text-sm text-surface-500">No recent referrals</p>
        ) : (
          <div className="space-y-3">
            {recentRefs.map((ref, i) => (
              <div
                key={ref.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isDark ? "hover:bg-surface-700/40" : "hover:bg-surface-50"}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${ref.priority === "emergency" ? "bg-red-500" : ref.priority === "urgent" ? "bg-amber-500" : "bg-[#2b4968]"}`}
                >
                  {ref.patientName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {ref.patientName}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {ref.chiefComplaint}
                  </p>
                </div>
                <StatusBadge type="priority" value={ref.priority} />
                <StatusBadge type="sync" value={ref.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
