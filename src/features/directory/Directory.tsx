import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { myFacilityStaff, myFacilityEquipment } from '../../data/mockData'
import {
    IconUsers,
    IconTool,
    IconSearch,
    IconCircleCheck,
    IconAlertTriangle,
    IconClock,
} from '@tabler/icons-react'

type StaffStatus = 'available' | 'occupied' | 'off-duty'
type EquipmentStatus = 'available' | 'occupied' | 'damaged'

function StatusPill({ status }: { status: StaffStatus | EquipmentStatus }) {
    const config: Record<string, { label: string; cls: string }> = {
        available: { label: 'Available', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
        occupied: { label: 'Occupied', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
        'off-duty': { label: 'Off Duty', cls: 'bg-surface-500/15 text-surface-400 border-surface-500/25' },
        damaged: { label: 'Damaged – Needs Repair', cls: 'bg-red-500/15 text-red-500 border-red-500/25' },
    }
    const c = config[status]
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${c.cls}`}>
            {status === 'available' && <IconCircleCheck size={9} />}
            {status === 'occupied' && <IconClock size={9} />}
            {status === 'off-duty' && <IconClock size={9} />}
            {status === 'damaged' && <IconAlertTriangle size={9} />}
            {c.label}
        </span>
    )
}

export default function Directory() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const [search, setSearch] = useState('')

    const q = search.toLowerCase()
    
    // TODO (Backend Team): Replace myFacilityStaff and myFacilityEquipment with API calls to fetch real-time facility resources.
    // E.g. GET /api/facility/staff and GET /api/facility/equipment
    const filteredStaff = myFacilityStaff.filter(s =>
        s.name.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
    )
    const filteredEquip = myFacilityEquipment.filter(e =>
        e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`
    const rowBg = isDark ? 'bg-surface-900/50 hover:bg-surface-700/40' : 'bg-surface-50 hover:bg-surface-100'

    const staffAvail = myFacilityStaff.filter(s => s.status === 'available').length
    const equipAvail = myFacilityEquipment.filter(e => e.status === 'available').length
    const equipDamage = myFacilityEquipment.filter(e => e.status === 'damaged').length

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('dir.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Ayder Referral Hospital — own facility resources
                    </p>
                </div>
                {/* Summary chips */}
                <div className="flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <IconCircleCheck size={12} /> {staffAvail} staff available
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <IconCircleCheck size={12} /> {equipAvail} equipment available
                    </span>
                    {equipDamage > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                            <IconAlertTriangle size={12} /> {equipDamage} need repair
                        </span>
                    )}
                </div>
            </div>

            {/* IconSearch */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`}>
                <div className="relative flex-1">
                    <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                        type="text"
                        placeholder={t('dir.searchStaff')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-900 border-surface-700 text-surface-100 focus:border-primary-500' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* ── Health Professionals ── */}
                <div className={card}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <IconUsers size={15} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">{t('dir.staff')}</h3>
                            <p className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{filteredStaff.length} personnel</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredStaff.map(person => (
                            <div key={person.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${rowBg}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${person.status === 'available' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                                        person.status === 'occupied' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                                            'bg-gradient-to-br from-surface-500 to-surface-600'
                                    }`}>
                                    {person.name.split(' ').filter(w => !['Dr.', 'Sr.'].includes(w)).map(w => w[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{person.name}</p>
                                    <p className={`text-[10px] truncate ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        {person.role} · {person.specialty}
                                    </p>
                                    {person.note && (
                                        <p className={`text-[10px] truncate italic ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{person.note}</p>
                                    )}
                                </div>
                                <StatusPill status={person.status} />
                            </div>
                        ))}
                        {filteredStaff.length === 0 && (
                            <p className={`text-center py-6 text-sm ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>No staff match your search</p>
                        )}
                    </div>
                </div>

                {/* ── Equipment ── */}
                <div className={card}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                            <IconTool size={15} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">{t('dir.equipment')}</h3>
                            <p className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{filteredEquip.length} items</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredEquip.map(item => (
                            <div key={item.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${rowBg}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'available' ? 'bg-emerald-500/15 text-emerald-500' :
                                        item.status === 'occupied' ? 'bg-amber-500/15 text-amber-500' :
                                            'bg-red-500/15 text-red-500'
                                    }`}>
                                    <IconTool size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{item.name}</p>
                                    <p className={`text-[10px] ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{item.category}</p>
                                    {item.note && (
                                        <p className={`text-[10px] truncate italic ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{item.note}</p>
                                    )}
                                </div>
                                <StatusPill status={item.status} />
                            </div>
                        ))}
                        {filteredEquip.length === 0 && (
                            <p className={`text-center py-6 text-sm ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>No equipment match your search</p>
                        )}
                    </div>
                </div>
            </div>

            <p className={`text-center text-[11px] ${isDark ? 'text-surface-600' : 'text-surface-400'}`}>
                {t('dir.lastUpdated')}: 2026-03-19 19:00
            </p>
        </div>
    )
}
