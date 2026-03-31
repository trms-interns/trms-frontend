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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className={`w-full ${maxWidth} rounded-2xl shadow-2xl border animate-fade-in ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
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
                <div className="p-5">{children}</div>
            </div>
        </div>
    )
}
