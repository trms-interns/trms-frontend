import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { IconUser, IconLock } from '@tabler/icons-react'

export default function Profile() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()

    const card = `rounded-2xl border p-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const labelCls = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`
    const valueCls = `text-sm font-medium mt-0.5 ${isDark ? 'text-surface-200' : 'text-surface-800'}`

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <h2 className="text-2xl font-bold">{t('pro.title')}</h2>

            {/* Personal details — read only per UR-05 */}
            <div className={card}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary-500/25">
                        {user?.name
                            .split(' ')
                            .filter(w => !['Dr.', 'Sr.', 'Ato'].includes(w))
                            .map(w => w[0])
                            .join('')
                            .slice(0, 2)}
                    </div>
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
                        <p className={labelCls}>Email</p>
                        <p className={valueCls}>{user?.email}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.role')}</p>
                        <p className={valueCls}>{user?.role}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.department')}</p>
                        <p className={valueCls}>{user?.department}</p>
                    </div>
                    <div>
                        <p className={labelCls}>{t('common.facility')}</p>
                        <p className={valueCls}>{user?.facility}</p>
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

                <form onSubmit={(e) => { e.preventDefault(); alert('TODO (Backend): PATCH /api/users/me/password') }} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.currentPassword')}
                        </label>
                        <input
                            type="password"
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.newPassword')}
                        </label>
                        <input
                            type="password"
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {t('pro.confirmPassword')}
                        </label>
                        <input
                            type="password"
                            className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
                    >
                        {/* TODO (Backend Team): PATCH /api/users/me/password { currentPassword, newPassword } */}
                        {t('pro.changePassword')}
                    </button>
                </form>
            </div>
        </div>
    )
}
