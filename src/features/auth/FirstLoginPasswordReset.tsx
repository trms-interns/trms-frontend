import React, { useState } from 'react'
import { IconAlertCircle, IconCheck, IconLock } from '@tabler/icons-react'
import { trmsApi } from '../../lib/trmsApi'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export default function FirstLoginPasswordReset() {
    const { isDark } = useTheme()
    const { user, logout } = useAuth()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Please fill in all password fields.')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.')
            return
        }

        if (newPassword.trim().length < 8) {
            setError('New password must be at least 8 characters long.')
            return
        }

        try {
            setLoading(true)
            await trmsApi.changePassword({
                currentPassword,
                newPassword,
            })
            localStorage.setItem(
                'trms-auth-notice',
                'Password reset successful. Please sign in again with your new password.',
            )
            logout()
        } catch (err: any) {
            setError(err?.message || 'Failed to reset password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-surface-950' : 'bg-surface-100'}`}>
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
                <div className="mb-5">
                    <h1 className="text-xl font-semibold">Reset Your Password</h1>
                    <p className={`text-xs mt-1 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Welcome, {user?.name || user?.username}. You must change your temporary password before using TRMS.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            Current Password
                        </label>
                        <div className="relative">
                            <IconLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            New Password
                        </label>
                        <div className="relative">
                            <IconLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <IconLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                            <IconAlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                <div className={`mt-4 rounded-lg border px-3 py-2 text-[11px] ${isDark ? 'border-surface-800 bg-surface-950/50 text-surface-400' : 'border-surface-200 bg-surface-50 text-surface-600'}`}>
                    <p className="flex items-center gap-1.5">
                        <IconCheck size={12} />
                        After reset, you will sign in again with the new password.
                    </p>
                </div>
            </div>
        </div>
    )
}

