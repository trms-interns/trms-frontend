export interface Referral {
    id: string
    patientName: string
    mrn: string
    age: number
    sex: 'Male' | 'Female'
    referringFacility: string
    receivingFacility: string
    priority: 'emergency' | 'urgent' | 'routine'
    status: 'synced' | 'pending' | 'failed' | 'accepted' | 'rejected' | 'redirected' | 'completed'
    chiefComplaint: string
    clinicalSummary: string
    date: string
    hasImage: boolean
}

export interface Facility {
    id: string
    name: string
    location: string
    type: string
    lastSync: string
    departments: Department[]
}

export interface Department {
    name: string
    status: 'available' | 'limited' | 'unavailable'
    note?: string
}



export interface AuditEntry {
    id: string
    user: string
    action: string
    recordId: string
    timestamp: string
}

export interface TriageAction {
    id: string
    referralId: string
    patientName: string
    action: 'accepted' | 'rejected' | 'redirected'
    by: string
    timestamp: string
    note?: string
}

export interface StaffMember {
    id: string
    name: string
    role: string
    specialty: string
    status: 'available' | 'occupied' | 'off-duty'
    note?: string
}

export interface Equipment {
    id: string
    name: string
    category: string
    status: 'available' | 'occupied' | 'damaged'
    note?: string
}

// Own-facility resources
export const myFacilityStaff: StaffMember[] = [
    { id: 'STF-001', name: 'Dr. Amanuel Hailu', role: 'Physician', specialty: 'Internal Medicine', status: 'available' },
    { id: 'STF-002', name: 'Dr. Sara Gebrekidan', role: 'Surgeon', specialty: 'General Surgery', status: 'occupied', note: 'In OR — appendectomy' },
    { id: 'STF-003', name: 'Dr. Mekdes Tesfaye', role: 'Physician', specialty: 'Obstetrics/Gynecology', status: 'available' },
    { id: 'STF-004', name: 'Dr. Yonas Berhe', role: 'Physician', specialty: 'Pediatrics', status: 'off-duty', note: 'On leave until tomorrow' },
    { id: 'STF-005', name: 'Dr. Fana Weldu', role: 'Physician', specialty: 'Emergency Medicine', status: 'available' },
    { id: 'STF-006', name: 'Sr. Miriam Tsegay', role: 'Senior Nurse', specialty: 'ICU', status: 'occupied', note: 'Attending ICU patient' },
    { id: 'STF-007', name: 'Sr. Hiwot Gebru', role: 'Senior Nurse', specialty: 'Maternity Ward', status: 'available' },
    { id: 'STF-008', name: 'Sr. Tigist Haile', role: 'Nurse', specialty: 'Emergency', status: 'available' },
    { id: 'STF-009', name: 'Sr. Letay Kebede', role: 'Nurse', specialty: 'Pediatrics', status: 'off-duty', note: 'Night shift starts 20:00' },
    { id: 'STF-010', name: 'Sr. Almaz Gebre', role: 'Midwife', specialty: 'Labor & Delivery', status: 'occupied', note: 'Assisting delivery' },
]

export const myFacilityEquipment: Equipment[] = [
    { id: 'EQP-001', name: 'CT Scanner', category: 'Imaging', status: 'available' },
    { id: 'EQP-002', name: 'X-Ray Machine (Room 2)', category: 'Imaging', status: 'occupied', note: 'Patient imaging in progress' },
    { id: 'EQP-003', name: 'X-Ray Machine (Room 4)', category: 'Imaging', status: 'damaged', note: 'Faulty detector — repair requested 2026-03-17' },
    { id: 'EQP-004', name: 'Operating Theatre 1', category: 'Surgery', status: 'occupied', note: 'Active surgery underway' },
    { id: 'EQP-005', name: 'Operating Theatre 2', category: 'Surgery', status: 'available' },
    { id: 'EQP-006', name: 'Ultrasound Unit A', category: 'Imaging', status: 'available' },
    { id: 'EQP-007', name: 'Ultrasound Unit B', category: 'Imaging', status: 'damaged', note: 'Probe malfunction — awaiting spare part' },
    { id: 'EQP-008', name: 'Ventilator (ICU Bed 1)', category: 'Critical Care', status: 'occupied', note: 'ICU patient on ventilator support' },
    { id: 'EQP-009', name: 'Ventilator (ICU Bed 2)', category: 'Critical Care', status: 'available' },
    { id: 'EQP-010', name: 'ECG Machine', category: 'Cardiac', status: 'available' },
    { id: 'EQP-011', name: 'Defibrillator', category: 'Cardiac', status: 'available' },
    { id: 'EQP-012', name: 'Blood Analyser', category: 'Laboratory', status: 'damaged', note: 'Calibration failure — technician scheduled' },
    { id: 'EQP-013', name: 'Autoclave Steriliser', category: 'Sterilisation', status: 'available' },
    { id: 'EQP-014', name: 'Infusion Pump Set (×8)', category: 'IV Therapy', status: 'available' },
]

