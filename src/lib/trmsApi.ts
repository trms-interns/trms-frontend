export type ApiUserRole =
  | "system_admin"
  | "facility_admin"
  | "department_head"
  | "liaison_officer"
  | "doctor"
  | "hew";

export type AppUserRole =
  | "System Administrator"
  | "Facility Administrator"
  | "Department Head"
  | "Liaison Officer"
  | "Doctor"
  | "HEW";

export type ApiReferralPriority = "routine" | "urgent" | "emergency";
export type ApiPatientGender = "male" | "female" | "other" | "unknown";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiUser {
  id: string;
  username: string;
  fullName: string;
  role: ApiUserRole;
  mustChangePassword?: boolean;
  facilityId: string;
  departmentId: string | null;
  active?: boolean;
  lastLogin?: string;
  phone?: string;
  email?: string;
  profileImageUrl?: string;
  location?: string;
  birthDate?: string;
  specialityDescription?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: ApiUserRole;
    mustChangePassword?: boolean;
    profileImageUrl?: string;
    facilityId: string;
    facilityName?: string | null;
    departmentId: string | null;
    departmentName?: string | null;
  };
}

export interface ApiService {
  id: string;
  serviceType: string;
  status: "available" | "limited" | "unavailable";
  estimatedDelayDays?: number;
}

export interface ApiFacility {
  id: string;
  name: string;
  type:
    | "health_center"
    | "primary_hospital"
    | "general_hospital"
    | "specialized_hospital";
  location: string;
  contact?: string;
  profileImageUrl?: string;
  services: ApiService[];
}

export interface CreateReferralRequest {
  patientName: string;
  patientDob: string;
  patientGender: ApiPatientGender;
  patientPhone?: string;
  receivingFacilityId: string;
  receivingDepartmentId?: string;
  serviceType?: string;
  priority: ApiReferralPriority;
  clinicalSummary: string;
  primaryDiagnosis: string;
  treatmentGiven?: string;
  reason: string;
  consentGiven: boolean;
  vitalSigns?: string;
  allergies?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
  status?: "draft" | "pending";
}

export interface CreateReferralFormValues {
  patientName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  receivingFacility: string;
  receivingDepartmentId: string;
  serviceType: string;
  priority: string;
  clinicalSummary: string;
  primaryDiagnosis: string;
  treatmentGiven: string;
  vitalSigns: string;
  reasonForReferral: string;
  consent: boolean;
  allergies: string;
  pastMedicalHistory: string;
  currentMedications: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const apiRoleLabels: Record<ApiUserRole, AppUserRole> = {
  system_admin: "System Administrator",
  facility_admin: "Facility Administrator",
  department_head: "Department Head",
  liaison_officer: "Liaison Officer",
  doctor: "Doctor",
  hew: "HEW",
};

export function apiRoleToAppRole(role: ApiUserRole): AppUserRole {
  return apiRoleLabels[role];
}

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .filter((word) => !["Dr.", "Sr.", "Ato"].includes(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function normalizePatientGender(value: string): ApiPatientGender {
  const normalized = value.trim().toLowerCase();
  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  if (normalized === "other") return "other";
  return "unknown";
}

export function normalizePriority(value: string): ApiReferralPriority {
  const normalized = value.trim().toLowerCase();
  if (normalized === "urgent") return "urgent";
  if (normalized === "emergency") return "emergency";
  return "routine";
}

export function buildCreateReferralPayload(
  form: CreateReferralFormValues,
): CreateReferralRequest {
  return {
    patientName: form.patientName.trim(),
    patientDob: form.dateOfBirth,
    patientGender: normalizePatientGender(form.gender),
    patientPhone: form.phone.trim() || undefined,
    receivingFacilityId: form.receivingFacility,
    receivingDepartmentId: form.receivingDepartmentId || undefined,
    serviceType: form.serviceType.trim() || undefined,
    priority: normalizePriority(form.priority),
    clinicalSummary: form.clinicalSummary.trim(),
    primaryDiagnosis: form.primaryDiagnosis.trim(),
    treatmentGiven: form.treatmentGiven.trim() || undefined,
    vitalSigns: form.vitalSigns.trim() || undefined,
    reason: form.reasonForReferral.trim(),
    consentGiven: form.consent,
    allergies: form.allergies.trim() || undefined,
    pastMedicalHistory: form.pastMedicalHistory.trim() || undefined,
    currentMedications: form.currentMedications.trim() || undefined,
  };
}

export function toDisplayReferralId(
  referralCode: string | null | undefined,
  fallbackId: string,
): string {
  const normalizedCode = referralCode?.trim();
  if (normalizedCode) return normalizedCode;

  const hexChars = fallbackId.replace(/-/g, "").toLowerCase();
  let numeric = 0;
  for (const ch of hexChars) {
    const parsed = Number.parseInt(ch, 16);
    if (Number.isNaN(parsed)) continue;
    numeric = (numeric * 16 + parsed) % 100000000;
  }
  return `REF-${numeric.toString().padStart(8, "0")}`;
}

export class TrmsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TrmsApiError";
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.message === "string") {
        message = errorBody.message;
      }
    } catch {
      // Fall back to the generic message if the backend does not return JSON.
    }
    throw new TrmsApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  const bodyText = await response.text();
  if (!bodyText) {
    return undefined as T;
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    return bodyText as T;
  }
}

