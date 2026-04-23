import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { IconLock } from "@tabler/icons-react";
import { getUserInitials, trmsApi } from "../../lib/trmsApi";

export default function Profile() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { user, refreshCurrentUser } = useAuth();
  const [resolvedFacilityName, setResolvedFacilityName] = useState("");
  const [resolvedDepartmentName, setResolvedDepartmentName] = useState("");
  const [profileForm, setProfileForm] = useState({
    email: "",
    phone: "",
    profileImageUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const passwordPolicyChecks = useMemo(() => {
    const value = passwordForm.newPassword || "";
    return {
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasLowercase: /[a-z]/.test(value),
      hasNumber: /\d/.test(value),
      hasSymbol: /[^A-Za-z0-9]/.test(value),
    };
  }, [passwordForm.newPassword]);

  const passwordPolicySatisfied =
    Object.values(passwordPolicyChecks).every(Boolean);
  const passwordPolicyItems = [
    {
      key: "minLength",
      label: "At least 8 characters",
      met: passwordPolicyChecks.minLength,
    },
    {
      key: "hasUppercase",
      label: "At least one uppercase letter",
      met: passwordPolicyChecks.hasUppercase,
    },
    {
      key: "hasLowercase",
      label: "At least one lowercase letter",
      met: passwordPolicyChecks.hasLowercase,
    },
    {
      key: "hasNumber",
      label: "At least one number",
      met: passwordPolicyChecks.hasNumber,
    },
    {
      key: "hasSymbol",
      label: "At least one special character",
      met: passwordPolicyChecks.hasSymbol,
    },
  ] as const;
  const passwordPolicyMetCount = passwordPolicyItems.filter(
    (item) => item.met,
  ).length;
  const passwordPolicyProgress =
    (passwordPolicyMetCount / passwordPolicyItems.length) * 100;
  const passwordStrength = useMemo(() => {
    const score = Object.values(passwordPolicyChecks).filter(Boolean).length;
    if (score <= 2) return { label: "Weak", cls: "text-red-500" };
    if (score <= 4) return { label: "Medium", cls: "text-amber-500" };
    return { label: "Strong", cls: "text-emerald-500" };
  }, [passwordPolicyChecks]);

  const card = `rounded-2xl border p-6 ${isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200"}`;
  const labelCls = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-surface-500" : "text-surface-400"}`;
  const valueCls = `text-sm font-medium mt-0.5 ${isDark ? "text-surface-200" : "text-surface-800"}`;
  const resolveBackendAssetUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://"))
      return value;

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

  const effectiveProfileImageUrl = user?.profileImageUrl || "";
  const effectiveFacilityName = resolvedFacilityName || user?.facility || "—";
  const effectiveDepartmentName =
    resolvedDepartmentName || user?.department || "—";

  useEffect(() => {
    setProfileForm({
      email: user?.email || "",
      phone: user?.phone || "",
      profileImageUrl: user?.profileImageUrl || "",
    });
  }, [user?.email, user?.phone, user?.profileImageUrl]);

  useEffect(() => {
    const loadDisplayNames = async () => {
      try {
        if (user?.facilityId) {
          const facilityResult: any = await trmsApi.getFacility(
            user.facilityId,
          );
          const nextFacilityName =
            facilityResult?.name || facilityResult?.facility?.name || "";
          setResolvedFacilityName(nextFacilityName);
        } else {
          setResolvedFacilityName("");
        }

        if (user?.departmentId) {
          const departmentResult: any = await trmsApi.getDepartment(
            user.departmentId,
          );
          setResolvedDepartmentName(departmentResult?.name || "");
        } else {
          setResolvedDepartmentName("");
        }
      } catch {
        setResolvedFacilityName("");
        setResolvedDepartmentName("");
      }
    };

    void loadDisplayNames();
  }, [user?.facilityId, user?.departmentId]);

  const handleProfileImageUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      setProfileUploading(true);
      setProfileError("");
      const uploaded = await trmsApi.uploadImage(file);
      setProfileForm((current) => ({
        ...current,
        profileImageUrl: uploaded.url,
      }));
      setProfileMessage("Profile photo uploaded. Save profile to apply it.");
    } catch (error: any) {
      setProfileError(error?.message || "Failed to upload profile image.");
    } finally {
      setProfileUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileMessage("");
      await trmsApi.updateProfile({
        email: profileForm.email.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        profileImageUrl: profileForm.profileImageUrl || undefined,
      });
      await refreshCurrentUser();
      setProfileMessage("Profile updated successfully.");
    } catch (error: any) {
      setProfileError(error?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (!passwordPolicySatisfied) {
      setPasswordError(
        "New password does not meet the password policy requirements.",
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    try {
      setPasswordSaving(true);
      setPasswordError("");
      setPasswordMessage("");
      await trmsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Password changed successfully.");
    } catch (error: any) {
      setPasswordError(error?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold">{t("pro.title")}</h2>

      {/* Personal details — read only per UR-05 */}
      <div className={card}>
        <div className="flex items-center gap-4 mb-6">
          {effectiveProfileImageUrl ? (
            <img
              src={resolveBackendAssetUrl(effectiveProfileImageUrl)}
              alt={`${user?.name || "User"} profile`}
              className="w-40 h-40 rounded-2xl object-cover border border-surface-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/25">
              {user?.name ? getUserInitials(user.name) : "TR"}
            </div>
          )}
          <div>
            <p className="text-lg font-bold">{user?.name}</p>
            <p
              className={`text-xs ${isDark ? "text-surface-400" : "text-surface-500"}`}
            >
              {user?.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className={labelCls}>{t("common.name")}</p>
            <p className={valueCls}>{user?.name}</p>
          </div>
          <div>
            <p className={labelCls}>Username</p>
            <p className={valueCls}>{user?.username}</p>
          </div>
          <div>
            <p className={labelCls}>{t("common.role")}</p>
            <p className={valueCls}>{user?.role}</p>
          </div>
          <div>
            <p className={labelCls}>{t("common.department")}</p>
            <p className={valueCls}>{effectiveDepartmentName}</p>
          </div>
          <div>
            <p className={labelCls}>{t("common.facility")}</p>
            <p className={valueCls}>{effectiveFacilityName}</p>
          </div>
          <div>
            <p className={labelCls}>Email</p>
            <p className={valueCls}>{user?.email || "—"}</p>
          </div>
          <div>
            <p className={labelCls}>Phone Number</p>
            <p className={valueCls}>{user?.phone || "—"}</p>
          </div>
        </div>

        <p
          className={`text-[10px] mt-5 pt-4 border-t ${isDark ? "text-surface-600 border-surface-800" : "text-surface-400 border-surface-200"}`}
        >
          Identity fields are read-only for audit integrity. You can still
          update contact details and profile photo below.
        </p>
        <p
          className={`text-[10px] mt-2 ${isDark ? "text-surface-500" : "text-surface-500"}`}
        >
          Security note: identity fields are locked to preserve accountability
          and audit traceability.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setShowUpdateProfile((current) => !current);
              setProfileError("");
              setProfileMessage("");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${isDark ? "border-surface-700 text-surface-300 hover:bg-surface-800" : "border-surface-300 text-surface-700 hover:bg-surface-100"}`}
          >
            {showUpdateProfile ? "Hide Update Profile" : "Update Profile"}
          </button>
        </div>
      </div>

      {/* Editable contact/profile section */}
      {showUpdateProfile && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-primary-500/15 text-primary-300" : "bg-primary-100 text-primary-600"}`}
            >
              <IconLock size={15} />
            </div>
            <h3 className="text-sm font-bold">Contact & Profile Photo</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
              >
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => {
                  setProfileForm((current) => ({
                    ...current,
                    email: e.target.value,
                  }));
                  setProfileError("");
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? "bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400" : "bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500"}`}
              />
            </div>
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
              >
                Phone Number
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => {
                  setProfileForm((current) => ({
                    ...current,
                    phone: e.target.value,
                  }));
                  setProfileError("");
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? "bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400" : "bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500"}`}
              />
            </div>
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
              >
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  void handleProfileImageUpload(e.target.files?.[0])
                }
                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${
                  isDark
                    ? "bg-surface-950 border-surface-800 text-surface-100 file:bg-surface-800 file:border-0 file:text-surface-200 file:rounded file:px-2 file:py-1 file:mr-3"
                    : "bg-surface-50 border-surface-200 text-surface-900 file:bg-surface-200 file:border-0 file:text-surface-700 file:rounded file:px-2 file:py-1 file:mr-3"
                }`}
              />
              {profileUploading && (
                <p className="text-[11px] text-surface-500 mt-1">
                  Uploading image...
                </p>
              )}
            </div>
            {profileError && (
              <p className="text-xs text-red-500 font-medium">{profileError}</p>
            )}
            {profileMessage && (
              <p className="text-xs text-emerald-500 font-medium">
                {profileMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={profileSaving || profileUploading}
              className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Change password — UR-05 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-primary-500/15 text-primary-300" : "bg-primary-100 text-primary-600"}`}
          >
            <IconLock size={15} />
          </div>
          <h3 className="text-sm font-bold">{t("pro.changePassword")}</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div
            className={`rounded-lg border p-3 text-[11px] ${isDark ? "border-surface-700 bg-surface-950 text-surface-300" : "border-surface-200 bg-surface-50 text-surface-700"}`}
          >
            Use a strong password and do not share it. You can update your
            password anytime from this page.
          </div>
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
            >
              {t("pro.currentPassword")}
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => {
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: e.target.value,
                }));
                setPasswordError("");
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? "bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400" : "bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500"}`}
            />
          </div>
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
            >
              {t("pro.newPassword")}
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: e.target.value,
                }));
                setPasswordError("");
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? "bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400" : "bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500"}`}
            />
            {passwordForm.newPassword && (
              <>
                <p
                  className={`mt-1 text-[11px] font-semibold ${passwordStrength.cls}`}
                >
                  Password strength: {passwordStrength.label}
                </p>
                <div
                  className={`mt-2 h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-surface-800" : "bg-surface-200"}`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.label === "Strong"
                        ? "bg-emerald-500"
                        : passwordStrength.label === "Medium"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${passwordPolicyProgress}%` }}
                  />
                </div>
              </>
            )}
            <div className="mt-2 space-y-2">
              {passwordPolicyItems.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[11px] ${item.met ? "text-emerald-500" : isDark ? "text-surface-400" : "text-surface-500"}`}
                    >
                      {item.label}
                    </p>
                    <span
                      className={`text-[10px] font-semibold ${item.met ? "text-emerald-500" : isDark ? "text-surface-500" : "text-surface-400"}`}
                    >
                      {item.met ? "Done" : "Pending"}
                    </span>
                  </div>
                  <div
                    className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-surface-800" : "bg-surface-200"}`}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${item.met ? "bg-emerald-500" : "bg-transparent"}`}
                      style={{ width: item.met ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-surface-300" : "text-surface-700"}`}
            >
              {t("pro.confirmPassword")}
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => {
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: e.target.value,
                }));
                setPasswordError("");
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? "bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400" : "bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500"}`}
            />
          </div>
          {passwordError && (
            <p className="text-xs text-red-500 font-medium">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-xs text-emerald-500 font-medium">
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving || !passwordPolicySatisfied}
            className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
          >
            {passwordSaving ? "Changing..." : t("pro.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
