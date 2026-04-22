import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { apiRoleToAppRole, trmsApi, type AppUserRole } from '../lib/trmsApi'

interface AuthUser {
    id: string
    username: string
    name: string
    email?: string
    profileImageUrl?: string
    role: AppUserRole
    mustChangePassword?: boolean
    facility: string
    department: string
    facilityId?: string
    departmentId?: string | null
}

interface AuthContextType {
    user: AuthUser | null
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<boolean>
    refreshCurrentUser: () => Promise<void>
    logout: () => void
}

const ENABLE_API_AUTH = import.meta.env.VITE_ENABLE_API_AUTH === 'true'

const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
    liaison: {
        password: 'trms2026',
        user: { id: 'USR-004', username: 'liaison', name: 'Ato Gebre Tesfay', email: 'liaison@trms.et', role: 'Liaison Officer', facility: 'Ayder Referral Hospital', department: 'Liaison Office' },
    },
    nurse: {
        password: 'trms2026',
        user: { id: 'USR-006', username: 'nurse', name: 'Sr. Yordanos Tekle', email: 'nurse@trms.et', role: 'Liaison Officer', facility: 'Ayder Referral Hospital', department: 'Emergency' },
    },
    doctor: {
        password: 'trms2026',
        user: { id: 'USR-005', username: 'doctor', name: 'Dr. Amanuel Hailu', email: 'doctor@trms.et', role: 'Doctor', facility: 'Ayder Referral Hospital', department: 'Internal Medicine' },
    },
    dept_head: {
        password: 'trms2026',
        user: { id: 'USR-003', username: 'dept_head', name: 'Dr. Mekdes Tesfaye', email: 'dept_head@trms.et', role: 'Department Head', facility: 'Ayder Referral Hospital', department: 'Obstetrics/Gynecology' },
    },
    facility_admin: {
        password: 'trms2026',
        user: { id: 'USR-002', username: 'facility_admin', name: 'Ato Kibrom Hailu', email: 'facility_admin@trms.et', role: 'Facility Administrator', facility: 'Ayder Referral Hospital', department: 'Administration' },
    },
    sys_admin: {
        password: 'trms2026',
        user: { id: 'USR-001', username: 'sys_admin', name: 'Dr. Hagos Gebremichael', email: 'sys_admin@trms.et', role: 'System Administrator', facility: 'Regional Health Bureau', department: 'IT Administration' },
    },
    hew: {
        password: 'trms2026',
        user: { id: 'USR-011', username: 'hew', name: 'W/ro Selam Desta', role: 'HEW', facility: 'Shire Health Center', department: 'Community Health' },
    },
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: async () => false,
    refreshCurrentUser: async () => { },
    logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const saved = localStorage.getItem('trms-user')
        if (!saved) return null
        const parsed = JSON.parse(saved) as AuthUser
        return {
            ...parsed,
            mustChangePassword: parsed.mustChangePassword ?? false,
        }
    })

    const mapApiUserToAuthUser = (apiUser: any, existingUser?: AuthUser | null): AuthUser => ({
        id: apiUser.id,
        username: apiUser.username,
        name: apiUser.fullName,
        role: apiRoleToAppRole(apiUser.role),
        mustChangePassword: apiUser.mustChangePassword ?? false,
        profileImageUrl: apiUser.profileImageUrl,
        email: apiUser.email,
        facility: apiUser.facilityName || existingUser?.facility || apiUser.facilityId || 'Assigned Facility',
        department: apiUser.departmentName || existingUser?.department || apiUser.departmentId || 'Unassigned Department',
        facilityId: apiUser.facilityId,
        departmentId: apiUser.departmentId,
    })

    const login = async (username: string, password: string): Promise<boolean> => {
        const normalizedUsername = username.trim().toLowerCase()

        if (ENABLE_API_AUTH) {
            try {
                const response = await trmsApi.login({
                    username: normalizedUsername,
                    password,
                })

                // Store the JWT token
                trmsApi.setToken(response.access_token)

                const apiUser = mapApiUserToAuthUser(response.user)

                setUser(apiUser)
                localStorage.setItem('trms-user', JSON.stringify(apiUser))
                return true
            } catch {
                return false
            }
        }

        const match = MOCK_USERS[normalizedUsername]
        if (match && match.password === password) {
            setUser(match.user)
            localStorage.setItem('trms-user', JSON.stringify(match.user))
            return true
        }
        return false
    }

    const refreshCurrentUser = async () => {
        if (!ENABLE_API_AUTH || !trmsApi.getToken()) return
        try {
            const apiUser = await trmsApi.getCurrentUser()
            const mappedUser = mapApiUserToAuthUser(apiUser, user)
            setUser(mappedUser)
            localStorage.setItem('trms-user', JSON.stringify(mappedUser))
        } catch {
            // Keep current session if refresh fails transiently.
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('trms-user')
        trmsApi.clearToken()
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, refreshCurrentUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
