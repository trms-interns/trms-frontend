import React, { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserRole } from '../data/mockData'

interface AuthUser {
    name: string
    email: string
    role: UserRole
    facility: string
    department: string
}

interface AuthContextType {
    user: AuthUser | null
    isAuthenticated: boolean
    login: (email: string, password: string) => boolean
    logout: () => void
}

// TODO (Backend Team): Replace with Keycloak OIDC token exchange.
// POST /api/auth/login → returns JWT with role claims. Store token in memory (not localStorage) for security.
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
    'liaison@trms.et': {
        password: 'trms2026',
        user: { name: 'Ato Gebre Tesfay', email: 'liaison@trms.et', role: 'Liaison Officer', facility: 'Ayder Referral Hospital', department: 'Liaison Office' },
    },
    'nurse@trms.et': {
        password: 'trms2026',
        user: { name: 'Sr. Yordanos Tekle', email: 'nurse@trms.et', role: 'Liaison Officer', facility: 'Ayder Referral Hospital', department: 'Emergency' },
    },
    'doctor@trms.et': {
        password: 'trms2026',
        user: { name: 'Dr. Amanuel Hailu', email: 'doctor@trms.et', role: 'Doctor', facility: 'Ayder Referral Hospital', department: 'Internal Medicine' },
    },
    'dept_head@trms.et': {
        password: 'trms2026',
        user: { name: 'Dr. Mekdes Tesfaye', email: 'dept_head@trms.et', role: 'Department Head', facility: 'Ayder Referral Hospital', department: 'Obstetrics/Gynecology' },
    },
    'facility_admin@trms.et': {
        password: 'trms2026',
        user: { name: 'Ato Kibrom Hailu', email: 'facility_admin@trms.et', role: 'Facility Administrator', facility: 'Ayder Referral Hospital', department: 'Administration' },
    },
    'sys_admin@trms.et': {
        password: 'trms2026',
        user: { name: 'Dr. Hagos Gebremichael', email: 'sys_admin@trms.et', role: 'System Administrator', facility: 'Regional Health Bureau', department: 'IT Administration' },
    },
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: () => false,
    logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const saved = localStorage.getItem('trms-user')
        return saved ? JSON.parse(saved) : null
    })

    const login = (email: string, password: string): boolean => {
        // TODO (Backend Team): Replace with real API call:
        // const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        // const { token, user } = await res.json()
        // Store token in memory; decode role from JWT claims.
        const match = MOCK_USERS[email.toLowerCase()]
        if (match && match.password === password) {
            setUser(match.user)
            localStorage.setItem('trms-user', JSON.stringify(match.user))
            return true
        }
        return false
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('trms-user')
        // TODO (Backend Team): POST /api/auth/logout to invalidate token server-side
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
