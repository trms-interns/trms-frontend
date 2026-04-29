import React from 'react'

type Priority = 'emergency' | 'urgent' | 'routine'
type Status = 'draft' | 'synced' | 'pending' | 'pending_routing' | 'pending_sending' | 'pending_receiving' | 'failed' | 'accepted' | 'rejected' | 'redirected' | 'forwarded' | 'completed' | 'available' | 'limited' | 'unavailable' | 'sent'

interface Props {
    type: 'priority' | 'status' | 'sync' | 'department'
    value: Priority | Status | string
}

const config: Record<string, { bg: string; text: string; label: string }> = {
    // Priority
    emergency: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Emergency' },
    urgent: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Urgent' },
    routine: { bg: 'bg-[#2b4968]/15', text: 'text-[#2b4968]', label: 'Routine' },
    // Status
    draft: { bg: 'bg-surface-500/15', text: 'text-surface-400', label: 'Draft' },
    synced: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: '✓ Synced' },
    pending_sending: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pending Routing' },
    pending_receiving: { bg: 'bg-sky-500/15', text: 'text-sky-400', label: 'Pending Acceptance' },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', label: '✗ Failed' },
    accepted: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Accepted' },
    rejected: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Rejected' },
    redirected: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Redirected' },
    forwarded: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Forwarded' },
    completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Completed' },
    // Department
    available: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Available' },
    limited: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Limited' },
    unavailable: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Unavailable' },
}

export default function StatusBadge({ value }: Props) {
    const c = config[value] || { bg: 'bg-gray-500/15', text: 'text-gray-400', label: value }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    )
}
