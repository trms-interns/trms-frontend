import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useReferrals } from "../../context/ReferralContext";
import {
  trmsApi,
  toDisplayReferralId,
  type ApiFacility,
  type Department,
} from "../../lib/trmsApi";
import { buildCreateReferralPayload } from "../../lib/trmsApi";
import FormField from "../../components/FormField";
import {
  IconSend,
  IconCircleCheck,
  IconAlertTriangle,
  IconHash,
} from "@tabler/icons-react";

interface FormState {
  patientName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  receivingFacility?: string;
  receivingDepartmentId?: string;
  serviceType?: string;
  priority: string;
  reasonForReferral: string;
  clinicalSummary: string;
  primaryDiagnosis: string;
  treatmentGiven: string;
  vitalSigns: string;
  allergies: string;
  pastMedicalHistory: string;
  currentMedications: string;
  consent: boolean;
}

const emptyForm: FormState = {
  patientName: "",
  dateOfBirth: "",
  gender: "Male",
  phone: "",
  receivingFacility: "",
  receivingDepartmentId: "",
  serviceType: "",
  priority: "routine",
  reasonForReferral: "",
  clinicalSummary: "",
  primaryDiagnosis: "",
  treatmentGiven: "",
  vitalSigns: "",
  allergies: "",
  pastMedicalHistory: "",
  currentMedications: "",
  consent: false,
};

const ETHIOPIAN_PHONE_REGEX = /^\+251\d{9}$/;

