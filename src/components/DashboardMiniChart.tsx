import React from 'react'
import { useTheme } from '../context/ThemeContext'

interface ChartItem {
    label: string
    value: number
    colorClass: string
}

interface DashboardMiniChartProps {
    title: string
    data: ChartItem[]
}

export default function DashboardMiniChart({ title, data }: DashboardMiniChartProps) {
    const { isDark } = useTheme()
    const total = Math.max(
        data.reduce((sum, item) => sum + item.value, 0),
        1,
    )
    let cumulativePercent = 0
    const pieSegments = data.map((item) => {
        const start = cumulativePercent
        const percent = (item.value / total) * 100
        cumulativePercent += percent
        const end = cumulativePercent
        return `${item.colorClass.includes('primary') ? '#2b4968' : item.colorClass.includes('emerald') ? '#10b981' : item.colorClass.includes('amber') ? '#f59e0b' : item.colorClass.includes('red') ? '#ef4444' : item.colorClass.includes('purple') ? '#8b5cf6' : '#64748b'} ${start}% ${end}%`
    })
    const pieBackground = `conic-gradient(${pieSegments.join(', ')})`

    return (
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
            <h3 className="text-sm font-semibold mb-4">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                        <div
                            className="w-full h-full rounded-full"
                            style={{ background: pieBackground }}
                        />
                        <div className={`absolute inset-5 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-surface-900 text-surface-200' : 'bg-white text-surface-700'}`}>
                            Total: {total}
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {data.map((item) => {
                        const percent = Math.round((item.value / total) * 100)
                        return (
                            <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.colorClass}`} />
                                    <span className={`${isDark ? 'text-surface-300' : 'text-surface-700'} truncate`}>
                                        {item.label}
                                    </span>
                                </div>
                                <span className={`${isDark ? 'text-surface-400' : 'text-surface-500'} shrink-0`}>
                                    {item.value} ({percent}%)
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
