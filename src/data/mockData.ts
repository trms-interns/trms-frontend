// ─── Core entity interfaces ───────────────────────────────────────────────────

export type UserRole =
    | 'System Administrator'
    | 'Facility Administrator'
    | 'Department Head'
    | 'Liaison Officer'
    | 'Doctor'
    | 'HEW'

export interface SystemUser {
    id: string
    fullName: string
    email: string
    role: UserRole
    department: string
    facility: string
    active: boolean
    lastLogin?: string
}

export interface Facility {
    id: string
    name: string
    location: string
    type: string
    contact?: string
    lastSync: string
    departments: Department[]
    facilityAdminId?: string
}

export interface Department {
    id: string
    name: string
    facilityId: string
    status: 'available' | 'limited' | 'unavailable'
    estimatedDelayDays?: number
    note?: string
    headId?: string
}

export interface Patient {
    id: string
    fullName: string
    dateOfBirth: string
    gender: 'Male' | 'Female' | 'Other'
    phoneNumber?: string
    address?: string
}

export interface ConsentRecord {
    id: string
    patientId: string
    grantedByUserId: string
    grantedAt: string
    consentText: string
}

export interface Referral {
    id: string
    patientId: string
    patientName: string
    mrn: string
    age: number
    sex: 'Male' | 'Female'
    dateOfBirth?: string
    phone?: string
    referringFacilityId?: string
    referringFacility: string
    referringUserId?: string
    referringUserName?: string
    referringUserDepartment?: string
    referringUserPhone?: string
    referringUserEmail?: string
    receivingFacilityId?: string
    receivingFacility: string
    receivingDepartmentId?: string
    priority: 'emergency' | 'urgent' | 'routine'
    status: 'draft' | 'pending' | 'synced' | 'failed' | 'accepted' | 'rejected' | 'forwarded' | 'completed'
    chiefComplaint: string
    clinicalSummary: string
    primaryDiagnosis?: string
    treatmentGiven?: string
    reasonForReferral?: string
    vitalSigns?: string
    allergies?: string
    pastMedicalHistory?: string
    currentMedications?: string
    consentRecordId?: string
    forwardedFromReferralId?: string
    forwardingNote?: string
    appointmentDate?: string
    clinicianAcceptedAt?: string
    acceptedByUserId?: string
    acceptedByUserName?: string
    acceptedByUserDepartment?: string
    acceptedByUserPhone?: string
    acceptedByUserEmail?: string
    rejectedByUserId?: string
    rejectedByUserName?: string
    rejectedByUserDepartment?: string
    rejectedByUserPhone?: string
    rejectedByUserEmail?: string
    estimatedWaitingTime?: string
    rejectionReason?: string
    date: string
    hasImage: boolean
    department?: string
}

export interface DischargeSummary {
    id: string
    referralId: string
    patientName: string
    treatmentSummary: string
    finalDiagnosis: string
    medicationsPrescribed: string
    followUpInstructions: string
    dischargeDate: string
    createdByUserId: string
    createdByName: string
    createdAt: string
}

