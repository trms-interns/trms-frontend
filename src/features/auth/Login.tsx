import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

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

    const inputClass = `w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-500/30 ${isDark
            ? 'bg-surface-900 border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500'
            : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'
        }`

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-surface-950' : 'bg-gradient-to-br from-primary-50 via-surface-50 to-accent-50'
                }`}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Card */}
                <div
                    className={`rounded-3xl p-8 shadow-2xl border ${isDark
                            ? 'bg-surface-900 border-surface-700/60 shadow-black/40'
                            : 'bg-white border-surface-200 shadow-surface-200/60'
                        }`}
                >
                    {/* Logo + Title */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
                            <ShieldCheck size={30} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">TRMS</h1>
                        <p className={`text-sm mt-1 text-center ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                            Tigray Resilient Referral Management System
                        </p>
                        <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'bg-surface-800 text-surface-400' : 'bg-surface-100 text-surface-500'}`}>
                            Authorised Personnel Only
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs animate-fade-in">
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
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
                    <div className={`mt-6 p-3 rounded-xl text-[11px] leading-relaxed ${isDark ? 'bg-surface-800/60 text-surface-500' : 'bg-surface-50 text-surface-400'}`}>
                        <strong className={isDark ? 'text-surface-400' : 'text-surface-500'}>Demo credentials: </strong>
                        admin@trms.et · liaison@trms.et · nurse@trms.et
                        <br />Password: <span className="font-mono">trms2026</span>
                    </div>
                </div>

                <p className={`text-center text-[11px] mt-4 ${isDark ? 'text-surface-600' : 'text-surface-400'}`}>
                    © 2026 TRMS — Tigray Regional Health Bureau
                </p>
            </div>
        </div>
    )
}