export default function CreateReferral() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { referrals, refreshReferrals } = useReferrals();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [createdReferralId, setCreatedReferralId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<"draft" | "pending">(
    "pending",
  );
  const [facilities, setFacilities] = useState<ApiFacility[]>([]);
  const [receivingDepartments, setReceivingDepartments] = useState<Department[]>(
    [],
  );
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editPrefilled, setEditPrefilled] = useState(false);

  const editReferralId = searchParams.get("editReferralId")?.trim() || "";
  const isEditMode = Boolean(editReferralId);
  const editReferral = isEditMode
    ? referrals.find((referral) => referral.id === editReferralId)
    : null;

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await trmsApi.getFacilities();
        const normalizedFacilities = (Array.isArray(data) ? data : []).map(
          (facility) => ({
            ...facility,
            id: facility?.id || "",
            name: facility?.name || "Unknown Facility",
            location: facility?.location || "Unknown location",
            services: Array.isArray(facility?.services) ? facility.services : [],
          }),
        );

        const facilitiesWithServices = await Promise.all(
          normalizedFacilities.map(async (facility) => {
            if (!facility.id) return facility;
            try {
              const services = await trmsApi.getFacilityServices(facility.id);
              return {
                ...facility,
                services: Array.isArray(services) ? services : [],
              };
            } catch {
              return facility;
            }
          }),
        );

        setFacilities(facilitiesWithServices);
      } catch (error) {
        console.error('Failed to fetch facilities:', error);
        setFacilities([]);
      } finally {
        setLoadingFacilities(false);
      }
    };
    fetchFacilities();
  }, []);

  const set = (key: keyof FormState, val: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
  };

  // Show service status for selected facility
  const selectedFacility = facilities.find(
    (f) => f.id === form.receivingFacility,
  );
  const selectedService = selectedFacility?.services?.find(
    (service) => service.serviceType === form.serviceType,
  );
  const isOwnFacilitySelected = Boolean(
    selectedFacility &&
      ((user?.facilityId && selectedFacility.id === user.facilityId) ||
        selectedFacility.name === user?.facility),
  );

  useEffect(() => {
    const loadDepartments = async () => {
      if (!form.receivingFacility) {
        setReceivingDepartments([]);
        return;
      }

      try {
        setLoadingDepartments(true);
        const data = await trmsApi.getDepartments(form.receivingFacility);
        const activeDepartments = data.filter(
          (department) => department.active !== false,
        );

        if (activeDepartments.length > 0) {
          setReceivingDepartments(activeDepartments);
          return;
        }

        // Fallback: if department records are not configured yet, derive options from services.
        const serviceBackedDepartments =
          selectedFacility?.services?.map(
            (service) =>
              ({
                id: service.id,
                name: service.serviceType,
                facilityId: form.receivingFacility,
              }) as Department,
          ) || [];
        setReceivingDepartments(serviceBackedDepartments);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        const serviceBackedDepartments =
          selectedFacility?.services?.map(
            (service) =>
              ({
                id: service.id,
                name: service.serviceType,
                facilityId: form.receivingFacility,
              }) as Department,
          ) || [];
        setReceivingDepartments(serviceBackedDepartments);
      } finally {
        setLoadingDepartments(false);
      }
    };

    void loadDepartments();
  }, [form.receivingFacility, selectedFacility]);

  useEffect(() => {
    if (!isEditMode || editPrefilled || !editReferral) return;

    setForm({
      patientName: editReferral.patientName || "",
      dateOfBirth: editReferral.dateOfBirth || "",
      gender: editReferral.sex || "",
      phone: editReferral.phone || "",
      receivingFacility: editReferral.receivingFacilityId || "",
      receivingDepartmentId: editReferral.receivingDepartmentId || "",
      // Service type is not reliably stored in current referral payloads.
      serviceType: editReferral.department || "",
      priority: editReferral.priority || "",
      reasonForReferral:
        editReferral.reasonForReferral || editReferral.chiefComplaint || "",
      clinicalSummary: editReferral.clinicalSummary || "",
      primaryDiagnosis: editReferral.primaryDiagnosis || "",
      treatmentGiven: editReferral.treatmentGiven || "",
      vitalSigns: editReferral.vitalSigns || "",
      allergies: editReferral.allergies || "",
      pastMedicalHistory: editReferral.pastMedicalHistory || "",
      currentMedications: editReferral.currentMedications || "",
      consent: true,
    });
    setStep(2);
    setEditPrefilled(true);
  }, [editPrefilled, editReferral, isEditMode]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.patientName.trim()) e.patientName = t("common.required");
    if (!form.dateOfBirth) e.dateOfBirth = t("common.required");
    if (!form.gender) e.gender = t("common.required");
    if (form.phone.trim() && !ETHIOPIAN_PHONE_REGEX.test(form.phone.trim())) {
      e.phone = "Phone number must be in the format +251912345678.";
    }
    
    if (!form.priority) e.priority = t("common.required");
    if (!form.reasonForReferral.trim())
      e.reasonForReferral = t("common.required");
    if (!form.clinicalSummary.trim()) e.clinicalSummary = t("common.required");
    if (!form.primaryDiagnosis.trim())
      e.primaryDiagnosis = t("common.required");
    if (!form.consent) e.consent = "Consent is required to proceed.";
    
    setErrors(e);
    
    if (Object.keys(e).length > 0) {
      // If there are errors in Step 1, go back to Step 1
      if (e.patientName || e.dateOfBirth || e.gender || e.phone) {
        setStep(1);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const validateStepOne = (): boolean => {
    const stepOneErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.patientName.trim())
      stepOneErrors.patientName = t("common.required");
    if (!form.dateOfBirth) stepOneErrors.dateOfBirth = t("common.required");
    if (!form.gender) stepOneErrors.gender = t("common.required");

    setErrors((prev) => ({
      ...prev,
      ...stepOneErrors,
    }));

    return Object.keys(stepOneErrors).length === 0;
  };

  const handleSubmit = async (mode: "draft" | "pending") => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      ...buildCreateReferralPayload(form),
      status: mode === 'pending' ? 'pending_sending' : 'draft',
      receivingFacilityId: undefined, // Explicitly clear for doctor submission
      receivingDepartmentId: undefined,
    };
    try {
      const response = await trmsApi.createReferral(payload);
      if (isEditMode && editReferralId) {
        try {
          await trmsApi.removeReferral(editReferralId);
        } catch (deleteError) {
          console.error("Failed to delete replaced referral:", deleteError);
        }
      }
      setCreatedReferralId(toDisplayReferralId(response.referralCode, response.id));
      setSubmittedStatus(mode);
      await refreshReferrals();
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to create referral:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create referral. Please try again.';
      setSubmitError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
          <IconCircleCheck size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {isEditMode ? "Referral Updated" : t("cr.saved")}
        </h2>
        <p
          className={`text-sm text-center max-w-md ${isDark ? "text-surface-400" : "text-surface-500"}`}
        >
          Referral for <strong>{form.patientName}</strong> has been{" "}
          {isEditMode ? "updated" : "saved"} with status{" "}
          <strong>{submittedStatus === 'pending' ? 'SUBMITTED FOR ROUTING' : submittedStatus.toUpperCase()}</strong>. It will be reviewed by your facility's liaison officer.
        </p>
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 ${isDark ? "border-primary-500/20 bg-primary-500/10 text-surface-100" : "border-primary-200 bg-primary-50 text-surface-900"}`}
        >
          <IconHash size={16} className="text-primary-500" />
          <div className="text-left">
            <p
              className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-surface-400" : "text-surface-500"}`}
            >
              Referral ID
            </p>
            <p className="text-lg font-bold tracking-wide">
              {createdReferralId}
            </p>
          </div>
        </div>
        <p
          className={`mt-3 text-xs text-center max-w-lg ${isDark ? "text-surface-400" : "text-surface-500"}`}
        >
          Ask the patient to present this referral ID at the receiving hospital
          so staff can quickly find the referral.
        </p>
        <button
          onClick={() => {
            setForm(emptyForm);
            setCreatedReferralId("");
            setSubmitted(false);
            setStep(1);
            setEditPrefilled(false);
            if (isEditMode) {
              navigate("/referrals/new", { replace: true });
            }
          }}
          className="mt-6 px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Create Another Referral
        </button>
      </div>
    );
  }

  const card = `rounded-2xl border p-6 ${isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200"}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">{t("cr.title")}</h2>
        <p
          className={`text-xs mt-0.5 ${isDark ? "text-surface-400" : "text-surface-500"}`}
        >
          Referring from: <strong>{user?.facility}</strong> · {user?.name}
        </p>
        {isEditMode && (
          <p
            className={`text-xs mt-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}
          >
            Editing referral <strong>{editReferralId}</strong>. Saving will create
            an updated referral and remove the original.
          </p>
        )}
        {isEditMode && !editReferral && (
          <p className="text-xs mt-2 text-red-500">
            Could not load the selected referral for editing. You can still create
            a new referral.
          </p>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${step === 1 ? "bg-primary-500/15 text-primary-500" : isDark ? "text-surface-400" : "text-surface-500"}`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-primary-600 text-white" : isDark ? "bg-surface-800 text-surface-400" : "bg-surface-200 text-surface-500"}`}
          >
            1
          </span>
          {t("cr.patientSection")}
        </button>
        <div
          className={`w-8 h-px ${isDark ? "bg-surface-700" : "bg-surface-300"}`}
        />
        <button
          onClick={() => {
            if (validateStepOne()) {
              setStep(2);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${step === 2 ? "bg-primary-500/15 text-primary-500" : isDark ? "text-surface-400" : "text-surface-500"}`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-primary-600 text-white" : isDark ? "bg-surface-800 text-surface-400" : "bg-surface-200 text-surface-500"}`}
          >
            2
          </span>
          {t("cr.clinicalSection")}
        </button>
      </div>

      {/* Step 1: Patient Details */}
      {step === 1 && (
        <div className={card}>
          <h3 className="text-sm font-bold mb-5">{t("cr.patientSection")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={t("ref.patientName")}
              required
              value={form.patientName}
              onChange={(e) =>
                set("patientName", (e.target as HTMLInputElement).value)
              }
              error={errors.patientName}
              placeholder="Full name"
            />
            <FormField
              label={t("ref.dateOfBirth")}
              required
              type="date"
              value={form.dateOfBirth}
              onChange={(e) =>
                set("dateOfBirth", (e.target as HTMLInputElement).value)
              }
              error={errors.dateOfBirth}
            />
            <FormField
              label={t("ref.gender")}
              required
              as="select"
              value={form.gender}
              onChange={(e) =>
                set("gender", (e.target as HTMLSelectElement).value)
              }
              error={errors.gender}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
            <FormField
              label={t("ref.phone")}
              value={form.phone}
              onChange={(e) =>
                set("phone", (e.target as HTMLInputElement).value)
              }
              error={errors.phone}
              placeholder="+251..."
            />
          </div>

          {/* Read-only referring facility */}
          <div
            className={`mt-4 p-3 rounded-lg ${isDark ? "bg-surface-950 border border-surface-800" : "bg-surface-50 border border-surface-200"}`}
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-surface-500" : "text-surface-400"}`}
            >
              {t("ref.referringFacility")}
            </p>
            <p className="text-sm font-medium mt-0.5">
              {user?.facility}{" "}
              <span
                className={`text-[10px] ${isDark ? "text-surface-500" : "text-surface-400"}`}
              >
                (auto-filled, read-only)
              </span>
            </p>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={() => {
                if (!validateStepOne()) return;
                setStep(2);
              }}
              className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Next: Clinical Details →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Clinical Details */}
      {step === 2 && (
        <div className={card}>
          <h3 className="text-sm font-bold mb-5">{t("cr.clinicalSection")}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label={t("ref.priority")}
                required
                as="select"
                value={form.priority}
                onChange={(e) =>
                  set("priority", (e.target as HTMLSelectElement).value)
                }
                error={errors.priority}
                options={[
                  { value: "routine", label: "Routine" },
                  { value: "urgent", label: "Urgent" },
                  { value: "emergency", label: "Emergency" },
                ]}
              />
            </div>


            <FormField
              label={t("ref.reason")}
              required
              as="textarea"
              rows={2}
              value={form.reasonForReferral}
              onChange={(e) =>
                set(
                  "reasonForReferral",
                  (e.target as HTMLTextAreaElement).value,
                )
              }
              error={errors.reasonForReferral}
              placeholder="Why is this patient being referred?"
            />
            <FormField
              label={t("ref.clinicalSummary")}
              required
              as="textarea"
              rows={3}
              value={form.clinicalSummary}
              onChange={(e) =>
                set("clinicalSummary", (e.target as HTMLTextAreaElement).value)
              }
              error={errors.clinicalSummary}
              placeholder="History, examination findings, and investigations..."
            />
            <FormField
              label={t("ref.primaryDiagnosis")}
              required
              value={form.primaryDiagnosis}
              onChange={(e) =>
                set("primaryDiagnosis", (e.target as HTMLInputElement).value)
              }
              error={errors.primaryDiagnosis}
              placeholder="e.g. Pre-eclampsia with severe features"
            />
            <FormField
              label={t("ref.treatmentGiven")}
              as="textarea"
              rows={2}
              value={form.treatmentGiven}
              onChange={(e) =>
                set("treatmentGiven", (e.target as HTMLTextAreaElement).value)
              }
              placeholder="Treatment already provided before referral"
              hint="Optional"
            />

            {/* Optional fields */}
            <details
              className={`rounded-lg border p-3 ${isDark ? "border-surface-800" : "border-surface-200"}`}
            >
              <summary
                className={`text-xs font-semibold cursor-pointer ${isDark ? "text-surface-400" : "text-surface-500"}`}
              >
                Optional Clinical Fields
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormField
                  label="Vital Signs"
                  value={form.vitalSigns}
                  onChange={(e) =>
                    set("vitalSigns", (e.target as HTMLInputElement).value)
                  }
                  placeholder="BP, Pulse, Temp, SPO2..."
                />
                <FormField
                  label="Known Allergies"
                  value={form.allergies}
                  onChange={(e) =>
                    set("allergies", (e.target as HTMLInputElement).value)
                  }
                  placeholder="NKDA or list..."
                />
                <FormField
                  label="Past Medical History"
                  as="textarea"
                  rows={2}
                  value={form.pastMedicalHistory}
                  onChange={(e) =>
                    set(
                      "pastMedicalHistory",
                      (e.target as HTMLTextAreaElement).value,
                    )
                  }
                />
                <FormField
                  label="Current Medications"
                  as="textarea"
                  rows={2}
                  value={form.currentMedications}
                  onChange={(e) =>
                    set(
                      "currentMedications",
                      (e.target as HTMLTextAreaElement).value,
                    )
                  }
                />
              </div>
            </details>

            {/* Consent checkbox — RC-08 */}
            <div
              className={`p-4 rounded-lg border ${errors.consent ? "border-red-500" : isDark ? "border-surface-800" : "border-surface-200"} ${isDark ? "bg-surface-950" : "bg-surface-50"}`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary-600"
                />
                <span
                  className={`text-xs leading-relaxed ${isDark ? "text-surface-300" : "text-surface-700"}`}
                >
                  {t("ref.consent")}
                </span>
              </label>
              {errors.consent && (
                <p className="text-[11px] text-red-500 font-medium mt-2">
                  {errors.consent}
                </p>
              )}
            </div>

            {submitError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/15 border border-red-500/20 text-red-500 flex items-start gap-2">
                <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setStep(1)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? "border-surface-600 text-surface-300" : "border-surface-300"}`}
              >
                ← Back
              </button>
              <button
                onClick={() => handleSubmit("draft")}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? "border-surface-600 text-surface-300 hover:bg-surface-800" : "border-surface-300 text-surface-700 hover:bg-surface-100"} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? "Saving..." : isEditMode ? "Save Update as Draft" : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSubmit("pending")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <IconSend size={14} />
                )}
                {submitting ? "Submitting..." : isEditMode ? "Save Update & Submit for Routing" : "Submit for Routing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
