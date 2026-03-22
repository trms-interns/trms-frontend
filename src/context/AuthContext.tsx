import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthUser {
    name: string
    email: string
    role: string
    facility: string
}

interface AuthContextType {
    user: AuthUser | null
    isAuthenticated: boolean
    login: (email: string, password: string) => boolean
    logout: () => void
}

// Mock authorized users
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
    'admin@trms.et': {
        password: 'trms2026',
        user: { name: 'Dr. Hagos Gebremichael', email: 'admin@trms.et', role: 'Health Administrator', facility: 'Ayder Referral Hospital' },
    },
    'liaison@trms.et': {
        password: 'trms2026',
        user: { name: 'Ato Gebre Tesfay', email: 'liaison@trms.et', role: 'Liaison Officer', facility: 'Ayder Referral Hospital' },
    },
    'nurse@trms.et': {
        password: 'trms2026',
        user: { name: 'Sr. Yordanos Tekle', email: 'nurse@trms.et', role: 'Senior Nurse', facility: 'Ayder Referral Hospital' },
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
        // TODO (Backend Team): Replace mock authentication with an actual API call.
        // E.g. POST /api/auth/login with { email, password }
        // On success, set the user token in localStorage and update state.
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
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
