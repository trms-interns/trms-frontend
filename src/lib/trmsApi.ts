export type ApiUserRole =
    | 'system_admin'
    | 'facility_admin'
    | 'department_head'
    | 'liaison_officer'
    | 'doctor'
    | 'hew'

export type AppUserRole =
    | 'System Administrator'
    | 'Facility Administrator'
    | 'Department Head'
    | 'Liaison Officer'
    | 'Doctor'
    | 'HEW'

export type ApiReferralPriority = 'routine' | 'urgent' | 'emergency'
export type ApiPatientGender = 'male' | 'female' | 'other' | 'unknown'

export interface LoginRequest {
    username: string
    password: string
}

export interface ApiUser {
    id: string
    username: string
    fullName: string
    role: ApiUserRole
    facilityId: string
    departmentId: string | null
    active?: boolean
    lastLogin?: string
    phone?: string
    email?: string
    profileImageUrl?: string
    location?: string
    birthDate?: string
    specialityDescription?: string
}

export interface LoginResponse {
    access_token: string
    token_type: string
    user: {
        id: string
        username: string
        fullName: string
        role: ApiUserRole
        facilityId: string
        departmentId: string | null
    }
}

export interface ApiService {
    id: string
    serviceType: string
    status: 'available' | 'limited' | 'unavailable'
    estimatedDelayDays?: number
}

export interface ApiFacility {
    id: string
    name: string
    type: 'health_center' | 'primary_hospital' | 'general_hospital' | 'specialized_hospital'
    location: string
    contact?: string
    services: ApiService[]
}

export interface CreateReferralRequest {
    patientName: string
    patientDob: string
    patientGender: ApiPatientGender
    patientPhone?: string
    receivingFacilityId: string
    priority: ApiReferralPriority
    clinicalSummary: string
    primaryDiagnosis: string
    treatmentGiven?: string
    reason: string
    consentGiven: boolean
    allergies?: string
    pastMedicalHistory?: string
    currentMedications?: string
}

export interface CreateReferralFormValues {
    patientName: string
    dateOfBirth: string
    gender: string
    phone: string
    receivingFacility: string
    priority: string
    clinicalSummary: string
    primaryDiagnosis: string
    treatmentGiven: string
    reasonForReferral: string
    consent: boolean
    allergies: string
    pastMedicalHistory: string
    currentMedications: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiRoleLabels: Record<ApiUserRole, AppUserRole> = {
    system_admin: 'System Administrator',
    facility_admin: 'Facility Administrator',
    department_head: 'Department Head',
    liaison_officer: 'Liaison Officer',
    doctor: 'Doctor',
    hew: 'HEW',
}

export function apiRoleToAppRole(role: ApiUserRole): AppUserRole {
    return apiRoleLabels[role]
}

export function getUserInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .filter((word) => !['Dr.', 'Sr.', 'Ato'].includes(word))
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

export function normalizePatientGender(value: string): ApiPatientGender {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'male') return 'male'
    if (normalized === 'female') return 'female'
    if (normalized === 'other') return 'other'
    return 'unknown'
}

export function normalizePriority(value: string): ApiReferralPriority {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'urgent') return 'urgent'
    if (normalized === 'emergency') return 'emergency'
    return 'routine'
}

export function buildCreateReferralPayload(form: CreateReferralFormValues): CreateReferralRequest {
    return {
        patientName: form.patientName.trim(),
        patientDob: form.dateOfBirth,
        patientGender: normalizePatientGender(form.gender),
        patientPhone: form.phone.trim() || undefined,
        receivingFacilityId: form.receivingFacility,
        priority: normalizePriority(form.priority),
        clinicalSummary: form.clinicalSummary.trim(),
        primaryDiagnosis: form.primaryDiagnosis.trim(),
        treatmentGiven: form.treatmentGiven.trim() || undefined,
        reason: form.reasonForReferral.trim(),
        consentGiven: form.consent,
        allergies: form.allergies.trim() || undefined,
        pastMedicalHistory: form.pastMedicalHistory.trim() || undefined,
        currentMedications: form.currentMedications.trim() || undefined,
    }
}

export class TrmsApiError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'TrmsApiError'
        this.status = status
    }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    })

    if (!response.ok) {
        let message = 'Request failed.'
        try {
            const errorBody = await response.json()
            if (typeof errorBody?.message === 'string') {
                message = errorBody.message
            }
        } catch {
            // Fall back to the generic message if the backend does not return JSON.
        }
        throw new TrmsApiError(message, response.status)
    }

    return response.json() as Promise<T>
}

export const trmsApi = {
    login(payload: LoginRequest) {
        return apiRequest<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    },
    getFacilities(token: string) {
        return apiRequest<ApiFacility[]>('/facilities', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
    },
    createReferral(token: string, payload: CreateReferralRequest) {
        return apiRequest('/referrals', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        })
    },
}
