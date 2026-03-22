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
    // Referrals (read-only keys still used by triage)
    'ref.clinicalSummary': { en: 'Clinical Summary', ti: 'ክሊኒካዊ ጽሟቕ' },
    'ref.chiefComplaint': { en: 'Chief Complaint', ti: 'ዋና ጥርዓን' },
    'ref.referringFacility': { en: 'Referring Facility', ti: 'ለኣኺ ትካል' },
    'ref.status': { en: 'Status', ti: 'ኲነት' },
    // Directory — own facility
    'dir.title': { en: 'Facility Resources', ti: 'ምዕቃብ ትካል' },
    'dir.staff': { en: 'Health Professionals', ti: 'ሕክምናዊ ሰራሕተኛታት' },
    'dir.equipment': { en: 'Equipment', ti: 'ኣቑሑ' },
    'dir.available': { en: 'Available', ti: 'ዝርከብ' },
    'dir.occupied': { en: 'Occupied', ti: 'ተጸሚዱ' },
    'dir.offDuty': { en: 'Off Duty', ti: 'ዕረፍቲ' },
    'dir.damaged': { en: 'Damaged – Needs Repair', ti: 'ተሃሲዩ – ጽጌ የለዎ' },
    'dir.searchStaff': { en: 'Search staff or equipment...', ti: 'ሰራሕተኛ ወይ ኣቑሑ ኣናዲ...' },
    'dir.lastUpdated': { en: 'Last updated', ti: 'ናይ መወዳእታ ምሕዳስ' },
    // Triage
    'tri.title': { en: 'Triage Dashboard', ti: 'ዳሽቦርድ ትሪያጅ' },
    'tri.incoming': { en: 'Incoming Queue', ti: 'ዝመጽእ ሪጋ' },
    'tri.accept': { en: 'Accept', ti: 'ተቐበል' },
    'tri.reject': { en: 'Reject', ti: 'ኣይትቐበል' },
    'tri.redirect': { en: 'Redirect', ti: 'ኣመሓላልፍ' },
    'tri.from': { en: 'From', ti: 'ካብ' },
    'tri.recentActions': { en: 'Recent Actions', ti: 'ናይ ቀረባ ስጉምትታት' },
    'tri.rejectReason': { en: 'Rejection Message to Referring Facility', ti: 'መልእኽቲ ምንጻግ ናብ ለኣኺ ትካል' },
    'tri.redirectMsg': { en: 'Redirect Notification', ti: 'ኣሳሕቲ ምቕያር' },
    'tri.acceptMsg': { en: 'Acceptance Notification', ti: 'ኣሳሕቲ ምቕባል' },
    'tri.reportTitle': { en: 'Treatment Report', ti: 'ጸብጻብ ሕክምና' },
    'tri.diagnosis': { en: 'Diagnosis', ti: 'ምርመራ' },
    'tri.treatment': { en: 'Treatment Provided', ti: 'ዝወሃበ ሕክምና' },
    'tri.followUp': { en: 'Follow-Up Instructions', ti: 'ናይ ክትትል መምርሒ' },
    'tri.additionalNotes': { en: 'Additional Notes', ti: 'ተወሳኺ ሓበሬታ' },
    'tri.submitReport': { en: 'Submit Report', ti: 'ጸብጻብ ኣቕርብ' },
    'tri.writeReport': { en: 'Write Treatment Report', ti: 'ጸብጻብ ሕክምና ጸሓፍ' },
    // Analytics
    'ana.title': { en: 'Analytics & Surveillance', ti: 'ትንተና ን ክትትል' },
    'ana.referralVolume': { en: 'Referral Volume', ti: 'ብዝሒ ሪፈራል' },
    'ana.topReasons': { en: 'Top Referral Reasons', ti: 'ቀንዲ ምኽንያታት ሪፈራል' },
    'ana.rejectionRate': { en: 'Rejection Rate by Facility', ti: 'መጠን ምንጻግ ብትካል' },
    'ana.totalMonth': { en: 'Total This Month', ti: 'ጠቕላላ ናይዚ ወርሒ' },
    'ana.avgTriageTime': { en: 'Avg. Triage Time', ti: 'ማእከላይ ግዜ ትሪያጅ' },
    'ana.feedbackRate': { en: 'Feedback Loop Rate', ti: 'መጠን ግብረ-መልሲ' },
    'ana.complianceAudit': { en: 'Compliance Audit Log', ti: 'ዝርዝር ኦዲት ምትእምማን' },
    // Common
    'common.offline': { en: '⚡ Offline Mode — Data will sync when connected', ti: '⚡ ኦፍላይን ሞድ — ዳታ ምስ ተራኸበ ክሰንክ እዩ' },
    'common.save': { en: 'Save', ti: 'ዓቅብ' },
    'common.cancel': { en: 'Cancel', ti: 'ሰርዝ' },
    'common.close': { en: 'Close', ti: 'ዕጾ' },
    'common.send': { en: 'Send', ti: 'ስደድ' },
    'common.logout': { en: 'Sign Out', ti: 'ውጻእ' },
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
