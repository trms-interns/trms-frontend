import React, { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'en' | 'ti'

interface LanguageContextType {
    lang: Lang
    setLang: (l: Lang) => void
    t: (key: string) => string
}

const translations: Record<string, Record<Lang, string>> = {
    // Navigation
    'nav.dashboard': { en: 'Dashboard', ti: 'ዳሽቦርድ' },
    'nav.directory': { en: 'Service Directory', ti: 'ምዕቃብ ትካል' },
    'nav.triage': { en: 'Triage Dashboard', ti: 'ዳሽቦርድ ትሪያጅ' },
    'nav.analytics': { en: 'Analytics', ti: 'ትንተና' },
    'nav.sendReferral': { en: 'Send Referral', ti: 'ሪፈራል ስደድ' },
    'nav.myReferrals': { en: 'My Referrals', ti: 'ናተይ ሪፈራት' },
    'nav.processedReferrals': { en: 'Processed Referrals', ti: 'ዝተዛዘሙ ሪፈራት' },
    'nav.patientQueue': { en: 'Patient Queue', ti: 'ሪጋ ሕሙማት' },
    'nav.userManagement': { en: 'User Management', ti: 'ኣጠቓቕማ ተጠቃምቲ' },
    'nav.referralOverview': { en: 'Referral Overview', ti: 'ጽሟቕ ሪፈራል' },
    'nav.departments': { en: 'Departments', ti: 'ክፍልታት' },
    'nav.serviceStatus': { en: 'Service Status', ti: 'ኲነት ግልጋሎት' },
    'nav.reports': { en: 'Reports', ti: 'ጸብጻብ' },
    'nav.facilityManagement': { en: 'Facility Management', ti: 'ኣካይዳ ትካል' },
    'nav.auditLogs': { en: 'Audit Logs', ti: 'ዝርዝር ኦዲት' },
    'nav.profile': { en: 'Profile', ti: 'ፕሮፋይል' },
    // Login
    'login.title': { en: 'Sign In', ti: 'እቶ' },
    'login.email': { en: 'Email Address', ti: 'ኢ-መይል' },
    'login.password': { en: 'Password', ti: 'ሕሽሽ ቃል' },
    'login.submit': { en: 'Sign In', ti: 'እቶ' },
    'login.error': { en: 'Invalid credentials.', ti: 'ምስጢር ቁጽሪ ስሕተት' },
    // Dashboard
    'dash.title': { en: 'TRMS Dashboard', ti: 'ዳሽቦርድ TRMS' },
    'dash.totalReferrals': { en: 'Total Referrals', ti: 'ጠቕላላ ሪፈራት' },
    'dash.pendingSync': { en: 'Pending Sync', ti: 'ዝጽበ ሲንክ' },
    'dash.activeTriage': { en: 'Active Triage', ti: 'ንጡፍ ትሪያጅ' },
    'dash.completedToday': { en: 'Completed Today', ti: 'ሎሚ ዝተዛዘሙ' },
    'dash.recentActivity': { en: 'Recent Activity', ti: 'ናይ ቀረባ ንጥፈታት' },
    'dash.referralTrend': { en: 'Referral Trend (7 Days)', ti: 'ዝንባለ ሪፈራል (7 መዓልትታት)' },
    'dash.quickActions': { en: 'Quick Actions', ti: 'ቅልጡፍ ስጉምትታት' },
    // Referrals
    'ref.clinicalSummary': { en: 'Clinical Summary', ti: 'ክሊኒካዊ ጽሟቕ' },
    'ref.chiefComplaint': { en: 'Chief Complaint', ti: 'ዋና ጥርዓን' },
    'ref.referringFacility': { en: 'Referring Facility', ti: 'ለኣኺ ትካል' },
    'ref.status': { en: 'Status', ti: 'ኲነት' },
    'ref.patientName': { en: 'Patient Full Name', ti: 'ምሉእ ስም ሕሙም' },
    'ref.dateOfBirth': { en: 'Date of Birth', ti: 'ዕለት ልደት' },
    'ref.gender': { en: 'Gender', ti: 'ጾታ' },
    'ref.phone': { en: 'Phone Number', ti: 'ቁጽሪ ስልኪ' },
    'ref.receivingFacility': { en: 'Receiving Facility', ti: 'ተቐባሊ ትካል' },
    'ref.priority': { en: 'Priority', ti: 'ቀዳምነት' },
    'ref.reason': { en: 'Reason for Referral', ti: 'ምኽንያት ሪፈራል' },
    'ref.primaryDiagnosis': { en: 'Primary Diagnosis', ti: 'ቀዳማይ ምርመራ' },
    'ref.treatmentGiven': { en: 'Treatment Already Given', ti: 'ዝወሃበ ሕክምና' },
    'ref.consent': { en: 'I confirm the patient has given verbal consent to this referral and the sharing of their health information.', ti: 'ሕሙሙ ንዚ ሪፈራልን ጥዕናኦም ሓበሬታ ምክፋልን ዓቢ ፍቓዶም ሂቦም ምዃኑ ኣረጋጽ።' },
    // Create Referral
    'cr.title': { en: 'Create New Referral', ti: 'ሓዲሽ ሪፈራል ፍጠር' },
    'cr.patientSection': { en: 'Patient Details', ti: 'ሓበሬታ ሕሙም' },
    'cr.clinicalSection': { en: 'Clinical Details', ti: 'ክሊኒካዊ ሓበሬታ' },
    'cr.saved': { en: 'Referral saved. Will sync when online.', ti: 'ሪፈራል ተዓቂቡ። ምስ ተራኸበ ክሰንክ እዩ።' },
    'cr.submit': { en: 'Save & Submit Referral', ti: 'ዓቅብ ን ኣቕርብ ሪፈራል' },
    // My Referrals
    'mr.title': { en: 'My Referrals', ti: 'ናተይ ሪፈራት' },
    'mr.all': { en: 'All', ti: 'ኩሎም' },
    'mr.empty': { en: 'No referrals match this filter.', ti: 'ዝሰማማዕ ሪፈራል የልቦን' },
    // Doctor
    'doc.title': { en: 'Patient Queue', ti: 'ሪጋ ሕሙማት' },
    'doc.dept': { en: 'Department', ti: 'ክፍሊ' },
    'doc.dischargeSummary': { en: 'Complete Discharge Summary', ti: 'ማጠናቐቒ ጸብጻብ' },
    // Department Head
    'dh.title': { en: 'Department Management', ti: 'ኣካይዳ ክፍሊ' },
    'dh.users': { en: 'User Management', ti: 'ኣካይዳ ተጠቃምቲ' },
    'dh.addUser': { en: 'Add User', ti: 'ወሲኽ ተጠቃሚ' },
    'dh.referralOverview': { en: 'Referral Overview', ti: 'ጽሟቕ ሪፈራል' },
    // Facility Admin
    'fa.title': { en: 'Facility Administration', ti: 'ኣካይዳ ትካል' },
    'fa.departments': { en: 'Department Management', ti: 'ኣካይዳ ክፍልታት' },
    'fa.addDept': { en: 'Add Department', ti: 'ወሲኽ ክፍሊ' },
    // System Admin
    'sa.title': { en: 'System Administration', ti: 'ኣካይዳ ስርዓት' },
    'sa.facilities': { en: 'Facility Management', ti: 'ኣካይዳ ትካላት' },
    'sa.addFacility': { en: 'Add Facility', ti: 'ወሲኽ ትካል' },
    'sa.auditLogs': { en: 'Audit Logs', ti: 'ዝርዝር ኦዲት' },
    // Profile
    'pro.title': { en: 'My Profile', ti: 'ፕሮፋይለይ' },
    'pro.changePassword': { en: 'Change Password', ti: 'ቀይር ሕሽሽ ቃል' },
    'pro.currentPassword': { en: 'Current Password', ti: 'ሕሉፍ ሕሽሽ ቃል' },
    'pro.newPassword': { en: 'New Password', ti: 'ሓዲሽ ሕሽሽ ቃል' },
    'pro.confirmPassword': { en: 'Confirm New Password', ti: 'ኣረጋጽ ሓዲሽ ሕሽሽ ቃል' },
    // Directory
    'dir.title': { en: 'Facility Resources', ti: 'ምዕቃብ ትካል' },
    'dir.staff': { en: 'Health Professionals', ti: 'ሕክምናዊ ሰራሕተኛታት' },
    'dir.equipment': { en: 'Equipment', ti: 'ኣቑሑ' },
    'dir.available': { en: 'Available', ti: 'ዝርከብ' },
    'dir.occupied': { en: 'Occupied', ti: 'ተጸሚዱ' },
    'dir.offDuty': { en: 'Off Duty', ti: 'ዕረፍቲ' },
    'dir.damaged': { en: 'Damaged – Needs Repair', ti: 'ተሃሲዩ – ጽጌ የለዎ' },
    'dir.searchStaff': { en: 'Search staff or equipment...', ti: 'ሰራሕተኛ ወይ ኣቑሑ ኣናዲ...' },
    'dir.lastUpdated': { en: 'Last updated', ti: 'ናይ መወዳእታ ምሕዳስ' },
    'dir.serviceStatus': { en: 'Service Status', ti: 'ኲነት ግልጋሎት' },
    'dir.limited': { en: 'Limited', ti: 'ውሱን' },
    'dir.unavailable': { en: 'Unavailable', ti: 'ዘይርከብ' },
    'dir.delayDays': { en: 'Est. delay (days)', ti: 'ግምት ናይ ዳርጋ (መዓልትታት)' },
    // Triage
    'tri.title': { en: 'Triage Dashboard', ti: 'ዳሽቦርድ ትሪያጅ' },
    'tri.incoming': { en: 'Incoming Queue', ti: 'ዝመጽእ ሪጋ' },
    'tri.outgoing': { en: 'Outgoing – Pending', ti: 'ዝወጽእ ሪጋ – ዝጽበ' },
    'tri.routeReferral': { en: 'Route Referral', ti: 'ሪፈራል መምርሒ' },
    'tri.accept': { en: 'Accept', ti: 'ተቐበል' },
    'tri.reject': { en: 'Reject', ti: 'ኣይትቐበል' },
    'tri.redirect': { en: 'Forward', ti: 'ኣመሓላልፍ' },
    'tri.from': { en: 'From', ti: 'ካብ' },
    'tri.recentActions': { en: 'Recent Actions', ti: 'ናይ ቀረባ ስጉምትታት' },
    'tri.rejectReason': { en: 'Rejection Message to Referring Facility', ti: 'መልእኽቲ ምንጻግ ናብ ለኣኺ ትካል' },
    'tri.redirectMsg': { en: 'Forward Referral', ti: 'ኣመሓላልፍ ሪፈራል' },
    'tri.acceptMsg': { en: 'Acceptance Notification', ti: 'ኣሳሕቲ ምቕባል' },
    'tri.reportTitle': { en: 'Discharge Summary', ti: 'ጸብጻብ ምፍናው' },
    'tri.diagnosis': { en: 'Final Diagnosis', ti: 'ናይ መወዳእታ ምርመራ' },
    'tri.treatment': { en: 'Summary of Treatment', ti: 'ጽሟቕ ሕክምና' },
    'tri.medications': { en: 'Medications Prescribed', ti: 'ዝተዓዘዙ መድሃኒታት' },
    'tri.followUp': { en: 'Follow-Up Instructions', ti: 'ናይ ክትትል መምርሒ' },
    'tri.dischargeDate': { en: 'Date of Discharge', ti: 'ዕለት ምፍናው' },
    'tri.additionalNotes': { en: 'Additional Notes', ti: 'ተወሳኺ ሓበሬታ' },
    'tri.submitReport': { en: 'Submit Discharge Summary', ti: 'ኣቕርብ ጸብጻብ ምፍናው' },
    'tri.writeReport': { en: 'Complete Discharge Summary', ti: 'ምፍጻም ጸብጻብ ምፍናው' },
    'tri.waitingTime': { en: 'Estimated Waiting Time', ti: 'ግምት ናይ ምጽባይ ግዜ' },
    'tri.appointmentDate': { en: 'Appointment Date', ti: 'ዕለት ቆጸራ' },
    // Analytics
    'ana.title': { en: 'Analytics & Surveillance', ti: 'ትንተና ን ክትትል' },
    'ana.referralVolume': { en: 'Referral Volume', ti: 'ብዝሒ ሪፈራል' },
    'ana.topReasons': { en: 'Top Referral Reasons', ti: 'ቀንዲ ምኽንያታት ሪፈራል' },
    'ana.rejectionRate': { en: 'Rejection Rate by Facility', ti: 'መጠን ምንጻግ ብትካል' },
    'ana.totalMonth': { en: 'Total This Month', ti: 'ጠቕላላ ናይዚ ወርሒ' },
    'ana.avgTriageTime': { en: 'Avg. Triage Time', ti: 'ማእከላይ ግዜ ትሪያጅ' },
    'ana.feedbackRate': { en: 'Feedback Loop Rate', ti: 'መጠን ግብረ-መልሲ' },
    'ana.complianceAudit': { en: 'Compliance Audit Log', ti: 'ዝርዝር ኦዲት ምትእምማን' },
    'ana.exportCSV': { en: 'Export CSV', ti: 'ወጻኢ CSV' },
    'ana.filterPeriod': { en: 'Period', ti: 'ናይ ግዜ ወሰን' },
    'ana.filterFacility': { en: 'Facility', ti: 'ትካል' },
    'ana.filterPriority': { en: 'Priority', ti: 'ቀዳምነት' },
    // Common
    'common.offline': { en: '⚡ Offline Mode — Data will sync when connected', ti: '⚡ ኦፍላይን ሞድ — ዳታ ምስ ተራኸበ ክሰንክ እዩ' },
    'common.save': { en: 'Save', ti: 'ዓቅብ' },
    'common.cancel': { en: 'Cancel', ti: 'ሰርዝ' },
    'common.close': { en: 'Close', ti: 'ዕጾ' },
    'common.send': { en: 'Send', ti: 'ስደድ' },
    'common.logout': { en: 'Sign Out', ti: 'ውጻእ' },
    'common.edit': { en: 'Edit', ti: 'ኣርም' },
    'common.disable': { en: 'Disable', ti: 'ኣቕርጽ' },
    'common.enable': { en: 'Enable', ti: 'ኣስራሑ' },
    'common.add': { en: 'Add', ti: 'ወሲኽ' },
    'common.search': { en: 'Search...', ti: 'ኣናዲ...' },
    'common.filter': { en: 'Filter', ti: 'ፍልቲ' },
    'common.noData': { en: 'No data available.', ti: 'ዳታ የልቦን' },
    'common.loading': { en: 'Loading...', ti: 'ይጽዓን...' },
    'common.confirm': { en: 'Confirm', ti: 'ኣረጋጽ' },
    'common.required': { en: 'This field is required.', ti: 'እዚ መሳለጥያ ናይ ግድን እዩ' },
    'common.success': { en: 'Saved successfully.', ti: 'ብዓወት ተዓቂቡ' },
    'common.active': { en: 'Active', ti: 'ንጡፍ' },
    'common.inactive': { en: 'Inactive', ti: 'ዘይንጡፍ' },
    'common.all': { en: 'All', ti: 'ኩሎም' },
    'common.name': { en: 'Name', ti: 'ስም' },
    'common.role': { en: 'Role', ti: 'ሓላፍነት' },
    'common.department': { en: 'Department', ti: 'ክፍሊ' },
    'common.facility': { en: 'Facility', ti: 'ትካል' },
    'common.status': { en: 'Status', ti: 'ኲነት' },
    'common.actions': { en: 'Actions', ti: 'ስጉምትታት' },
    'common.lastLogin': { en: 'Last Login', ti: 'ናይ መወዳእታ ምእታው' },
    'common.resetPassword': { en: 'Reset Password', ti: 'ዳግም ኣቐምጥ ሕሽሽ ቃል' },
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => { },
    t: (k) => k,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>(() => {
        return (localStorage.getItem('trms-lang') as Lang) || 'en'
    })

    const handleSetLang = (l: Lang) => {
        setLang(l)
        localStorage.setItem('trms-lang', l)
    }

    const t = (key: string): string => {
        return translations[key]?.[lang] || key
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => useContext(LanguageContext)
