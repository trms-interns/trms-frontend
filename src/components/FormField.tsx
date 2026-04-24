import React, { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { useTheme } from '../context/ThemeContext'

interface BaseProps {
    label: string
    error?: string
    required?: boolean
    hint?: string
    children?: ReactNode
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea'; rows?: number }
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { as: 'select'; options: { value: string; label: string }[] }

type FormFieldProps = InputProps | TextareaProps | SelectProps

export default function FormField(props: FormFieldProps) {
    const { isDark } = useTheme()
    const { label, error, required, hint, as = 'input', ...rest } = props

    const base = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark
        ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400'
        : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'
        } ${error ? '!border-red-500 focus:!border-red-500' : ''}`

    return (
        <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {as === 'textarea' ? (
                <textarea
                    className={`${base} resize-none leading-relaxed`}
                    rows={(props as TextareaProps).rows ?? 3}
                    {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : as === 'select' ? (
                <select className={base} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
                    <option value="">Select…</option>
                    {(props as SelectProps).options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : (
                <input className={base} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
            )}

            {hint && !error && (
                <p className={`text-[11px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{hint}</p>
            )}
            {error && (
                <p className="text-[11px] text-red-500 font-medium">{error}</p>
            )}
        </div>
    )
}
