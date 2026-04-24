import React from 'react'

export interface ToastItem {
    id: string
    type: 'success' | 'error'
    message: string
}

interface ToastStackProps {
    toasts: ToastItem[]
    onDismiss: (id: string) => void
}

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === 'success'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-red-300 bg-red-50 text-red-700'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <p>{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => onDismiss(toast.id)}
                            className="text-xs font-semibold opacity-70 hover:opacity-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