// Token management
function getAuthToken(): string | null {
  return sessionStorage.getItem("trms-token");
}

function setAuthToken(token: string) {
  sessionStorage.setItem("trms-token", token);
}

function clearAuthToken() {
  sessionStorage.removeItem("trms-token");
  // Backward compatibility cleanup if an old session used localStorage.
  localStorage.removeItem("trms-token");
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Additional API types
export interface UpdateProfileRequest {
  phone?: string;
  email?: string;
  profileImageUrl?: string;
  location?: string;
  birthDate?: string;
  specialityDescription?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  fullName: string;
  role: ApiUserRole;
  departmentId?: string;
  facilityId: string;
  initialPassword: string;
  username?: string;
  profileImageUrl?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: ApiUserRole;
  departmentId?: string;
  active?: boolean;
  username?: string;
  password?: string;
  currentPassword?: string;
}

export interface Department {
  id: string;
  name: string;
  facilityId: string;
  type?: "clinical" | "liaison";
  active?: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  facilityId: string;
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  type: "clinical" | "liaison";
}

export interface UpdateDepartmentRequest {
  name?: string;
  active?: boolean;
}

export interface CreateFacilityRequest {
  name: string;
  type:
    | "health_center"
    | "primary_hospital"
    | "general_hospital"
    | "specialized_hospital";
  location?: string;
  contact?: string;
  adminUsername: string;
  adminPassword: string;
}

export interface UpdateFacilityRequest {
  name?: string;
  location?: string;
  contact?: string;
  profileImageUrl?: string;
  active?: boolean;
}

export interface UploadFileResponse {
  url: string;
  originalName: string;
  filename: string;
  size: number;
}

export interface UpdateServiceRequest {
  serviceId: string;
  status: "available" | "limited" | "unavailable";
  estimatedDelayDays?: number;
}

export interface CreateServiceRequest {
  serviceType: string;
  status?: "available" | "limited" | "unavailable";
  estimatedDelayDays?: number;
}

export interface ReportQueryParams {
  facilityId?: string;
  period?: string;
  month?: string;
  priority?: ApiReferralPriority;
}

export interface ExportReportQueryParams extends ReportQueryParams {
  format: "csv" | "pdf";
}

export interface ApiReferral {
  id: string;
  referralCode?: string;
  patient: any;
  referringFacilityId: string;
  referringUserId: string;
  receivingFacilityId: string;
  receivingDepartmentId?: string;
  referringFacility?: { id: string; name?: string };
  receivingFacility?: { id: string; name?: string };
  receivingDepartment?: { id: string; name?: string };
  referringUser?: ApiReferralUserSummary;
  acceptedByUser?: ApiReferralUserSummary;
  rejectedByUser?: ApiReferralUserSummary;
  clinicianAcceptedByUser?: ApiReferralUserSummary;
  priority: ApiReferralPriority;
  clinicalSummary: string;
  primaryDiagnosis: string;
  treatmentGiven?: string;
  reasonForReferral: string;
  allergies?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
  status:
    | "draft"
    | "pending"
    | "pending_routing"
    | "awaiting_outbound_review"
    | "accepted"
    | "rejected"
    | "forwarded"
    | "completed";
  createdAt: string;
  syncedAt?: string;
  waitingTime?: string;
  rejectionReason?: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  rejectedByUserId?: string;
  forwardingNote?: string;
  forwardedFromReferralId?: string;
  appointmentDate?: string;
  clinicianAcceptedAt?: string;
  clinicianAcceptedByUserId?: string;
  consentRecord?: any;
  dischargeSummary?: any;
}

export interface ApiReferralUserSummary {
  id: string;
  username?: string;
  fullName?: string;
  role?: string;
  phone?: string | null;
  email?: string | null;
  facilityId?: string | null;
  facilityName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
}

export interface AcceptReferralRequest {
  status: "ACCEPTED";
  receivingDepartmentId: string;
  waitingTime?: string;
  appointmentDate?: string;
  note?: string;
}

export interface RejectReferralRequest {
  status: "REJECTED";
  reason: string;
}

export interface ForwardReferralRequest {
  status: "FORWARDED";
  newReceivingFacilityId: string;
  forwardingNote: string;
}

export interface SubmitReferralRequest {
  status: "PENDING";
}

export interface RouteReferralRequest {
  receivingFacilityId: string;
}

export interface AssignDepartmentRequest {
  departmentId: string;
}

export interface CreateDischargeSummaryRequest {
  summary: string;
  finalDiagnosis: string;
  medicationsPrescribed: string;
  followUpInstructions: string;
  dischargeDate: string;
}

export interface DischargeSummary {
  id: string;
  referralId: string;
  summaryText: string;
  finalDiagnosis: string;
  medicationsPrescribed: string;
  followUpInstructions: string;
  createdByUserId: string;
  createdAt: string;
  dischargeDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export interface SyncUpdatesResponse {
  syncVersion: number;
  syncCursor: any;
  requestEcho: any;
  retry: any;
  processed: any;
  updates: {
    referrals: ApiReferral[];
    facilities: ApiFacility[];
    services: ApiService[];
  };
}

export interface SyncRequestPayload {
  syncVersion?: number;
  clientRequestId?: string;
  deviceId?: string;
  retryCount?: number;
  since?: string;
  lastSyncAt?: string;
  pullLimit?: number;
  syncCursor?: {
    anchorTime?: string;
    referrals?: { updatedAt?: string; id?: string };
    facilities?: { updatedAt?: string; id?: string };
    services?: { updatedAt?: string; id?: string };
  };
  pushedReferrals?: Array<unknown>;
}

export interface AuditChainVerificationResult {
  valid: boolean;
  checkedEntries: number;
  brokenEntryIds: string[];
}

export const trmsApi = {
  // Token management
  setToken: setAuthToken,
  getToken: getAuthToken,
  clearToken: clearAuthToken,

  // Auth endpoints
  login(payload: LoginRequest) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser() {
    return apiRequest<ApiUser>("/auth/me", {
      headers: getAuthHeaders(),
    });
  },

  updateProfile(payload: UpdateProfileRequest) {
    return apiRequest<ApiUser>("/auth/me/profile", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  changePassword(payload: PasswordChangeRequest) {
    return apiRequest<{ success: boolean }>("/auth/me/password", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  logout() {
    return apiRequest<{ success: boolean }>("/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  // User management
  getUsers(facilityId?: string, departmentId?: string) {
    const query = new URLSearchParams();
    if (facilityId) query.set("facilityId", facilityId);
    if (departmentId) query.set("departmentId", departmentId);
    const queryString = query.toString();
    const params = queryString ? `?${queryString}` : "";
    return apiRequest<ApiUser[]>(`/users${params}`, {
      headers: getAuthHeaders(),
    });
  },

  createUser(payload: CreateUserRequest) {
    return apiRequest<ApiUser>("/users", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  updateUser(userId: string, payload: UpdateUserRequest) {
    return apiRequest<ApiUser>(`/users/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  deleteUser(userId: string) {
    return apiRequest<{ success: boolean }>(`/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  // Department management
  getDepartments(facilityId?: string) {
    const params = facilityId ? `?facilityId=${facilityId}` : "";
    return apiRequest<Department[]>(`/departments${params}`, {
      headers: getAuthHeaders(),
    });
  },

  getDepartment(departmentId: string) {
    return apiRequest<Department>(`/departments/${departmentId}`, {
      headers: getAuthHeaders(),
    });
  },

  createDepartment(payload: CreateDepartmentRequest) {
    return apiRequest<Department>("/departments", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  updateDepartment(departmentId: string, payload: UpdateDepartmentRequest) {
    return apiRequest<Department>(`/departments/${departmentId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  deleteDepartment(departmentId: string) {
    return apiRequest<{ success: boolean }>(`/departments/${departmentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  // Facility management
  getFacilities() {
    return apiRequest<ApiFacility[]>("/facilities", {
      headers: getAuthHeaders(),
    });
  },

  getFacility(facilityId: string) {
    return apiRequest<ApiFacility>(`/facilities/${facilityId}`, {
      headers: getAuthHeaders(),
    });
  },

  createFacility(payload: CreateFacilityRequest) {
    return apiRequest<ApiFacility>("/facilities", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  updateFacility(facilityId: string, payload: UpdateFacilityRequest) {
    return apiRequest<ApiFacility>(`/facilities/${facilityId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  deleteFacility(facilityId: string) {
    return apiRequest<{ success: boolean }>(`/facilities/${facilityId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      let message = "Image upload failed.";
      try {
        const errorBody = await response.json();
        if (typeof errorBody?.message === "string") {
          message = errorBody.message;
        }
      } catch {
        // Fall back to generic message.
      }
      throw new TrmsApiError(message, response.status);
    }

    return response.json() as Promise<UploadFileResponse>;
  },

  // Facility services
  getFacilityServices(facilityId: string) {
    return apiRequest<ApiService[]>(`/facilities/${facilityId}/services`, {
      headers: getAuthHeaders(),
    });
  },

  createFacilityService(facilityId: string, payload: CreateServiceRequest) {
    return apiRequest<ApiService>(`/facilities/${facilityId}/services`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  updateFacilityService(facilityId: string, payload: UpdateServiceRequest) {
    return apiRequest<ApiService>(`/facilities/${facilityId}/services`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  // Referral management
  getReferrals(params?: {
    status?: string;
    facilityId?: string;
    departmentId?: string;
    role?: string;
  }) {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return apiRequest<ApiReferral[]>(`/referrals${queryString}`, {
      headers: getAuthHeaders(),
    });
  },

  getReferral(referralId: string) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}`, {
      headers: getAuthHeaders(),
    });
  },

  createReferral(payload: CreateReferralRequest) {
    return apiRequest<ApiReferral>("/referrals", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  updateReferral(
    referralId: string,
    payload:
      | AcceptReferralRequest
      | RejectReferralRequest
      | ForwardReferralRequest
      | SubmitReferralRequest,
  ) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  acceptReferral(
    referralId: string,
    payload: Omit<AcceptReferralRequest, "status">,
  ) {
    return this.updateReferral(referralId, { ...payload, status: "ACCEPTED" });
  },

  rejectReferral(
    referralId: string,
    payload: Omit<RejectReferralRequest, "status">,
  ) {
    return this.updateReferral(referralId, { ...payload, status: "REJECTED" });
  },

  forwardReferral(
    referralId: string,
    payload: Omit<ForwardReferralRequest, "status">,
  ) {
    return this.updateReferral(referralId, { ...payload, status: "FORWARDED" });
  },

  submitReferral(referralId: string) {
    return this.updateReferral(referralId, { status: "PENDING" });
  },

  cancelReferral(referralId: string) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
  },

  deleteReferral(referralId: string) {
    return apiRequest<void>(`/referrals/${referralId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  confirmReferral(referralId: string) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}/confirm`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  async removeReferral(referralId: string) {
    try {
      await this.deleteReferral(referralId);
      return;
    } catch (error) {
      if (
        error instanceof TrmsApiError &&
        error.status !== 404 &&
        error.status !== 405
      ) {
        throw error;
      }
    }

    try {
      await this.cancelReferral(referralId);
    } catch (error) {
      if (
        error instanceof TrmsApiError &&
        (error.status === 404 || error.status === 405)
      ) {
        // Treat as success: referral is already gone or cancel route is unsupported.
        return;
      }
      throw error;
    }
  },

  routeReferral(referralId: string, payload: RouteReferralRequest) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}/route`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  assignReferralDepartment(
    referralId: string,
    payload: AssignDepartmentRequest,
  ) {
    return apiRequest<ApiReferral>(`/referrals/${referralId}/assign`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  clinicianAcceptReferral(referralId: string) {
    return apiRequest<ApiReferral>(
      `/referrals/${referralId}/clinician-accept`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
  },

  addDischargeSummary(
    referralId: string,
    payload: CreateDischargeSummaryRequest,
  ) {
    return apiRequest<DischargeSummary>(`/referrals/${referralId}/discharge`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  // Sync
  getSyncUpdates(since: string) {
    return apiRequest<SyncUpdatesResponse>(`/referrals/sync?since=${since}`, {
      headers: getAuthHeaders(),
    });
  },

  pushUnsyncedReferrals(payload: SyncRequestPayload) {
    return apiRequest<SyncUpdatesResponse>("/referrals/sync", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  // Notifications
  getNotifications() {
    return apiRequest<Notification[]>("/notifications", {
      headers: getAuthHeaders(),
    });
  },

  markNotificationAsRead(notificationId: string) {
    return apiRequest<{ success: boolean }>(
      `/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
  },

  // Reports
  getReport(params: ReportQueryParams) {
    const query = new URLSearchParams();
    if (params.facilityId) query.set("facilityId", params.facilityId);
    if (params.period) query.set("period", params.period);
    if (params.month) query.set("month", params.month);
    if (params.priority) query.set("priority", params.priority);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<any>(`/reports${queryString}`, {
      headers: getAuthHeaders(),
    });
  },

  async exportReport(params: ExportReportQueryParams) {
    const query = new URLSearchParams();
    if (params.facilityId) query.set("facilityId", params.facilityId);
    if (params.period) query.set("period", params.period);
    if (params.month) query.set("month", params.month);
    if (params.priority) query.set("priority", params.priority);
    query.set("format", params.format);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(
      `${API_BASE_URL}/reports/export${queryString}`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      let message = "Request failed.";
      try {
        const errorBody = await response.json();
        if (typeof errorBody?.message === "string") {
          message = errorBody.message;
        }
      } catch {
        // Fall back to generic message.
      }
      throw new TrmsApiError(message, response.status);
    }

    return response.blob();
  },

  // Audit logs
  getAuditLogs(userId?: string, limit?: number, offset?: number) {
    const query = new URLSearchParams();
    if (userId) query.set("userId", userId);
    if (limit !== undefined) query.set("limit", limit.toString());
    if (offset !== undefined) query.set("offset", offset.toString());
    const queryString = query.toString();
    const params = queryString ? `?${queryString}` : "";
    return apiRequest<any[]>(`/audit-logs${params}`, {
      headers: getAuthHeaders(),
    });
  },

  verifyAuditChain() {
    return apiRequest<AuditChainVerificationResult>("/audit-logs/verify", {
      headers: getAuthHeaders(),
    });
  },
};