// --- Mock Data ---

export const mockReferrals: Referral[] = [
    {
        id: 'REF-001',
        patientName: 'Terhas Hailu',
        mrn: 'MRN-20240112',
        age: 28,
        sex: 'Female',
        referringFacility: 'Shire Health Center',
        receivingFacility: 'Axum St. Mary Hospital',
        priority: 'emergency',
        status: 'synced',
        chiefComplaint: 'Pre-eclampsia — high blood pressure at 36 weeks gestation',
        clinicalSummary: 'BP 160/110. Proteinuria 2+. Severe headache and blurred vision. Fundal height consistent with dates. FHR 142 bpm. Patient requires immediate obstetric evaluation.',
        date: '2026-03-08',
        hasImage: true,
    },
    {
        id: 'REF-002',
        patientName: 'Gebremariam Kahsay',
        mrn: 'MRN-20240089',
        age: 45,
        sex: 'Male',
        referringFacility: 'Adwa Health Center',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'urgent',
        status: 'pending',
        chiefComplaint: 'Suspected appendicitis',
        clinicalSummary: 'Right lower quadrant pain for 2 days. McBurney point tenderness. WBC elevated. No peritoneal signs yet. Needs surgical consultation.',
        date: '2026-03-08',
        hasImage: false,
    },
    {
        id: 'REF-003',
        patientName: 'Lemlem Berhe',
        mrn: 'MRN-20240201',
        age: 62,
        sex: 'Female',
        referringFacility: 'Wukro Health Center',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'routine',
        status: 'completed',
        chiefComplaint: 'Diabetes follow-up — uncontrolled blood sugar',
        clinicalSummary: 'FBS 280mg/dl despite metformin 1g BD. HbA1c needed. Tingling in feet suggests early neuropathy. Requires endocrinology review.',
        date: '2026-03-07',
        hasImage: false,
    },
    {
        id: 'REF-004',
        patientName: 'Tekle Hadgu',
        mrn: 'MRN-20240156',
        age: 8,
        sex: 'Male',
        referringFacility: 'Adigrat Health Center',
        receivingFacility: 'Adigrat General Hospital',
        priority: 'emergency',
        status: 'accepted',
        chiefComplaint: 'Severe dehydration — acute diarrhea',
        clinicalSummary: 'Watery diarrhea x3 days, vomiting. Sunken eyes, poor skin turgor. Unable to keep ORS down. IV rehydration and stool culture needed.',
        date: '2026-03-08',
        hasImage: false,
    },
    {
        id: 'REF-005',
        patientName: 'Mulu Gebremedhin',
        mrn: 'MRN-20240178',
        age: 35,
        sex: 'Female',
        referringFacility: 'Enticho Health Center',
        receivingFacility: 'Shire Suhul Hospital',
        priority: 'urgent',
        status: 'failed',
        chiefComplaint: 'Post-partum hemorrhage',
        clinicalSummary: 'Delivered 6 hours ago. Continued heavy bleeding. Uterus boggy on palpation. Oxytocin given IM. Needs emergency obstetric care.',
        date: '2026-03-08',
        hasImage: true,
    },
    {
        id: 'REF-006',
        patientName: 'Kidane Abrha',
        mrn: 'MRN-20240199',
        age: 52,
        sex: 'Male',
        referringFacility: 'Axum Health Center',
        receivingFacility: 'Axum St. Mary Hospital',
        priority: 'routine',
        status: 'synced',
        chiefComplaint: 'Chronic cough — suspected TB',
        clinicalSummary: 'Productive cough 4 weeks, night sweats, weight loss 5kg. Sputum AFB smear needed. HIV status unknown. Contact history positive.',
        date: '2026-03-07',
        hasImage: false,
    },
    {
        id: 'REF-007',
        patientName: 'Selam Hagos',
        mrn: 'MRN-20240215',
        age: 19,
        sex: 'Female',
        referringFacility: 'Zalambessa Health Center',
        receivingFacility: 'Adigrat General Hospital',
        priority: 'urgent',
        status: 'pending',
        chiefComplaint: 'Trauma — road traffic accident',
        clinicalSummary: 'Fall from motorcycle. Deep laceration right forearm, possible fracture. Bleeding controlled with pressure dressing. Tetanus status unknown.',
        date: '2026-03-08',
        hasImage: true,
    },
    {
        id: 'REF-008',
        patientName: 'Berhane Weldu',
        mrn: 'MRN-20240230',
        age: 71,
        sex: 'Male',
        referringFacility: 'Neblet Health Center',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'routine',
        status: 'synced',
        chiefComplaint: 'Vision loss — suspected cataract',
        clinicalSummary: 'Progressive bilateral vision loss 1 year. Unable to perform daily activities. Visual acuity: R 6/36, L 6/60. Lens opacity noted. Ophthalmology referral.',
        date: '2026-03-06',
        hasImage: true,
    },
]

