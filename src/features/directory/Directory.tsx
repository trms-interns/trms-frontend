import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { mockFacilities } from "../../data/mockData";
import {
  trmsApi,
  type ApiFacility,
  type ApiService,
} from "../../lib/trmsApi";
import {
  IconSearch,
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
  IconBuilding,
  IconTool,
} from "@tabler/icons-react";

type ServiceStatus = "available" | "limited" | "unavailable";

const ENABLE_API_REFERRALS = import.meta.env.VITE_ENABLE_API_AUTH === "true";

function mapMockFacilitiesToApiFacilities(
  data: typeof mockFacilities,
): ApiFacility[] {
  return data.map((facility) => ({
    id: facility.id,
    name: facility.name,
    type: "general_hospital",
    location: facility.location,
    contact: facility.contact,
    services: facility.departments.map((department) => ({
      id: department.id,
      serviceType: department.name,
      status: department.status,
      estimatedDelayDays: department.estimatedDelayDays,
    })),
  }));
}

function StatusPill({ status }: { status: ServiceStatus }) {
  const config: Record<ServiceStatus, { label: string; cls: string }> = {
    available: {
      label: "Available",
      cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
    },
    limited: {
      label: "Limited",
      cls: "bg-amber-500/15 text-amber-500 border-amber-500/25",
    },
    unavailable: {
      label: "Unavailable",
      cls: "bg-red-500/15 text-red-500 border-red-500/25",
    },
  };
  const c = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${c.cls}`}
    >
      {status === "available" && <IconCircleCheck size={9} />}
      {status === "limited" && <IconClock size={9} />}
      {status === "unavailable" && <IconAlertTriangle size={9} />}
      {c.label}
    </span>
  );
}

export default function Directory() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceStatus>("all");
  const [facilities, setFacilities] = useState<ApiFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!ENABLE_API_REFERRALS) {
        setFacilities(mapMockFacilitiesToApiFacilities(mockFacilities));
        setLoading(false);
        return;
      }

      try {
        const facilitiesData = await trmsApi.getFacilities();
        const enriched = await Promise.all(
          facilitiesData.map(async (facility) => {
            if (Array.isArray(facility.services) && facility.services.length > 0) {
              return facility;
            }

            try {
              const services = await trmsApi.getFacilityServices(facility.id);
              return { ...facility, services };
            } catch {
              return { ...facility, services: facility.services || [] };
            }
          }),
        );

        setFacilities(enriched);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load service directory.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const scopedFacilities = useMemo(() => {
    if (user?.role === "System Administrator") {
      return facilities;
    }

    if (!user?.facilityId) {
      return facilities;
    }

    return facilities.filter((facility) => facility.id === user.facilityId);
  }, [facilities, user?.facilityId, user?.role]);

  const rows = useMemo(() => {
    return scopedFacilities.flatMap((facility) =>
      (facility.services || []).map((service) => ({
        facilityId: facility.id,
        facilityName: facility.name,
        facilityType: facility.type,
        location: facility.location || "Unknown location",
        service,
      })),
    );
  }, [scopedFacilities]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusMatches =
        statusFilter === "all" ? true : row.service.status === statusFilter;
      if (!statusMatches) return false;

      if (!q) return true;

      return (
        row.facilityName.toLowerCase().includes(q) ||
        row.facilityType.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.service.serviceType.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    const serviceList: ApiService[] = rows.map((row) => row.service);
    return {
      totalFacilities: scopedFacilities.length,
      totalServices: serviceList.length,
      available: serviceList.filter((service) => service.status === "available")
        .length,
      limited: serviceList.filter((service) => service.status === "limited")
        .length,
      unavailable: serviceList.filter(
        (service) => service.status === "unavailable",
      ).length,
    };
  }, [rows, scopedFacilities.length]);

  const card = `rounded-2xl border p-5 ${
    isDark
      ? "bg-surface-800/60 border-surface-700/50"
      : "bg-white border-surface-200"
  }`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t("dir.title")}</h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? "text-surface-400" : "text-surface-500"
            }`}
          >
            {user?.role === "System Administrator"
              ? "System-wide facility service directory"
              : "Your facility service directory"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-500 border border-primary-500/20">
            <IconBuilding size={12} /> {counts.totalFacilities} facilities
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-500 border border-accent-500/20">
            <IconTool size={12} /> {counts.totalServices} services
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <IconCircleCheck size={12} /> {counts.available} available
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <IconClock size={12} /> {counts.limited} limited
          </span>
          {counts.unavailable > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
              <IconAlertTriangle size={12} /> {counts.unavailable} unavailable
            </span>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 rounded-2xl border ${
          isDark
            ? "bg-surface-800/60 border-surface-700/50"
            : "bg-white border-surface-200"
        }`}
      >
        <div className="relative lg:col-span-2">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
          />
          <input
            type="text"
            placeholder="Search by facility, location, type, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none transition-colors ${
              isDark
                ? "bg-surface-900 border-surface-700 text-surface-100 focus:border-primary-500"
                : "bg-surface-50 border-surface-200 focus:border-primary-500"
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | ServiceStatus)
          }
          className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${
            isDark
              ? "bg-surface-900 border-surface-700 text-surface-100 focus:border-primary-500"
              : "bg-surface-50 border-surface-200 focus:border-primary-500"
          }`}
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className={card}>
        {loading ? (
          <p className="text-sm text-surface-500">Loading service directory...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-surface-500">
            No services match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-surface-700" : "border-surface-200"
                  }`}
                >
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Facility
                  </th>
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Service
                  </th>
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                    Delay
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={`${row.facilityId}-${row.service.id}-${idx}`}
                    className={`border-b last:border-0 ${
                      isDark ? "border-surface-700/50" : "border-surface-100"
                    }`}
                  >
                    <td className="py-2.5 font-medium">{row.facilityName}</td>
                    <td className="py-2.5 text-surface-500">{row.location}</td>
                    <td className="py-2.5 text-surface-500">{row.facilityType}</td>
                    <td className="py-2.5">{row.service.serviceType}</td>
                    <td className="py-2.5">
                      <StatusPill status={row.service.status} />
                    </td>
                    <td className="py-2.5 text-surface-500">
                      {typeof row.service.estimatedDelayDays === "number"
                        ? `${row.service.estimatedDelayDays} day(s)`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
