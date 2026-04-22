import React, { type ReactNode } from 'react'
import { useTheme } from '../context/ThemeContext'
import { IconX } from '@tabler/icons-react'

interface ModalProps {
    title: string
    icon?: ReactNode
    children: ReactNode
    onClose: () => void
    maxWidth?: string
}

export default function Modal({ title, icon, children, onClose, maxWidth = 'max-w-lg' }: ModalProps) {
    const { isDark } = useTheme()
    return (
        <div
            className={`fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:pt-20 ${isDark ? 'bg-surface-950/70' : 'bg-surface-900/35'}`}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl border animate-fade-in ${isDark ? 'bg-surface-900 border-surface-700 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]' : 'bg-white border-surface-200 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]'}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-700' : 'border-surface-100'}`}>
                    <div className="flex items-center gap-2.5">
                        {icon}
                        <h3 className="text-base font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-700/60 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                    >
                        <IconX size={16} />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[calc(90vh-73px)]">{children}</div>
            </div>
        </div>
    )
}
