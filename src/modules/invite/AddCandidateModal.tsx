import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Check, 
  Send, 
  Copy, 
  AlertTriangle, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  Share2,
  Clock,
  Sparkles,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { CLIENT_LIST } from '../../data/mockOnboardingData';
import { Candidate } from '../../types/onboarding';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: (newCandidate: Partial<Candidate>) => Candidate | void;
  onOpenCandidate360?: (candidate: Candidate) => void;
}

// Client-specific onboarding compliance rules & SLAs
const CLIENT_ONBOARDING_RULES: Record<string, {
  sla: string;
  statutory: string[];
  notes: string;
  badge: string;
}> = {
  'Tata Consultancy Services': {
    sla: '3 Business Days',
    statutory: ['UIDAI Aadhaar OTP (Biometric)', 'Instant NSDL PAN Validation', 'NPCI Penny-Drop Bank Auth'],
    notes: 'Dual employment check & prior EPF service verification enabled automatically.',
    badge: 'Enterprise Strict',
  },
  'Wipro Limited': {
    sla: '4 Business Days',
    statutory: ['Aadhaar Paperless e-KYC', 'PAN Card Verification', 'Degree Highest Qualification'],
    notes: 'Digital signature consent on client offer annexure required.',
    badge: 'Standard IT SLA',
  },
  'Infosys': {
    sla: '2 Business Days',
    statutory: ['Aadhaar Digilocker Pull', 'Instant PAN Verification', 'Penny Drop Bank Verification', 'UAN Service History'],
    notes: 'Expedited fast-track onboarding active for deputation staff.',
    badge: 'Fast Track',
  },
  'HCL Technologies': {
    sla: '3 Business Days',
    statutory: ['Aadhaar QR Verification', 'PAN NSDL Check', 'Bank Cancelled Cheque / Statement'],
    notes: 'Statutory form 11 EPF declaration required.',
    badge: 'Standard SLA',
  },
  'Capgemini': {
    sla: '3 Business Days',
    statutory: ['Aadhaar Card Auth', 'PAN Card Auth', 'Bank Account Verification'],
    notes: 'Standard multinational IT services statutory rules applied.',
    badge: 'Standard SLA',
  },
  'Cognizant': {
    sla: '4 Business Days',
    statutory: ['Aadhaar Biometric / OTP', 'PAN NSDL', 'Cheque / Penny Drop', 'Address Proof'],
    notes: 'Mandatory criminal background check initiated on day 1.',
    badge: 'Compliance Strict',
  },
};

