import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
    IconShieldCheck,
    IconMail,
    IconLock,
    IconEye,
    IconEyeOff,
    IconAlertCircle,
} from '@tabler/icons-react'

export default function Login() {
    const { login } = useAuth()
    const { isDark } = useTheme()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            setError('Please enter your email and password.')
            return
        }
        setLoading(true)
        setError('')
        // Simulate tiny async delay for UX
        await new Promise(r => setTimeout(r, 600))
        const ok = login(email.trim(), password)
        if (!ok) {
            setError('Invalid credentials. Please check your email and password.')
        }
        setLoading(false)
    }

    const inputClass = `w-full pl-10 pr-4 py-3 rounded-lg text-sm border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-500/20 ${isDark
            ? 'bg-surface-900 border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500'
            : 'bg-white border-surface-300 text-surface-900 placeholder-surface-400 focus:border-primary-500'
        }`

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-surface-950' : 'bg-surface-100'
                }`}
        >
            <div className="relative w-full max-w-4xl animate-fade-in">
                {/* Card */}
                <div
                    className={`overflow-hidden rounded-2xl border shadow-xl ${isDark
                            ? 'bg-surface-900 border-surface-800 shadow-black/40'
                            : 'bg-white border-surface-200 shadow-surface-200/60'
                        }`}
                >
                    <div className="grid md:grid-cols-2">
                        {/* Left panel */}
                        <div className={`p-8 ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-700' : 'bg-primary-600'}`}>
                                    <IconShieldCheck size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">TRMS</p>
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        Tigray Resilient Referral Management System
                                    </p>
                                </div>
                            </div>

                            <div className={`mt-6 rounded-lg border p-4 ${isDark ? 'border-surface-800 bg-surface-950/40' : 'border-surface-200 bg-white'}`}>
                                <p className="text-sm font-semibold">Clinical Access Portal</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                    Secure access for authorised staff only. Activity is logged and monitored.
                                </p>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        24/7 referral coordination
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        Unified patient transfer log
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        Emergency escalation hotline
                                    </p>
                                </div>
                            </div>

                            <div className={`mt-6 text-[11px] ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                                For access support call: <span className="font-semibold">+251-11-000-0000</span>
                            </div>
                        </div>

                        {/* Right panel */}
                        <div className="p-8">
                            <div className="mb-6">
                                <h1 className="text-xl font-semibold tracking-tight">Sign in to TRMS</h1>
                                <p className={`text-xs mt-1 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                    Use your hospital or bureau credentials.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <IconMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@trms.et"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError('') }}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                Password
                            </label>
                            <div className="relative">
                                <IconLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError('') }}
                                    className={`${inputClass} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs animate-fade-in">
                                <IconAlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-2 bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-primary-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                            </form>

                            {/* Demo hint */}
                            <div className={`mt-6 p-3 rounded-lg text-[11px] leading-relaxed border ${isDark ? 'border-surface-800 bg-surface-950/40 text-surface-500' : 'border-surface-200 bg-surface-50 text-surface-500'}`}>
                                <strong className={isDark ? 'text-surface-400' : 'text-surface-600'}>Demo credentials </strong>
                                <span className="font-medium">(password: <span className="font-mono">trms2026</span>)</span>
                                <br />liaison@trms.et · doctor@trms.et · dept_head@trms.et
                                <br />facility_admin@trms.et · sys_admin@trms.et · nurse@trms.et
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`flex items-center justify-between text-[11px] mt-4 ${isDark ? 'text-surface-600' : 'text-surface-500'}`}>
                    <span>© 2026 TRMS — Tigray Regional Health Bureau</span>
                    <span>Version 1.0</span>
                </div>
            </div>
        </div>
    )
}