export const mockFacilities: Facility[] = [
    {
        id: 'FAC-001',
        name: 'Ayder Referral Hospital',
        location: 'Mekelle',
        type: 'Tertiary / Referral Hospital',
        lastSync: '2026-03-08 08:30',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'available' },
            { name: 'Surgery', status: 'limited', note: 'Only 1 OR functional' },
            { name: 'Pediatrics', status: 'available' },
            { name: 'Internal Medicine', status: 'available' },
            { name: 'Ophthalmology', status: 'available' },
            { name: 'CT Scanner', status: 'available' },
            { name: 'X-Ray', status: 'available' },
        ],
    },
    {
        id: 'FAC-002',
        name: 'Axum St. Mary Hospital',
        location: 'Axum',
        type: 'General Hospital',
        lastSync: '2026-03-08 07:15',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'available' },
            { name: 'Surgery', status: 'available' },
            { name: 'Pediatrics', status: 'limited', note: '2 beds remaining' },
            { name: 'Internal Medicine', status: 'available' },
            { name: 'X-Ray', status: 'unavailable', note: 'Machine under repair' },
        ],
    },
    {
        id: 'FAC-003',
        name: 'Shire Suhul Hospital',
        location: 'Shire',
        type: 'General Hospital',
        lastSync: '2026-03-08 06:45',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'unavailable', note: 'Ward full' },
            { name: 'Surgery', status: 'limited', note: 'Surgeon unavailable until Mon' },
            { name: 'Pediatrics', status: 'available' },
            { name: 'Internal Medicine', status: 'available' },
            { name: 'X-Ray', status: 'available' },
        ],
    },
    {
        id: 'FAC-004',
        name: 'Adigrat General Hospital',
        location: 'Adigrat',
        type: 'General Hospital',
        lastSync: '2026-03-07 22:00',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'available' },
            { name: 'Surgery', status: 'available' },
            { name: 'Pediatrics', status: 'available' },
            { name: 'X-Ray', status: 'unavailable', note: 'Equipment failure' },
            { name: 'Laboratory', status: 'limited', note: 'Reagent shortage' },
        ],
    },
    {
        id: 'FAC-005',
        name: 'Adwa General Hospital',
        location: 'Adwa',
        type: 'General Hospital',
        lastSync: '2026-03-08 05:00',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'available' },
            { name: 'Surgery', status: 'unavailable', note: 'No orthopedic surgeon' },
            { name: 'Pediatrics', status: 'available' },
            { name: 'X-Ray', status: 'available' },
        ],
    },
    {
        id: 'FAC-006',
        name: 'Wukro General Hospital',
        location: 'Wukro',
        type: 'General Hospital',
        lastSync: '2026-03-08 09:00',
        departments: [
            { name: 'Emergency', status: 'available' },
            { name: 'Obstetrics/Gynecology', status: 'limited', note: '1 midwife on duty' },
            { name: 'Internal Medicine', status: 'available' },
            { name: 'Pediatrics', status: 'available' },
            { name: 'X-Ray', status: 'available' },
            { name: 'Laboratory', status: 'available' },
        ],
    },
]