const SOURCING_CHANNELS = [
  'Naukri.com',
  'LinkedIn Recruiter',
  'Internal Referral',
  'Campus Placement Drive',
  'Staffing Vendor / Partner',
  'Direct Walk-in',
  'Foundit (Monster India)',
  'Indeed Recruiter',
  'Job Fair',
];

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onCandidateAdded,
  onOpenCandidate360,
}) => {
  const { isDark } = useTheme();

  // Stepper state: 1. Client Selection, 2. Candidate Contact Details, 3. Preview & Invite, 4. Success State
  const [step, setStep] = useState<number>(1);

  // Step 1: Client Selection & Optional Placement Details
  const [clientName, setClientName] = useState<string>('Tata Consultancy Services');
  const [showOptionalPlacement, setShowOptionalPlacement] = useState<boolean>(false);
  const [designation, setDesignation] = useState<string>('Senior Frontend Engineer');
  const [workLocation, setWorkLocation] = useState<string>('Bangalore - Whitefield');
  const [recruiterName, setRecruiterName] = useState<string>('Ananya Mukherjee');

  // Step 2: Mandatory Candidate Contact Details (Old app parameter parity)
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [sameAsContact, setSameAsContact] = useState<boolean>(true);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [source, setSource] = useState<string>('Naukri.com');
  const [sourceSearch, setSourceSearch] = useState<string>('');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState<boolean>(false);

  // Step 3: Omnichannel & Dispatch Channels
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<boolean>(false);

  // Validation & Error states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [createdCandidateRecord, setCreatedCandidateRecord] = useState<Candidate | null>(null);

  // Unsaved changes confirmation dialog
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState<boolean>(false);

  // Client-specific rule data
  const currentRules = useMemo(() => {
    return CLIENT_ONBOARDING_RULES[clientName] || {
      sla: '3 Business Days',
      statutory: ['UIDAI Aadhaar Verification', 'Instant NSDL PAN Validation', 'Penny-Drop Bank Verification'],
      notes: 'Standard 2COMS statutory onboarding guidelines applied.',
      badge: 'Default Compliance',
    };
  }, [clientName]);

  // Filtered source list
  const filteredSources = useMemo(() => {
    return SOURCING_CHANNELS.filter(s => 
      s.toLowerCase().includes(sourceSearch.toLowerCase())
    );
  }, [sourceSearch]);

  // Check if user has entered unsaved form data
  const hasUnsavedData = useMemo(() => {
    if (step === 4) return false;
    return Boolean(
      firstName.trim() ||
      lastName.trim() ||
      email.trim() ||
      contact.trim() ||
      emergencyContact.trim() ||
      (!sameAsContact && whatsappNumber.trim()) ||
      (step > 1)
    );
  }, [step, firstName, lastName, email, contact, emergencyContact, sameAsContact, whatsappNumber]);

  // Prevent background scrolling when modal is open & handle Esc key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirmation) {
          setShowDiscardConfirmation(false);
        } else if (hasUnsavedData) {
          setShowDiscardConfirmation(true);
        } else {
          handleForceClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, hasUnsavedData, showDiscardConfirmation]);

  // Attempt to close modal with unsaved check
  const handleAttemptClose = () => {
    if (hasUnsavedData) {
      setShowDiscardConfirmation(true);
    } else {
      handleForceClose();
    }
  };

  const handleForceClose = () => {
    setShowDiscardConfirmation(false);
    handleResetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Phone input sanitizer
  const sanitizePhone = (val: string) => val.replace(/[^\d+ ]/g, '');

  // Validation functions
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val: string) => val.replace(/\D/g, '').length >= 10;

  // Validation error messages
  const errors: Record<string, string> = {};
  if (!clientName.trim()) errors.clientName = 'Client Organization is required';
  if (!firstName.trim()) errors.firstName = 'Candidate First Name is required';
  if (!lastName.trim()) errors.lastName = 'Candidate Last Name is required';
  if (!email.trim()) {
    errors.email = 'Email Address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address (e.g. name@domain.com)';
  }
  if (!contact.trim()) {
    errors.contact = 'Contact Number is required';
  } else if (!isValidPhone(contact)) {
    errors.contact = 'Contact Number must contain at least 10 digits';
  }
  const effectiveWhatsapp = sameAsContact ? contact : whatsappNumber;
  if (!effectiveWhatsapp.trim()) {
    errors.whatsappNumber = 'WhatsApp Number is required';
  } else if (!isValidPhone(effectiveWhatsapp)) {
    errors.whatsappNumber = 'WhatsApp Number must contain at least 10 digits';
  }
  if (!emergencyContact.trim()) {
    errors.emergencyContact = 'Emergency Contact Number is required';
  } else if (!isValidPhone(emergencyContact)) {
    errors.emergencyContact = 'Emergency Contact Number must contain at least 10 digits';
  }
  if (!source.trim()) errors.source = 'Source is required';

  // Handle Contact change with auto-sync
  const handleContactChange = (val: string) => {
    const clean = sanitizePhone(val);
    setContact(clean);
    if (sameAsContact) {
      setWhatsappNumber(clean);
    }
    // Duplicate check simulation
    const rawDigits = clean.replace(/\D/g, '');
    if (rawDigits.includes('98201') || rawDigits.includes('99870') || rawDigits.includes('98765')) {
      setDuplicateWarning('Duplicate Alert: Mobile number matches existing record in 2COMS database (Candidate ID: 2C-2026-8941).');
    } else {
      setDuplicateWarning(null);
    }
  };

  // Handle Email change with duplicate check
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const low = val.toLowerCase();
    if (low.includes('sharma') || low.includes('priya') || low.includes('rahul.verma')) {
      setDuplicateWarning(`Duplicate Alert: Email "${val}" matches an existing candidate in the 2COMS talent pipeline.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsappNumber(sanitizePhone(val));
  };

  const generatedUrl = `https://connect.2coms.com/onboard/c/${(firstName || 'candidate').toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2500);
  };

  // Step 1 Continue check
  const handleStep1Continue = () => {
    setTouched(prev => ({ ...prev, clientName: true }));
    if (!clientName.trim()) return;
    setStep(2);
  };

  // Step 2 Continue check
  const handleStep2Continue = () => {
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      contact: true,
      whatsappNumber: true,
      emergencyContact: true,
      source: true,
    });

    if (
      errors.firstName ||
      errors.lastName ||
      errors.email ||
      errors.contact ||
      errors.whatsappNumber ||
      errors.emergencyContact ||
      errors.source
    ) {
      return;
    }

    setStep(3);
  };

  // Step 3 Send Invitation action
  const handleSendInvitation = () => {
    if (!sendWhatsApp && !sendEmail && !sendSms) {
      alert('Please select at least one dispatch channel (WhatsApp, Email, or SMS).');
      return;
    }

    const newCandData: Partial<Candidate> = {
      id: `cand-${Date.now()}`,
      userId: `2C-2026-${Math.floor(8950 + Math.random() * 50)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: contact.trim().startsWith('+91') ? contact.trim() : `+91 ${contact.trim()}`,
      whatsappNumber: (sameAsContact ? contact : whatsappNumber).trim(),
      emergencyContact: emergencyContact.trim(),
      clientName: clientName.trim(),
      designation: designation.trim() || 'Executive Trainee',
      workLocation: workLocation.trim() || 'Bangalore',
      source: source as any,
      recruiterName: recruiterName.trim() || 'Ananya Mukherjee',
      dateOfJoining: '2026-10-15',
      dateOfInterview: '2026-09-22',
      joiningStatus: 'Yet to Join',
      overallKycStatus: 'Not Started',
      pennyTestStatus: 'Not Sent',
      onboardingCompletionPct: 15,
      kycRecords: [],
      documents: [],
      letters: [],
      missingFields: ['Aadhaar', 'PAN', 'Bank Account', 'Signed Offer'],
    };

    const created = onCandidateAdded(newCandData);
    if (created) {
      setCreatedCandidateRecord(created as Candidate);
    } else {
      setCreatedCandidateRecord(newCandData as Candidate);
    }

    setStep(4); // Success step
  };

  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setContact('');
    setWhatsappNumber('');
    setSameAsContact(true);
    setEmergencyContact('');
    setSource('Naukri.com');
    setSourceSearch('');
    setTouched({});
    setDuplicateWarning(null);
    setStep(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleAttemptClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-candidate-modal-title"
    >
      {/* Centered Modal Card: ~800-900px wide (max-w-4xl = 896px), max 85-90% viewport height */}
      <div 
        className={`relative w-full max-w-4xl max-h-[88vh] sm:max-h-[90vh] shadow-2xl flex flex-col rounded-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Unsaved Changes Confirmation Dialog Overlay */}
        {showDiscardConfirmation && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className={`w-full max-w-sm rounded-xl p-5 border shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Discard Unsaved Changes?</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    You have entered candidate details. If you close this popup now, all entered information will be discarded.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirmation(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isDark ? 'border-slate-750 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
                >
                  Discard & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Header (Fixed, visible while scrolling) */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 rounded-lg ${
                isDark ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-sky-100 text-sky-700 border border-sky-200'
              }`}>
                <Share2 className="w-4 h-4" />
              </span>
              <div>
                <h2 id="add-candidate-modal-title" className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {step === 4 ? 'Invitation Dispatched Successfully' : 'Add Candidate & Send Invitation'}
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Standard candidate onboarding workflow with statutory compliance rules
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            aria-label="Close popup"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar (Fixed, visible while scrolling) */}
        {step < 4 && (
          <div className={`px-6 py-3 border-b shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-white'
          }`}>
            <div className="flex items-center justify-between text-xs font-medium">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 transition-colors ${step === 1 ? 'text-sky-500 font-bold' : step > 1 ? 'text-emerald-500 font-semibold hover:underline' : 'text-slate-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-sky-600 text-white' : step > 1 ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Step 1: Client Selection</span>
              </button>

              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>→</span>

              <button
                type="button"
                onClick={() => {
                  if (step > 2) setStep(2);
                }}
                disabled={step < 2}
                className={`flex items-center gap-1.5 transition-colors ${step === 2 ? 'text-sky-500 font-bold' : step > 2 ? 'text-emerald-500 font-semibold hover:underline' : 'text-slate-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-sky-600 text-white' : step > 2 ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span>Step 2: Candidate Contact Details</span>
              </button>

              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>→</span>

              <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-sky-500 font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-sky-600 text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                  3
                </span>
                <span>Step 3: Preview & Invite</span>
              </div>
            </div>

            <div className={`w-full h-1.5 rounded-full mt-2.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className={`flex-1 overflow-y-auto p-5 sm:p-7 text-xs space-y-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          
          {/* ========================================================================= */}
          {/* STEP 1: CLIENT SELECTION */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${
                isDark ? 'bg-sky-950/40 border-sky-800/80 text-sky-200' : 'bg-sky-50/80 border-sky-200/90 text-sky-950'
              }`}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className={`font-semibold text-xs ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>Step 1: Choose Client Organization</span>
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-sky-300/80' : 'text-sky-800'}`}>
                  Select the client organization to activate statutory compliance rules, verification SLAs, and mandatory document checklists.
                </p>
              </div>

              {/* Client Organization * (Preserved legacy required parameter) */}
              <div>
                <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Client Organization <span className="text-rose-500 font-bold">*</span>
                </label>
                <SelectMenu
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setTouched(prev => ({ ...prev, clientName: true }));
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-xs font-medium shadow-xs transition-colors ${
                    isDark 
                      ? 'bg-slate-950 border-slate-750 text-slate-100 focus:ring-2 focus:ring-sky-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500'
                  } ${
                    touched.clientName && errors.clientName
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                      : ''
                  }`}
                >
                  {CLIENT_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectMenu>
                {touched.clientName && errors.clientName && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.clientName}</p>
                )}
              </div>

              {/* Dynamic Client-Specific Onboarding Rules Box */}
              <div className={`border rounded-xl p-4 space-y-3 transition-all ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200/80'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Onboarding Rules: {clientName}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentRules.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className={`font-medium block text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verification Turnaround:</span>
                    <span className={`font-semibold flex items-center gap-1 mt-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      {currentRules.sla}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className={`font-medium block text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Statutory Gate:</span>
                    <span className={`font-semibold mt-1 block text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      Aadhaar + PAN + Bank Penny Drop
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Mandatory Statutory Verifications:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRules.statutory.map((rule, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border shadow-2xs font-medium ${
                          isDark ? 'bg-slate-900 border-slate-750 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>

                <p className={`text-[11px] italic pt-2 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  ℹ️ {currentRules.notes}
                </p>
              </div>

              {/* Optional Placement Details Collapsible Section */}
              <div className={`border rounded-xl overflow-hidden ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowOptionalPlacement(!showOptionalPlacement)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                    isDark ? 'bg-slate-950 hover:bg-slate-850' : 'bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Optional Placement Details
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Role, Location & Recruiter)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-sky-500 font-medium">
                    <span>{showOptionalPlacement ? 'Hide' : 'Expand'}</span>
                    {showOptionalPlacement ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {showOptionalPlacement && (
                  <div className={`p-4 border-t animate-in fade-in duration-150 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={`block font-medium mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Designation / Role Title <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                          placeholder="e.g. Senior Frontend Engineer"
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Work Location <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={workLocation}
                          onChange={(e) => setWorkLocation(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                          placeholder="e.g. Bangalore - Whitefield"
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Assigned Recruiter <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={recruiterName}
                          onChange={(e) => setRecruiterName(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                          placeholder="e.g. Ananya Mukherjee"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CANDIDATE CONTACT DETAILS (STRICT PARITY WITH ALL REQUIRED *) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Duplicate check warning */}
              {duplicateWarning && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 animate-in fade-in ${
                  isDark ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-xs">Duplicate Candidate Alert</span>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-amber-300/80' : 'text-amber-800'}`}>{duplicateWarning}</p>
                  </div>
                </div>
              )}

              {/* Row 1: Candidate First Name * & Candidate Last Name * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Candidate First Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setTouched(prev => ({ ...prev, firstName: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-xs transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                    } ${
                      touched.firstName && errors.firstName
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                        : 'focus:ring-2 focus:ring-sky-500'
                    }`}
                    placeholder="e.g. Rahul"
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Candidate Last Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setTouched(prev => ({ ...prev, lastName: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-xs transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                    } ${
                      touched.lastName && errors.lastName
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                        : 'focus:ring-2 focus:ring-sky-500'
                    }`}
                    placeholder="e.g. Sharma"
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email * & Contact * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`w-full border rounded-lg pl-8 pr-3 py-2 text-xs transition-colors ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                      } ${
                        touched.email && errors.email
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                          : 'focus:ring-2 focus:ring-sky-500'
                      }`}
                      placeholder="rahul.sharma@example.com"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>
                  )}
                  {/* Domain quick helpers */}
                  {!email.includes('@') && email.length > 2 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400">Quick fill:</span>
                      {['@gmail.com', '@outlook.com', '@yahoo.com'].map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => setEmail(`${email}${domain}`)}
                          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Contact Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => handleContactChange(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, contact: true }))}
                      className={`w-full border rounded-lg pl-8 pr-3 py-2 text-xs transition-colors ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                      } ${
                        touched.contact && errors.contact
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                          : 'focus:ring-2 focus:ring-sky-500'
                      }`}
                      placeholder="+91 98201 00000"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {touched.contact && errors.contact && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.contact}</p>
                  )}
                </div>
              </div>

              {/* Row 3: WhatsApp Number * (With "Same as Contact Number" checkbox) & Emergency Contact * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      WhatsApp Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <label className={`flex items-center gap-1.5 text-[11px] cursor-pointer select-none ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <input
                        type="checkbox"
                        checked={sameAsContact}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsContact(checked);
                          if (checked) {
                            setWhatsappNumber(contact);
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                      />
                      <span className={`font-medium ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>Same as Contact</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={sameAsContact ? contact : whatsappNumber}
                      disabled={sameAsContact}
                      onChange={(e) => handleWhatsappChange(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, whatsappNumber: true }))}
                      className={`w-full border rounded-lg pl-8 pr-3 py-2 text-xs transition-colors ${
                        sameAsContact 
                          ? (isDark ? 'bg-slate-950/50 border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed')
                          : isDark
                          ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900'
                      } ${
                        !sameAsContact && touched.whatsappNumber && errors.whatsappNumber
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                          : 'focus:ring-2 focus:ring-sky-500'
                      }`}
                      placeholder="+91 98201 00000"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {sameAsContact ? (
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      ✓ Auto-synced with contact number for WhatsApp notification
                    </p>
                  ) : (
                    touched.whatsappNumber && errors.whatsappNumber && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.whatsappNumber}</p>
                    )
                  )}
                </div>

                <div>
                  <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Emergency Contact Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => {
                        setEmergencyContact(sanitizePhone(e.target.value));
                        setTouched(prev => ({ ...prev, emergencyContact: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, emergencyContact: true }))}
                      className={`w-full border rounded-lg pl-8 pr-3 py-2 text-xs transition-colors ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                      } ${
                        touched.emergencyContact && errors.emergencyContact
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                          : 'focus:ring-2 focus:ring-sky-500'
                      }`}
                      placeholder="+91 98765 43210 (Parent / Spouse)"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {touched.emergencyContact && errors.emergencyContact && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.emergencyContact}</p>
                  )}
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Required by statutory compliance rules for background checks.
                  </p>
                </div>
              </div>

              {/* Row 4: Source * (Searchable Dropdown) */}
              <div className="relative">
                <label className={`block font-semibold mb-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Source <span className="text-rose-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-750 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  } ${
                    touched.source && errors.source
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'focus:ring-2 focus:ring-sky-500'
                  }`}
                >
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{source || 'Select sourcing channel...'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isSourceDropdownOpen && (
                  <div className={`absolute z-30 mt-1 w-full border rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-100 ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className={`p-2 border-b flex items-center gap-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        placeholder="Search sourcing channel..."
                        className={`w-full bg-transparent text-xs outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredSources.length > 0 ? (
                        filteredSources.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setSource(item);
                              setIsSourceDropdownOpen(false);
                              setSourceSearch('');
                              setTouched(prev => ({ ...prev, source: true }));
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs rounded flex items-center justify-between transition-colors ${
                              source === item 
                                ? (isDark ? 'bg-sky-950 text-sky-300 font-semibold' : 'bg-sky-50 text-sky-700 font-semibold')
                                : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-sky-50')
                            }`}
                          >
                            <span>{item}</span>
                            {source === item && <Check className="w-3.5 h-3.5 text-sky-500" />}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-[11px] text-slate-400 text-center">No channels found</p>
                      )}
                    </div>
                  </div>
                )}
                {touched.source && errors.source && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.source}</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PREVIEW & INVITE (REFERRAL URL, SHARE EXTERNAL, DISPATCH) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              
              {/* Share External & Candidate Referral Onboarding URL */}
              <div className={`border rounded-xl p-4 space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-500" />
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Share External
                    </span>
                  </div>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Candidate Referral Link</span>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Candidate Referral Onboarding URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedUrl}
                      className={`flex-1 border rounded-lg px-3 py-2 text-[11px] font-mono select-all ${
                        isDark ? 'bg-slate-900 border-slate-750 text-sky-400' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                        copyStatus 
                          ? 'bg-emerald-600 text-white' 
                          : isDark
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {copyStatus ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copyStatus ? 'Copied' : 'Copy Referral URL'}</span>
                    </button>
                  </div>
                </div>

                {/* External sharing shortcuts */}
                <div className={`pt-2.5 border-t flex items-center gap-2 text-[11px] ${isDark ? 'border-slate-800' : 'border-slate-200/80'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Share:</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hi ${firstName || 'Candidate'}, please complete your onboarding with ${clientName} at 2COMS: ${generatedUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium border transition-colors ${
                      isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-500" />
                    <span>WhatsApp Web</span>
                  </a>
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`Action Required: Onboarding for ${clientName}`)}&body=${encodeURIComponent(`Hi ${firstName},\n\nPlease complete your digital onboarding at: ${generatedUrl}\n\nRegards,\n2COMS Onboarding Desk`)}`}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium border transition-colors ${
                      isDark ? 'bg-sky-950/60 border-sky-800 text-sky-300 hover:bg-sky-900/60' : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200'
                    }`}
                  >
                    <Mail className="w-3 h-3 text-sky-500" />
                    <span>Default Mailer</span>
                  </a>
                </div>
              </div>

              {/* Notification Dispatch Channels */}
              <div className="space-y-2">
                <label className={`block font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Select Dispatch Channels: <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>(Select at least one)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                    sendWhatsApp 
                      ? (isDark ? 'border-emerald-600 bg-emerald-950/40' : 'border-emerald-300 bg-emerald-50/50')
                      : (isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className={`font-semibold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>WhatsApp</span>
                      <span className={`text-[10px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Verified DLT Gateway</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                    sendEmail 
                      ? (isDark ? 'border-sky-600 bg-sky-950/40' : 'border-sky-300 bg-sky-50/50')
                      : (isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <div>
                      <span className={`font-semibold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Email</span>
                      <span className={`text-[10px] font-medium ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>Official HTML Portal</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                    sendSms 
                      ? (isDark ? 'border-indigo-600 bg-indigo-950/40' : 'border-indigo-300 bg-indigo-50/50')
                      : (isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <span className={`font-semibold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>SMS</span>
                      <span className={`text-[10px] font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Instant Alert & OTP</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Dispatch Message Preview */}
              <div>
                <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Live Dispatch Message Preview:
                </label>
                <div className={`border rounded-xl p-4 space-y-2.5 ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className={`flex items-center justify-between text-[11px] font-semibold border-b pb-2 ${
                    isDark ? 'text-emerald-400 border-slate-800' : 'text-emerald-900 border-emerald-200/70'
                  }`}>
                    <span>To: <strong>{firstName || 'Candidate'}</strong> ({contact || '+91 ...'})</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      2COMS Verified Business
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Dear <strong>{firstName || 'Candidate'} {lastName}</strong>, congratulations on your selection with <strong>{clientName}</strong> through 2COMS!
                  </p>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Please initiate your 7-step statutory KYC onboarding (Aadhaar biometric, PAN verification, and bank details) using your unique link:
                  </p>
                  <div className={`text-[11px] font-mono p-2.5 rounded-lg border break-all select-all ${
                    isDark ? 'bg-slate-900 border-slate-750 text-sky-400' : 'bg-white border-emerald-200 text-sky-800'
                  }`}>
                    {generatedUrl}
                  </div>
                  <div className={`flex items-center justify-between text-[10px] pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Source: {source}</span>
                    <span>Assigned Recruiter: {recruiterName || '2COMS Desk'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS SCREEN (AFTER INVITATION DISPATCHED) */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="py-6 text-center space-y-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-xs ${
                isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              }`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Invitation Sent Successfully!
                </h3>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Onboarding credentials and access links have been transmitted via selected channels:
                </p>
              </div>

              {/* Selected channels indicators */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sendWhatsApp && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border ${
                    isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    WhatsApp Dispatched
                  </span>
                )}
                {sendEmail && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border ${
                    isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-800 border-sky-200'
                  }`}>
                    <Check className="w-3.5 h-3.5 text-sky-500" />
                    Email Delivered
                  </span>
                )}
                {sendSms && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border ${
                    isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}>
                    <Check className="w-3.5 h-3.5 text-indigo-500" />
                    SMS Dispatched
                  </span>
                )}
              </div>

              {/* Candidate summary card */}
              <div className={`p-4 rounded-xl border text-left max-w-lg mx-auto text-xs space-y-2.5 ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Candidate Name:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Client Organization:</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{clientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Contact Number:</span>
                  <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{contact}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>WhatsApp:</span>
                  <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{sameAsContact ? contact : whatsappNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Emergency Contact:</span>
                  <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{emergencyContact}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Source:</span>
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{source}</span>
                </div>

                <div className={`pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Onboarding URL:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedUrl}
                      className={`flex-1 border rounded-lg px-2.5 py-1.5 text-[10px] font-mono ${
                        isDark ? 'bg-slate-900 border-slate-750 text-sky-400' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        copyStatus 
                          ? 'bg-emerald-600 text-white' 
                          : isDark
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                      }`}
                    >
                      {copyStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copyStatus ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Post-send Action buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isDark ? 'bg-slate-800 border-slate-750 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Add Another Candidate</span>
                </button>
                {onOpenCandidate360 && createdCandidateRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCandidate360(createdCandidateRecord);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Open Candidate 360</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Done & Back to Directory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Persistent Footer (Fixed, visible while scrolling) */}
        {step < 4 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 border ${
                  isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAttemptClose}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors border ${
                  isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors border ${
                    isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Continue to Contact Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={handleStep2Continue}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Continue to Preview & Invite</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSendInvitation}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
