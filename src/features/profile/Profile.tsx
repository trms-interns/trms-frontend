import React, { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { IconLock } from '@tabler/icons-react'
import { getUserInitials, trmsApi } from '../../lib/trmsApi'

export default function Profile() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const [facilityProfileImageUrl, setFacilityProfileImageUrl] = useState('')
    const [resolvedFacilityName, setResolvedFacilityName] = useState('')
    const [resolvedDepartmentName, setResolvedDepartmentName] = useState('')
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const card = `rounded-2xl border p-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const labelCls = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`
    const valueCls = `text-sm font-medium mt-0.5 ${isDark ? 'text-surface-200' : 'text-surface-800'}`
    const resolveBackendAssetUrl = (value?: string) => {
        if (!value) return ''
        if (value.startsWith('http://') || value.startsWith('https://')) return value

        const base = import.meta.env.VITE_API_BASE_URL
        if (typeof base === 'string' && base.startsWith('http')) {
            try {
                return new URL(value, base).toString()
            } catch {
                return value
            }
        }
        return value
    }

    useEffect(() => {
        const loadFacility = async () => {
            if (!user?.facilityId || user?.profileImageUrl) {
                setFacilityProfileImageUrl('')
                return
            }
            try {
                const result: any = await trmsApi.getFacility(user.facilityId)
                const imageUrl =
                    result?.profileImageUrl ||
                    result?.facility?.profileImageUrl ||
                    ''
                setFacilityProfileImageUrl(imageUrl)
            } catch {
                setFacilityProfileImageUrl('')
            }
        }
        void loadFacility()
    }, [user?.facilityId, user?.profileImageUrl])

    const effectiveProfileImageUrl = user?.profileImageUrl || facilityProfileImageUrl
    const effectiveFacilityName = resolvedFacilityName || user?.facility || '—'
    const effectiveDepartmentName = resolvedDepartmentName || user?.department || '—'

    useEffect(() => {
        const loadDisplayNames = async () => {
            try {
                if (user?.facilityId) {
                    const facilityResult: any = await trmsApi.getFacility(user.facilityId)
                    const nextFacilityName = facilityResult?.name || facilityResult?.facility?.name || ''
                    setResolvedFacilityName(nextFacilityName)
                } else {
                    setResolvedFacilityName('')
                }

                if (user?.departmentId) {
                    const departmentResult: any = await trmsApi.getDepartment(user.departmentId)
                    setResolvedDepartmentName(departmentResult?.name || '')
                } else {
                    setResolvedDepartmentName('')
                }
            } catch {
                setResolvedFacilityName('')
                setResolvedDepartmentName('')
            }
        }

        void loadDisplayNames()
    }, [user?.facilityId, user?.departmentId])

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('Please fill in all password fields.')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New password and confirmation do not match.')
            return
        }
        try {
            setPasswordSaving(true)
            setPasswordError('')
            setPasswordMessage('')
            await trmsApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            setPasswordMessage('Password changed successfully.')
        } catch (error: any) {
            setPasswordError(error?.message || 'Failed to change password.')
        } finally {
            setPasswordSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <h2 className="text-2xl font-bold">{t('pro.title')}</h2>

            {/* Personal details — read only per UR-05 */}
            <div className={card}>
                <div className="flex items-center gap-4 mb-6">
                    {effectiveProfileImageUrl ? (
                        <img
                            src={resolveBackendAssetUrl(effectiveProfileImageUrl)}
                            alt={`${user?.name || 'User'} profile`}
                            className="w-14 h-14 rounded-xl object-cover border border-surface-300"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary-500/25">
                            {user?.name ? getUserInitials(user.name) : 'TR'}
                        </div>
                    )}
                    <div>
                        <p className="text-lg font-bold">{user?.name}</p>
                        <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{user?.role}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <p className={labelCls}>{t('common.name')}</p>
                        <p className={valueCls}>{user?.name}</p>
                    </div>
                    <div>
                        <p className={labelCls}>Username</p>
                        <p className={valueCls}>{user?.username}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.role')}</p>
                        <p className={valueCls}>{user?.role}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.department')}</p>
                        <p className={valueCls}>{effectiveDepartmentName}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.facility')}</p>
                        <p className={valueCls}>{effectiveFacilityName}</p>
                    </div>
                </div>

                <p className={`text-[10px] mt-5 pt-4 border-t ${isDark ? 'text-surface-600 border-surface-800' : 'text-surface-400 border-surface-200'}`}>
                    These details are managed by your Department Head. Contact them for changes.
                </p>
            </div>

            {/* Change password — UR-05 */}
            <div className={card}>
                <div className="flex items-center gap-2 mb-5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/15 text-primary-300' : 'bg-primary-100 text-primary-600'}`}>
                        <IconLock size={15} />
                    </div>
                    <h3 className="text-sm font-bold">{t('pro.changePassword')}</h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.currentPassword')}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                                setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))
                                setPasswordError('')
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.newPassword')}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => {
                                setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))
                                setPasswordError('')
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.confirmPassword')}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => {
                                setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))
                                setPasswordError('')
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    {passwordError && (
                        <p className="text-xs text-red-500 font-medium">{passwordError}</p>
                    )}
                    {passwordMessage && (
                        <p className="text-xs text-emerald-500 font-medium">{passwordMessage}</p>
                    )}
                    <button
                        type="submit"
                        disabled={passwordSaving}
                        className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                    >
                        {passwordSaving ? 'Changing...' : t('pro.changePassword')}
                    </button>
                </form>
            </div>
        </div>
    )
}
