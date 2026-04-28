export interface Referral {
  id: string;
  referralCode?: string;
  patientId: string;
  patientName: string;
  mrn: string;
  age: number;
  sex: "Male" | "Female";
  dateOfBirth?: string;
  phone?: string;
  referringFacilityId?: string;
  referringFacility: string;
  referringUserId?: string;
  referringUserName?: string;
  referringUserDepartment?: string;
  referringUserPhone?: string;
  referringUserEmail?: string;
  receivingFacilityId?: string;
  receivingFacility: string;
  receivingDepartmentId?: string;
  priority: "emergency" | "urgent" | "routine";
  status:
    | "draft"
    | "pending"
    | "synced"
    | "failed"
    | "accepted"
    | "rejected"
    | "forwarded"
    | "completed"
    | "pending_routing"
    | "awaiting_outbound_review";
  chiefComplaint: string;
  clinicalSummary: string;
  primaryDiagnosis?: string;
  treatmentGiven?: string;
  reasonForReferral?: string;
  vitalSigns?: string;
  allergies?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
  consentRecordId?: string;
  forwardedFromReferralId?: string;
  forwardingNote?: string;
  appointmentDate?: string;
  clinicianAcceptedAt?: string;
  acceptedByUserId?: string;
  acceptedByUserName?: string;
  acceptedByUserDepartment?: string;
  acceptedByUserPhone?: string;
  acceptedByUserEmail?: string;
  rejectedByUserId?: string;
  rejectedByUserName?: string;
  rejectedByUserDepartment?: string;
  rejectedByUserPhone?: string;
  rejectedByUserEmail?: string;
  estimatedWaitingTime?: string;
  rejectionReason?: string;
  date: string;
  hasImage: boolean;
  department?: string;
}

export interface DischargeSummary {
  id: string;
  referralId: string;
  patientName: string;
  treatmentSummary: string;
  finalDiagnosis: string;
  medicationsPrescribed: string;
  followUpInstructions: string;
  dischargeDate: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}
