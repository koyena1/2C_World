import React, { useState } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Lock,
  MessageCircle,
  HelpCircle,
  Building2,
  FileCheck
} from 'lucide-react';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface CandidateFacingWizardProps {
  layoutMode: 'desktop' | 'mobile';
  onLayoutModeToggle: (mode: 'desktop' | 'mobile') => void;
}

export const CandidateFacingWizard: React.FC<CandidateFacingWizardProps> = ({
  layoutMode,
  onLayoutModeToggle,
}) => {
  // Steps:
  // Step 0: Welcome Screen with Client Branding & Role Details
  // Step 1: Personal & Family Information
  // Step 2: Address Details (Current & Permanent, same as checkbox)
  // Step 3: Education & Experience Details
  // Step 4: Statutory & Bank Details (with instant penny drop feedback)
  // Step 5: Document Upload (Aadhaar, PAN, Cheque, Educational, Photo, Experience / Relieving)
  // Step 6: Offer Letter Review & E-sign / Consent declaration
  // Step 7: Final Submission & Confirmation with onboarding tracker status
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [signatureAccepted, setSignatureAccepted] = useState<boolean>(false);
  const [isPennyVerified, setIsPennyVerified] = useState<boolean>(true);
  const [pennyLoading, setPennyLoading] = useState<boolean>(false);
  const [sameAsCurrent, setSameAsCurrent] = useState<boolean>(true);

  // Candidate Self-Service Form State
  const [formData, setFormData] = useState({
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'Female',
    dob: '1996-04-18',
    bloodGroup: 'B+',
    fatherName: 'Ramesh Sharma',
    motherName: 'Sunita Sharma',
    maritalStatus: 'Single',
    email: 'priya.sharma@example.com',
    phone: '+91 98201 54321',
    whatsapp: '+91 98201 54321',
    currentAddress: '#402, Green Glen Layout, Bellandur, Bangalore, Karnataka 560103',
    permanentAddress: '#12, Sector 4, R.K. Puram, New Delhi 110022',
    highestDegree: 'B.Tech in Computer Science',
    collegeUniversity: 'VTU Karnataka',
    yearOfPassing: '2018',
    previousCompany: 'Wipro Digital',
    experienceYears: '4.5 Years',
    aadhaarNumber: '8492 4910 2834',
    panNumber: 'ABCPS1234D',
    uanNumber: '101293847291',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '0029104000192841',
    reAccountNumber: '0029104000192841',
    ifscCode: 'HDFC0000029',
    accountHolder: 'Priya Sharma',
  });

  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: boolean }>({
    aadhaar: true,
    pan: true,
    cheque: true,
    degree: true,
    photo: true,
    experience: false,
  });

  const stepsList = [
    { num: 1, title: 'Personal & Family' },
    { num: 2, title: 'Address Details' },
    { num: 3, title: 'Education & Experience' },
    { num: 4, title: 'Statutory & Bank' },
    { num: 5, title: 'Document Uploads' },
    { num: 6, title: 'Offer Letter & E-sign' },
    { num: 7, title: 'Submission Tracker' },
  ];

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTriggerPennyVerification = () => {
    setPennyLoading(true);
    setTimeout(() => {
      setPennyLoading(false);
      setIsPennyVerified(true);
    }, 1000);
  };

  const progressPct = currentStep === 0 ? 0 : Math.round((currentStep / 7) * 100);

  return (
    <div className="flex-1 min-h-screen p-4 sm:p-6 flex flex-col items-center">
      {/* Top Banner with Layout Mode Switcher */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Candidate Experience Preview
          </span>
          <h1 className="text-lg font-bold text-slate-900">
            Mobile-First 7-Step Self-Onboarding Portal
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={() => onLayoutModeToggle('desktop')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              layoutMode === 'desktop' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop View</span>
          </button>
          <button
            onClick={() => onLayoutModeToggle('mobile')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              layoutMode === 'mobile' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Device</span>
          </button>
        </div>
      </div>

      {/* Container: Mobile device frame or desktop card */}
      <div
        className={
          layoutMode === 'mobile'
            ? 'w-[380px] bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800 relative'
            : 'w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'
        }
      >
        {layoutMode === 'mobile' && (
          <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
        )}

        <div className="bg-white rounded-xl overflow-hidden flex flex-col min-h-[620px] justify-between">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                2C
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">2cworld</p>
                <p className="text-[10px] text-slate-500">Digital Onboarding Portal</p>
              </div>
            </div>

            {/* WhatsApp Assistance Button */}
            <a
              href="#whatsapp-help"
              onClick={(e) => {
                e.preventDefault();
                alert('Connecting you with 2COMS Onboarding Help Desk via WhatsApp (+91 98000 2COMS)');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Help Desk</span>
            </a>
          </div>

          {/* Stepper Progress Bar (Only during steps 1-6) */}
          {currentStep >= 1 && currentStep <= 6 && (
            <div className="px-4 py-2.5 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1.5">
                <span>Step {currentStep} of 6: {stepsList[currentStep - 1]?.title}</span>
                <span className="font-mono text-sky-700 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Wizard Body */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Step 0: Welcome Screen with Client Branding and Role Details */}
            {currentStep === 0 && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto border border-sky-200 text-sky-600">
                  <Building2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Welcome to Onboarding
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">
                    Congratulations, {formData.firstName}!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You have been selected for deputation with <strong>Tata Consultancy Services</strong> through 2COMS Consulting.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation:</span>
                    <span className="font-semibold text-slate-900">Senior Java Developer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Placement Hub:</span>
                    <span className="font-semibold text-slate-900">Bangalore - Whitefield</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joining Date:</span>
                    <span className="font-mono font-bold text-slate-900">October 01, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Recruiter:</span>
                    <span className="font-semibold text-slate-900">Ananya Mukherjee</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  This 7-step digital onboarding takes approximately <strong>5 minutes</strong>. Have your Aadhaar, PAN, and Bank details ready.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full max-w-sm py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    Start My Onboarding Journey
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Personal & Family Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 1: Personal & Family Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your legal identity details as stated on your government Aadhaar card.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Gender *</label>
                      <SelectMenu
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </SelectMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Blood Group</label>
                      <SelectMenu
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </SelectMenu>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Marital Status *</label>
                      <SelectMenu
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Other">Other</option>
                      </SelectMenu>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Father's Full Name *</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Mother's Full Name *</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Details (Current & Permanent, same as checkbox) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 2: Address Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official address for regulatory communication and equipment dispatch.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Current Residential Address *</label>
                    <textarea
                      rows={3}
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      placeholder="Flat No, Building, Street, Area, City, State, PIN"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameAsCurrent}
                        onChange={(e) => setSameAsCurrent(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">Permanent Address is same as Current Address</span>
                    </label>
                  </div>

                  {!sameAsCurrent && (
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Permanent Residential Address *</label>
                      <textarea
                        rows={3}
                        value={formData.permanentAddress}
                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                        placeholder="Permanent address, City, State, PIN"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Education & Experience Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 3: Education & Experience Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic qualifications and prior work history for background verification.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Highest Qualification Degree *</label>
                    <input
                      type="text"
                      value={formData.highestDegree}
                      onChange={(e) => setFormData({ ...formData, highestDegree: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      placeholder="e.g. B.Tech / BCA / MCA / B.Sc"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">College / University *</label>
                      <input
                        type="text"
                        value={formData.collegeUniversity}
                        onChange={(e) => setFormData({ ...formData, collegeUniversity: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Year of Passing *</label>
                      <input
                        type="text"
                        value={formData.yearOfPassing}
                        onChange={(e) => setFormData({ ...formData, yearOfPassing: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Previous Employer (If Any)</label>
                    <input
                      type="text"
                      value={formData.previousCompany}
                      onChange={(e) => setFormData({ ...formData, previousCompany: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      placeholder="e.g. Wipro Digital"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Total Relevant Work Experience</label>
                    <input
                      type="text"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                      placeholder="e.g. 4.5 Years"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Statutory & Bank Details (with instant penny drop feedback) */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 4: Statutory KYC & Bank Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct bank account verification via ₹1 instant IMPS deposit.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Aadhaar Number *</label>
                      <input
                        type="text"
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">PAN Card Number *</label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono uppercase bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Account Number *</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Re-enter Account Number *</label>
                      <input
                        type="text"
                        value={formData.reAccountNumber}
                        onChange={(e) => setFormData({ ...formData, reAccountNumber: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2.5 font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Bank IFSC Code *</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-mono uppercase bg-white"
                    />
                  </div>

                  {/* Instant Penny Drop Feedback Card */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">₹1.00 Penny Drop Verification Succeeded</span>
                        <p className="text-[11px] text-emerald-800">
                          Beneficiary verified: <strong>PRIYA SHARMA</strong> · Match: 100%
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerPennyVerification}
                      disabled={pennyLoading}
                      className="text-[10px] text-emerald-800 bg-white border border-emerald-300 px-2 py-1 rounded font-semibold hover:bg-emerald-100"
                    >
                      {pennyLoading ? 'Verifying...' : 'Re-test'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload (Aadhaar, PAN, Cheque, Educational, Photo, Experience) */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 5: Document Upload Repository</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload clear scans or photos (JPG, PNG, or PDF · Max 5MB per file).
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { key: 'aadhaar', title: 'Aadhaar Card (Front & Back)', desc: 'Clear legible scan' },
                    { key: 'pan', title: 'PAN Card Copy', desc: 'Government tax card' },
                    { key: 'cheque', title: 'Cancelled Cheque or Bank Passbook', desc: 'Showing Name & IFSC' },
                    { key: 'degree', title: 'Degree Certificate / Marksheet', desc: 'Highest qualification' },
                    { key: 'photo', title: 'Recent Passport Size Photograph', desc: 'White background' },
                    { key: 'experience', title: 'Experience / Relieving Letter', desc: 'From last employer (if applicable)' },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      className="p-3 border border-slate-200 rounded-lg bg-slate-50/70 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <p className="text-[10px] text-slate-400">{doc.desc}</p>
                        </div>
                      </div>

                      {uploadedDocs[doc.key] ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Uploaded</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadedDocs({ ...uploadedDocs, [doc.key]: true })}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Offer Letter Review & E-sign / Consent declaration */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 6: Digital Offer Letter & E-Sign</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your deputation appointment letter and provide legally binding digital consent.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs max-h-56 overflow-y-auto">
                  <h4 className="font-bold text-slate-900 text-sm">2COMS Consulting Deputation Contract</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Dear Priya Sharma, we are pleased to confirm your appointment as <strong>Senior Java Developer</strong> deputed to <strong>Tata Consultancy Services (Bangalore)</strong> starting from <strong>October 01, 2026</strong>.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Your monthly gross salary will be INR 95,000/- with statutory PF, ESIC, and Medical Benefits under the 2COMS Onboarding Framework.
                  </p>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none text-sky-950 font-medium">
                    <input
                      type="checkbox"
                      checked={signatureAccepted}
                      onChange={(e) => setSignatureAccepted(e.target.checked)}
                      className="rounded text-sky-600 mt-0.5 h-4 w-4"
                    />
                    <span>
                      I hereby accept the deputation appointment terms and confirm all submitted documents are accurate.
                    </span>
                  </label>
                  <p className="text-[11px] text-sky-800 ml-6">
                    Aadhaar OTP / Timestamp: 2026-09-24 recorded as legal electronic signature.
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Final Submission & Confirmation with Onboarding Tracker Status */}
            {currentStep === 7 && (
              <div className="py-6 text-center space-y-5">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Onboarding Dossier Submitted!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Your candidate profile has been transmitted to 2COMS and TCS HR SPOC for Day 1 badge issuance.
                  </p>
                </div>

                {/* Onboarding Tracker Milestone Status */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-3">
                  <span className="font-bold text-slate-900 block uppercase text-[11px] tracking-wider text-slate-500">
                    Milestone Progress Tracker:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Candidate Self-Onboarding Completed</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded">Done</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Statutory KYC & ₹1 Penny Verified</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded">Passed</span>
                    </div>
                    <div className="flex items-center justify-between text-sky-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>Client HR SPOC Final Clearance</span>
                      </span>
                      <span className="text-[10px] bg-sky-100 px-1.5 py-0.2 rounded">In Review</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Day 1 Campus Reporting (Oct 01, 2026)</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">Upcoming</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                  >
                    Return to Welcome Screen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer Controls */}
          {currentStep >= 1 && currentStep <= 6 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Save & Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!signatureAccepted}
                  onClick={handleNext}
                  className={`px-5 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors ${
                    signatureAccepted
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Offer & Submit</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
