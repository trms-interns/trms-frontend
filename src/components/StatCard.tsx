import React, { type ReactNode } from 'react'

interface Props {
    icon: ReactNode
    label: string
    value: string | number
    trend?: string
    trendUp?: boolean
    color?: string
}

export default function StatCard({ icon, label, value, trend, trendUp, color = 'from-primary-600 to-primary-700' }: Props) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl opacity-[0.03] dark:opacity-[0.06] rounded-bl-full" style={{ backgroundImage: `linear-gradient(to bottom left, var(--color-primary-500), transparent)` }} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{label}</p>
                    <p className="text-3xl font-bold mt-1 text-surface-900 dark:text-white">{value}</p>
                    {trend && (
                        <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-emerald-500' : 'text-red-400'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </p>
                    )}
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shadow-primary-500/20`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
