import React, { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { trmsApi, type ApiUser } from '../../lib/trmsApi'
import { useReferrals } from '../../context/ReferralContext'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'
import {
    IconUsers,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconKey,
    IconClipboardList,
} from '@tabler/icons-react'

export default function DeptHeadDashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals } = useReferrals()
    const [tab, setTab] = useState<'users' | 'referrals'>('users')
    const [showAddUser, setShowAddUser] = useState(false)
    const [users, setUsers] = useState<ApiUser[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingUser, setCreatingUser] = useState(false)
    const [addUserError, setAddUserError] = useState('')
    const [newUser, setNewUser] = useState({
        fullName: '',
        role: 'doctor' as 'doctor' | 'liaison_officer' | 'hew',
        initialPassword: '',
    })

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await trmsApi.getUsers(user?.facilityId)
            setUsers(data)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadUsers()
    }, [user?.facilityId])

    const resetAddUserForm = () => {
        setNewUser({
            fullName: '',
            role: 'doctor',
            initialPassword: '',
        })
        setAddUserError('')
    }

    const handleCreateUser = async () => {
        if (!newUser.fullName.trim() || !newUser.role || !newUser.initialPassword.trim()) {
            setAddUserError('Please fill in all required fields.')
            return
        }
        if (!user?.facilityId || !user?.departmentId) {
            setAddUserError('Your account is missing facility or department assignment.')
            return
        }

        try {
            setCreatingUser(true)
            setAddUserError('')
            await trmsApi.createUser({
                fullName: newUser.fullName.trim(),
                role: newUser.role,
                departmentId: user.departmentId,
                facilityId: user.facilityId,
                initialPassword: newUser.initialPassword,
            })
            await loadUsers()
            setShowAddUser(false)
            resetAddUserForm()
        } catch (error: any) {
            setAddUserError(error?.message || 'Failed to create user.')
        } finally {
            setCreatingUser(false)
        }
    }

    // Users managed by the department head in this department
    const deptUsers = users.filter(
        (u) =>
            u.departmentId === user?.departmentId &&
            u.id !== user?.id &&
            ['doctor', 'hew', 'liaison_officer'].includes(u.role),
    )
    // Referrals for this department
    const deptReferrals = referrals.filter(r => r.department === user?.department)

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('dh.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {user?.department} — {user?.facility}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
                        <span className="flex items-center gap-1.5"><IconUsers size={14} />{t('dh.users')}</span>
                    </button>
                    <button onClick={() => setTab('referrals')} className={tabCls(tab === 'referrals')}>
                        <span className="flex items-center gap-1.5"><IconClipboardList size={14} />{t('dh.referralOverview')}</span>
                    </button>
                </div>
            </div>

            {tab === 'users' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <IconUsers size={15} className="text-primary-400" />
                            {t('dh.users')} ({deptUsers.length})
                        </h3>
                        <button
                            onClick={() => {
                                resetAddUserForm()
                                setShowAddUser(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                            <IconPlus size={13} /> {t('dh.addUser')}
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-surface-500">Loading users...</p>
                    ) : deptUsers.length === 0 ? (
                        <p className="text-sm text-surface-500">No users in this department</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.name')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.role')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.status')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.lastLogin')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deptUsers.map(u => (
                                    <tr key={u.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {u.fullName.split(' ').filter(w => !['Dr.', 'Sr.', 'Ato'].includes(w)).map(w => w[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="font-medium">{u.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-surface-400">{u.role}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.active
                                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                : 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                            }`}>
                                                {u.active ? <><IconCircleCheck size={9} /> {t('common.active')}</> : <>{t('common.inactive')}</>}
                                            </span>
                                        </td>
                                        <td className="py-3 text-surface-500">{u.lastLogin || '—'}</td>
                                        <td className="py-3">
                                            <div className="flex gap-1">
                                                <button className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`} title="Edit">
                                                    <IconEdit size={13} />
                                                </button>
                                                <button className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`} title="Reset Password">
                                                    <IconKey size={13} />
                                                </button>
                                                <button className={`p-1.5 rounded-lg transition-colors ${u.active
                                                    ? 'hover:bg-red-500/10 text-red-400'
                                                    : 'hover:bg-emerald-500/10 text-emerald-400'
                                                }`} title={u.active ? 'Disable' : 'Enable'}>
                                                    {u.active ? <IconCircleX size={13} /> : <IconCircleCheck size={13} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            )}

            {tab === 'referrals' && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-4">Department Referrals ({deptReferrals.length})</h3>
                    {deptReferrals.length === 0 ? (
                        <p className="text-sm text-surface-500 text-center py-6">{t('common.noData')}</p>
                    ) : (
                        <div className="space-y-2">
                            {deptReferrals.map(ref => (
                                <div key={ref.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-surface-950' : 'bg-surface-50'}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${ref.priority === 'emergency' ? 'bg-red-500' : ref.priority === 'urgent' ? 'bg-amber-500' : 'bg-[#2b4968]'}`}>
                                        {ref.patientName.split(' ').map(w => w[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ref.patientName}</p>
                                        <p className="text-xs text-surface-500 truncate">{ref.chiefComplaint}</p>
                                    </div>
                                    <StatusBadge type="priority" value={ref.priority} />
                                    <StatusBadge type="sync" value={ref.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <Modal
                    title={t('dh.addUser')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddUser(false)
                        resetAddUserForm()
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleCreateUser()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Full Name"
                            required
                            placeholder="e.g. Dr. Berhe Tadesse"
                            value={newUser.fullName}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, fullName: e.target.value }))
                                setAddUserError('')
                            }}
                        />
                        <FormField
                            label="Role"
                            as="select"
                            required
                            value={newUser.role}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, role: e.target.value as typeof current.role }))
                                setAddUserError('')
                            }}
                            options={[
                                { value: 'doctor', label: 'Doctor' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                                { value: 'hew', label: 'Health Extension Worker' },
                            ]}
                        />
                        <FormField
                            label="Initial Password"
                            type="password"
                            required
                            placeholder="Set a temporary password"
                            value={newUser.initialPassword}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, initialPassword: e.target.value }))
                                setAddUserError('')
                            }}
                        />
                        <p className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
                            Department: <strong>{user?.department}</strong> · Facility: <strong>{user?.facility}</strong> (auto-assigned)
                        </p>
                        {addUserError && (
                            <p className="text-xs text-red-500 font-medium">{addUserError}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={creatingUser}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {creatingUser ? 'Creating...' : 'Create User'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddUser(false)
                                    resetAddUserForm()
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}