export const mockAuditLog: AuditEntry[] = [
    { id: 'AUD-001', user: 'Ato Gebre (Liaison)', action: 'Viewed referral details', recordId: 'REF-001', timestamp: '2026-03-08 09:15' },
    { id: 'AUD-002', user: 'Sr. Yordanos (Nurse)', action: 'Reviewed triage queue', recordId: 'TRI-005', timestamp: '2026-03-08 08:45' },
    { id: 'AUD-003', user: 'Dr. Hagos (Admin)', action: 'Exported analytics report', recordId: 'RPT-003', timestamp: '2026-03-08 08:00' },
    { id: 'AUD-004', user: 'Ato Gebre (Liaison)', action: 'Accepted referral', recordId: 'REF-004', timestamp: '2026-03-08 07:30' },
    { id: 'AUD-005', user: 'System', action: 'Auto-synced 12 referrals', recordId: 'SYNC-008', timestamp: '2026-03-08 06:00' },
    { id: 'AUD-006', user: 'Sr. Meron (Nurse)', action: 'Updated patient demographics', recordId: 'REF-003', timestamp: '2026-03-07 16:20' },
    { id: 'AUD-007', user: 'Dr. Hagos (Admin)', action: 'Reviewed access logs', recordId: 'AUD-REVIEW', timestamp: '2026-03-07 15:00' },
]

export const mockTriageActions: TriageAction[] = [
    { id: 'TA-001', referralId: 'REF-004', patientName: 'Tekle Hadgu', action: 'accepted', by: 'Ato Gebre', timestamp: '2026-03-08 07:30', note: 'Immediate admission — pediatric ward' },
    { id: 'TA-002', referralId: 'REF-003', patientName: 'Lemlem Berhe', action: 'accepted', by: 'Dr. Amanuel', timestamp: '2026-03-07 14:00', note: 'Routine endocrinology appointment scheduled' },
    { id: 'TA-003', referralId: 'REF-009', patientName: 'Hailu Mesfin', action: 'rejected', by: 'Ato Gebre', timestamp: '2026-03-07 11:00', note: 'Insufficient clinical information. Requested BP trend and urine analysis.' },
    { id: 'TA-004', referralId: 'REF-010', patientName: 'Tsige Weldegebriel', action: 'redirected', by: 'Dr. Sara', timestamp: '2026-03-07 09:45', note: 'Redirected from Surgery to Orthopedics' },
]

// Chart data
export const referralTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
        {
            label: 'Referrals',
            data: [12, 19, 8, 15, 22, 9, 14],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
        },
    ],
}

export const referralVolumeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Referrals',
            data: [145, 189, 210, 178, 230, 195],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.4,
        },
    ],
}

export const topReasonsData = {
    labels: ['Obstetric Emergency', 'Surgical Consult', 'Pediatric Acute', 'TB/HIV Follow-up', 'Trauma'],
    datasets: [
        {
            label: 'Referrals',
            data: [68, 45, 38, 32, 27],
            backgroundColor: [
                '#ef4444',
                '#f59e0b',
                '#3b82f6',
                '#10b981',
                '#8b5cf6',
            ],
            borderRadius: 6,
        },
    ],
}

export const rejectionRateData = {
    labels: ['Ayder', 'Axum St. Mary', 'Shire Suhul', 'Adigrat', 'Adwa'],
    datasets: [
        {
            label: 'Rejection Rate %',
            data: [8, 12, 22, 18, 5],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(139, 92, 246, 0.8)',
            ],
        },
    ],
}