export interface AuditEntry {
    id: string
    userId: string
    user: string
    action: string
    recordId: string
    timestamp: string
    ipAddress?: string
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

// ─── Mock System Users ─────────────────────────────────────────────────────────

export const mockSystemUsers: SystemUser[] = [
    { id: 'USR-001', fullName: 'Dr. Hagos Gebremichael', email: 'sys_admin@trms.et', role: 'System Administrator', department: 'IT Administration', facility: 'Regional Health Bureau', active: true, lastLogin: '2026-03-27 09:00' },
    { id: 'USR-002', fullName: 'Ato Kibrom Hailu', email: 'facility_admin@trms.et', role: 'Facility Administrator', department: 'Administration', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 08:30' },
    { id: 'USR-003', fullName: 'Dr. Mekdes Tesfaye', email: 'dept_head@trms.et', role: 'Department Head', department: 'Obstetrics/Gynecology', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 08:15' },
    { id: 'USR-004', fullName: 'Ato Gebre Tesfay', email: 'liaison@trms.et', role: 'Liaison Officer', department: 'Liaison Office', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 07:45' },
    { id: 'USR-005', fullName: 'Dr. Amanuel Hailu', email: 'doctor@trms.et', role: 'Doctor', department: 'Internal Medicine', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 07:00' },
    { id: 'USR-006', fullName: 'Sr. Yordanos Tekle', email: 'nurse@trms.et', role: 'Liaison Officer', department: 'Emergency', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 06:50' },
    { id: 'USR-007', fullName: 'Dr. Sara Gebrekidan', email: 'sara@trms.et', role: 'Doctor', department: 'General Surgery', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-26 22:00' },
    { id: 'USR-008', fullName: 'Dr. Yonas Berhe', email: 'yonas@trms.et', role: 'Doctor', department: 'Pediatrics', facility: 'Ayder Referral Hospital', active: false, lastLogin: '2026-03-25 14:00' },
    { id: 'USR-009', fullName: 'Sr. Miriam Tsegay', email: 'miriam@trms.et', role: 'Liaison Officer', department: 'ICU', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 05:30' },
    { id: 'USR-010', fullName: 'Dr. Fana Weldu', email: 'fana@trms.et', role: 'Doctor', department: 'Emergency Medicine', facility: 'Ayder Referral Hospital', active: true, lastLogin: '2026-03-27 08:00' },
]

// ─── Mock Facilities ──────────────────────────────────────────────────────────

export const mockFacilities: Facility[] = [
    {
        id: 'FAC-001',
        name: 'Ayder Referral Hospital',
        location: 'Mekelle',
        type: 'Tertiary / Referral Hospital',
        contact: '+251-34-416-0000',
        lastSync: '2026-03-08 08:30',
        facilityAdminId: 'USR-002',
        departments: [
            { id: 'DEP-001', name: 'Emergency', facilityId: 'FAC-001', status: 'available' },
            { id: 'DEP-002', name: 'Obstetrics/Gynecology', facilityId: 'FAC-001', status: 'available' },
            { id: 'DEP-003', name: 'Surgery', facilityId: 'FAC-001', status: 'limited', estimatedDelayDays: 2, note: 'Only 1 OR functional' },
            { id: 'DEP-004', name: 'Pediatrics', facilityId: 'FAC-001', status: 'available' },
            { id: 'DEP-005', name: 'Internal Medicine', facilityId: 'FAC-001', status: 'available' },
            { id: 'DEP-006', name: 'Ophthalmology', facilityId: 'FAC-001', status: 'available' },
            { id: 'DEP-007', name: 'Imaging (CT/X-Ray)', facilityId: 'FAC-001', status: 'available' },
        ],
    },
    {
        id: 'FAC-002',
        name: 'Axum St. Mary Hospital',
        location: 'Axum',
        type: 'General Hospital',
        contact: '+251-34-775-0000',
        lastSync: '2026-03-08 07:15',
        departments: [
            { id: 'DEP-008', name: 'Emergency', facilityId: 'FAC-002', status: 'available' },
            { id: 'DEP-009', name: 'Obstetrics/Gynecology', facilityId: 'FAC-002', status: 'available' },
            { id: 'DEP-010', name: 'Surgery', facilityId: 'FAC-002', status: 'available' },
            { id: 'DEP-011', name: 'Pediatrics', facilityId: 'FAC-002', status: 'limited', estimatedDelayDays: 1, note: '2 beds remaining' },
            { id: 'DEP-012', name: 'Internal Medicine', facilityId: 'FAC-002', status: 'available' },
            { id: 'DEP-013', name: 'X-Ray', facilityId: 'FAC-002', status: 'unavailable', note: 'Machine under repair' },
        ],
    },
    {
        id: 'FAC-003',
        name: 'Shire Suhul Hospital',
        location: 'Shire',
        type: 'General Hospital',
        contact: '+251-34-444-0000',
        lastSync: '2026-03-08 06:45',
        departments: [
            { id: 'DEP-014', name: 'Emergency', facilityId: 'FAC-003', status: 'available' },
            { id: 'DEP-015', name: 'Obstetrics/Gynecology', facilityId: 'FAC-003', status: 'unavailable', note: 'Ward full' },
            { id: 'DEP-016', name: 'Surgery', facilityId: 'FAC-003', status: 'limited', estimatedDelayDays: 3, note: 'Surgeon unavailable until Mon' },
            { id: 'DEP-017', name: 'Pediatrics', facilityId: 'FAC-003', status: 'available' },
            { id: 'DEP-018', name: 'Internal Medicine', facilityId: 'FAC-003', status: 'available' },
            { id: 'DEP-019', name: 'X-Ray', facilityId: 'FAC-003', status: 'available' },
        ],
    },
    {
        id: 'FAC-004',
        name: 'Adigrat General Hospital',
        location: 'Adigrat',
        type: 'General Hospital',
        contact: '+251-34-445-0000',
        lastSync: '2026-03-07 22:00',
        departments: [
            { id: 'DEP-020', name: 'Emergency', facilityId: 'FAC-004', status: 'available' },
            { id: 'DEP-021', name: 'Obstetrics/Gynecology', facilityId: 'FAC-004', status: 'available' },
            { id: 'DEP-022', name: 'Surgery', facilityId: 'FAC-004', status: 'available' },
            { id: 'DEP-023', name: 'Pediatrics', facilityId: 'FAC-004', status: 'available' },
            { id: 'DEP-024', name: 'X-Ray', facilityId: 'FAC-004', status: 'unavailable', note: 'Equipment failure' },
            { id: 'DEP-025', name: 'Laboratory', facilityId: 'FAC-004', status: 'limited', estimatedDelayDays: 1, note: 'Reagent shortage' },
        ],
    },
    {
        id: 'FAC-005',
        name: 'Adwa General Hospital',
        location: 'Adwa',
        type: 'General Hospital',
        contact: '+251-34-446-0000',
        lastSync: '2026-03-08 05:00',
        departments: [
            { id: 'DEP-026', name: 'Emergency', facilityId: 'FAC-005', status: 'available' },
            { id: 'DEP-027', name: 'Obstetrics/Gynecology', facilityId: 'FAC-005', status: 'available' },
            { id: 'DEP-028', name: 'Surgery', facilityId: 'FAC-005', status: 'unavailable', note: 'No orthopedic surgeon' },
            { id: 'DEP-029', name: 'Pediatrics', facilityId: 'FAC-005', status: 'available' },
            { id: 'DEP-030', name: 'X-Ray', facilityId: 'FAC-005', status: 'available' },
        ],
    },
    {
        id: 'FAC-006',
        name: 'Wukro General Hospital',
        location: 'Wukro',
        type: 'General Hospital',
        contact: '+251-34-447-0000',
        lastSync: '2026-03-08 09:00',
        departments: [
            { id: 'DEP-031', name: 'Emergency', facilityId: 'FAC-006', status: 'available' },
            { id: 'DEP-032', name: 'Obstetrics/Gynecology', facilityId: 'FAC-006', status: 'limited', estimatedDelayDays: 1, note: '1 midwife on duty' },
            { id: 'DEP-033', name: 'Internal Medicine', facilityId: 'FAC-006', status: 'available' },
            { id: 'DEP-034', name: 'Pediatrics', facilityId: 'FAC-006', status: 'available' },
            { id: 'DEP-035', name: 'X-Ray', facilityId: 'FAC-006', status: 'available' },
            { id: 'DEP-036', name: 'Laboratory', facilityId: 'FAC-006', status: 'available' },
        ],
    },
]

// ─── Own-facility resources ───────────────────────────────────────────────────

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

// ─── Mock Referrals ───────────────────────────────────────────────────────────

export const mockReferrals: Referral[] = [
    {
        id: 'REF-001', patientId: 'PAT-001', patientName: 'Terhas Hailu', mrn: 'MRN-20240112', age: 28, sex: 'Female',
        dateOfBirth: '1998-01-15', phone: '+251-91-234-5678',
        referringFacility: 'Shire Health Center', referringUserId: 'USR-006',
        receivingFacility: 'Axum St. Mary Hospital',
        priority: 'emergency', status: 'synced',
        chiefComplaint: 'Pre-eclampsia — high blood pressure at 36 weeks gestation',
        clinicalSummary: 'BP 160/110. Proteinuria 2+. Severe headache and blurred vision. Fundal height consistent with dates. FHR 142 bpm. Patient requires immediate obstetric evaluation.',
        primaryDiagnosis: 'Pre-eclampsia with severe features',
        reasonForReferral: 'Requires specialist obstetric intervention not available at health center',
        treatmentGiven: 'IV MgSO4 loading dose given. Hydralazine 10mg IM for BP control.',
        department: 'Obstetrics/Gynecology',
        date: '2026-03-08', hasImage: true,
    },
    {
        id: 'REF-002', patientId: 'PAT-002', patientName: 'Gebremariam Kahsay', mrn: 'MRN-20240089', age: 45, sex: 'Male',
        dateOfBirth: '1981-06-22',
        referringFacility: 'Adwa Health Center', referringUserId: 'USR-006',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'urgent', status: 'pending',
        chiefComplaint: 'Suspected appendicitis',
        clinicalSummary: 'Right lower quadrant pain for 2 days. McBurney point tenderness. WBC elevated. No peritoneal signs yet. Needs surgical consultation.',
        primaryDiagnosis: 'Acute appendicitis (suspected)',
        reasonForReferral: 'Surgical consultation required — no surgeon at referring facility',
        department: 'Surgery',
        date: '2026-03-08', hasImage: false,
    },
    {
        id: 'REF-003', patientId: 'PAT-003', patientName: 'Lemlem Berhe', mrn: 'MRN-20240201', age: 62, sex: 'Female',
        dateOfBirth: '1964-03-10',
        referringFacility: 'Wukro Health Center',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'routine', status: 'completed',
        chiefComplaint: 'Diabetes follow-up — uncontrolled blood sugar',
        clinicalSummary: 'FBS 280mg/dl despite metformin 1g BD. HbA1c needed. Tingling in feet suggests early neuropathy. Requires endocrinology review.',
        primaryDiagnosis: 'Type 2 Diabetes Mellitus — uncontrolled',
        reasonForReferral: 'Specialist endocrinology review; HbA1c and neuropathy workup',
        department: 'Internal Medicine',
        date: '2026-03-07', hasImage: false,
    },
    {
        id: 'REF-004', patientId: 'PAT-004', patientName: 'Tekle Hadgu', mrn: 'MRN-20240156', age: 8, sex: 'Male',
        dateOfBirth: '2018-05-03',
        referringFacility: 'Adigrat Health Center',
        receivingFacility: 'Adigrat General Hospital',
        priority: 'emergency', status: 'accepted',
        chiefComplaint: 'Severe dehydration — acute diarrhea',
        clinicalSummary: 'Watery diarrhea x3 days, vomiting. Sunken eyes, poor skin turgor. Unable to keep ORS down. IV rehydration and stool culture needed.',
        primaryDiagnosis: 'Severe dehydration secondary to acute gastroenteritis',
        reasonForReferral: 'IV access and paediatric monitoring required',
        estimatedWaitingTime: 'Immediate',
        appointmentDate: '2026-03-08',
        department: 'Pediatrics',
        date: '2026-03-08', hasImage: false,
    },
    {
        id: 'REF-005', patientId: 'PAT-005', patientName: 'Mulu Gebremedhin', mrn: 'MRN-20240178', age: 35, sex: 'Female',
        dateOfBirth: '1991-09-20',
        referringFacility: 'Enticho Health Center',
        receivingFacility: 'Shire Suhul Hospital',
        priority: 'urgent', status: 'pending',
        chiefComplaint: 'Post-partum hemorrhage',
        clinicalSummary: 'Delivered 6 hours ago. Continued heavy bleeding. Uterus boggy on palpation. Oxytocin given IM. Needs emergency obstetric care.',
        primaryDiagnosis: 'Post-partum haemorrhage',
        reasonForReferral: 'Surgical and anaesthesia support required',
        department: 'Obstetrics/Gynecology',
        date: '2026-03-08', hasImage: true,
    },
    {
        id: 'REF-006', patientId: 'PAT-006', patientName: 'Kidane Abrha', mrn: 'MRN-20240199', age: 52, sex: 'Male',
        dateOfBirth: '1974-11-08',
        referringFacility: 'Axum Health Center',
        receivingFacility: 'Axum St. Mary Hospital',
        priority: 'routine', status: 'synced',
        chiefComplaint: 'Chronic cough — suspected TB',
        clinicalSummary: 'Productive cough 4 weeks, night sweats, weight loss 5kg. Sputum AFB smear needed. HIV status unknown. Contact history positive.',
        primaryDiagnosis: 'Pulmonary Tuberculosis (suspected)',
        reasonForReferral: 'Sputum AFB smear and chest X-ray not available at health center',
        department: 'Internal Medicine',
        date: '2026-03-07', hasImage: false,
    },
    {
        id: 'REF-007', patientId: 'PAT-007', patientName: 'Selam Hagos', mrn: 'MRN-20240215', age: 19, sex: 'Female',
        dateOfBirth: '2007-02-14',
        referringFacility: 'Zalambessa Health Center',
        receivingFacility: 'Adigrat General Hospital',
        priority: 'urgent', status: 'pending',
        chiefComplaint: 'Trauma — road traffic accident',
        clinicalSummary: 'Fall from motorcycle. Deep laceration right forearm, possible fracture. Bleeding controlled with pressure dressing. Tetanus status unknown.',
        primaryDiagnosis: 'Open fracture right forearm (suspected)',
        reasonForReferral: 'Orthopaedic evaluation and X-ray needed',
        department: 'Surgery',
        date: '2026-03-08', hasImage: true,
    },
    {
        id: 'REF-008', patientId: 'PAT-008', patientName: 'Berhane Weldu', mrn: 'MRN-20240230', age: 71, sex: 'Male',
        dateOfBirth: '1955-07-30',
        referringFacility: 'Neblet Health Center',
        receivingFacility: 'Ayder Referral Hospital',
        priority: 'routine', status: 'synced',
        chiefComplaint: 'Vision loss — suspected cataract',
        clinicalSummary: 'Progressive bilateral vision loss 1 year. Unable to perform daily activities. Visual acuity: R 6/36, L 6/60. Lens opacity noted. Ophthalmology referral.',
        primaryDiagnosis: 'Bilateral senile cataract',
        reasonForReferral: 'Ophthalmology assessment and surgical planning',
        department: 'Ophthalmology',
        date: '2026-03-06', hasImage: true,
    },
]

// ─── Mock Consent Records ─────────────────────────────────────────────────────

export const mockConsentRecords: ConsentRecord[] = [
    {
        id: 'CON-001',
        patientId: 'PAT-001',
        grantedByUserId: 'USR-006',
        grantedAt: '2026-03-08 07:15',
        consentText: 'I consent to the transfer of my medical information to the receiving facility for the purpose of continuing my care.',
    },
    {
        id: 'CON-002',
        patientId: 'PAT-003',
        grantedByUserId: 'USR-006',
        grantedAt: '2026-03-07 11:30',
        consentText: 'I consent to the transfer of my medical information to the receiving facility for the purpose of continuing my care.',
    },
]

// ─── Mock Discharge Summaries ─────────────────────────────────────────────────

export const mockDischargeSummaries: DischargeSummary[] = [
    {
        id: 'DS-001',
        referralId: 'REF-003',
        patientName: 'Lemlem Berhe',
        treatmentSummary: 'Patient admitted for endocrinology review. HbA1c found to be 9.2%. Insulin therapy initiated alongside metformin. Peripheral neuropathy confirmed via nerve conduction study.',
        finalDiagnosis: 'Type 2 Diabetes Mellitus with peripheral neuropathy',
        medicationsPrescribed: 'Insulin Glargine 10 units SC at bedtime, Metformin 1g BD, Amitriptyline 25mg at night for neuropathic pain',
        followUpInstructions: 'Return to nearest health center in 2 weeks for fasting blood glucose check. Follow up at Ayder endocrinology clinic in 6 weeks. Monitor feet daily for ulcers.',
        dischargeDate: '2026-03-10',
        createdByUserId: 'USR-005',
        createdByName: 'Dr. Amanuel Hailu',
        createdAt: '2026-03-10 14:30',
    },
]

// ─── Mock Audit Log ───────────────────────────────────────────────────────────

export const mockAuditLog: AuditEntry[] = [
    { id: 'AUD-001', userId: 'USR-004', user: 'Ato Gebre (Liaison)', action: 'Viewed referral details', recordId: 'REF-001', timestamp: '2026-03-08 09:15', ipAddress: '192.168.1.10' },
    { id: 'AUD-002', userId: 'USR-006', user: 'Sr. Yordanos (Liaison)', action: 'Reviewed triage queue', recordId: 'REF-007', timestamp: '2026-03-08 08:45', ipAddress: '192.168.1.11' },
    { id: 'AUD-003', userId: 'USR-001', user: 'Dr. Hagos (Sys Admin)', action: 'Exported analytics report', recordId: 'RPT-003', timestamp: '2026-03-08 08:00', ipAddress: '192.168.1.5' },
    { id: 'AUD-004', userId: 'USR-004', user: 'Ato Gebre (Liaison)', action: 'Accepted referral', recordId: 'REF-004', timestamp: '2026-03-08 07:30', ipAddress: '192.168.1.10' },
    { id: 'AUD-005', userId: 'SYSTEM', user: 'System', action: 'Auto-synced 12 referrals', recordId: 'SYNC-008', timestamp: '2026-03-08 06:00', ipAddress: '127.0.0.1' },
    { id: 'AUD-006', userId: 'USR-006', user: 'Sr. Yordanos (Liaison)', action: 'Updated patient demographics', recordId: 'REF-003', timestamp: '2026-03-07 16:20', ipAddress: '192.168.1.11' },
    { id: 'AUD-007', userId: 'USR-001', user: 'Dr. Hagos (Sys Admin)', action: 'Reviewed access logs', recordId: 'AUD-REVIEW', timestamp: '2026-03-07 15:00', ipAddress: '192.168.1.5' },
    { id: 'AUD-008', userId: 'USR-005', user: 'Dr. Amanuel (Doctor)', action: 'Submitted discharge summary', recordId: 'REF-003', timestamp: '2026-03-07 14:35', ipAddress: '192.168.1.12' },
]

// ─── Mock Triage Actions ──────────────────────────────────────────────────────

export const mockTriageActions: TriageAction[] = [
    { id: 'TA-001', referralId: 'REF-004', patientName: 'Tekle Hadgu', action: 'accepted', by: 'Ato Gebre', timestamp: '2026-03-08 07:30', note: 'Immediate admission — pediatric ward' },
    { id: 'TA-002', referralId: 'REF-003', patientName: 'Lemlem Berhe', action: 'accepted', by: 'Dr. Amanuel', timestamp: '2026-03-07 14:00', note: 'Routine endocrinology appointment scheduled' },
    { id: 'TA-003', referralId: 'REF-009', patientName: 'Hailu Mesfin', action: 'rejected', by: 'Ato Gebre', timestamp: '2026-03-07 11:00', note: 'Insufficient clinical information. Requested BP trend and urine analysis.' },
    { id: 'TA-004', referralId: 'REF-010', patientName: 'Tsige Weldegebriel', action: 'redirected', by: 'Dr. Sara', timestamp: '2026-03-07 09:45', note: 'Redirected from Surgery to Orthopedics' },
]

// ─── Chart Data ───────────────────────────────────────────────────────────────

export const referralTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
        {
            label: 'Referrals',
            data: [12, 19, 8, 15, 22, 9, 14],
            borderColor: '#2b4968',
            backgroundColor: 'rgba(43, 73, 104, 0.1)',
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
            borderColor: '#2b4968',
            backgroundColor: 'rgba(43, 73, 104, 0.15)',
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
            backgroundColor: ['#ef4444', '#f59e0b', '#2b4968', '#10b981', '#8b5cf6'],
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
