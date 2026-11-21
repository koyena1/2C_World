import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Send, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { OfferLetterCandidate } from '../../types/offerLetter';
import { useTheme } from '../../hooks/useTheme';

interface OfferLetterPreviewModalProps {
  isOpen: boolean;
  candidate: OfferLetterCandidate | null;
  onClose: () => void;
  onSendOrResend?: (candidate: OfferLetterCandidate) => void;
  onDownload?: (candidate: OfferLetterCandidate) => void;
  onOpenCandidate360?: (candidateCode: string) => void;
}

export const OfferLetterPreviewModal: React.FC<OfferLetterPreviewModalProps> = ({
  isOpen,
  candidate,
  onClose,
  onSendOrResend,
  onDownload,
  onOpenCandidate360,
}) => {
  const { isDark } = useTheme();

  if (!isOpen || !candidate) return null;

  const basicSalary = Math.round(candidate.grossSalaryMonthly * 0.5);
  const hra = Math.round(candidate.grossSalaryMonthly * 0.25);
  const specialAllowance = candidate.grossSalaryMonthly - (basicSalary + hra);
  const employerPf = Math.min(Math.round(basicSalary * 0.12), 1800);

  const getStatusBadge = () => {
    switch (candidate.offerLetterStatus) {
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Signed & e-Accepted
          </span>
        );
      case 'Sent But Not Signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Sent · Awaiting Signature
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Delivered to Candidate
          </span>
        );
      case 'Not Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Offer Letter Not Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Generation
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Formal Letter of Offer & Annexure
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reference: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">2C-OFFER-2026-{candidate.candidateCode.slice(-4)}</span> · Candidate: {candidate.candidateName}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload && onDownload(candidate)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
              title="Download Offer Letter PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
              title="Print Letter"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {candidate.offerLetterStatus !== 'Signed' && onSendOrResend && (
              <button
                onClick={() => {
                  onClose();
                  onSendOrResend(candidate);
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{candidate.offerLetterStatus === 'Not Sent' ? 'Send Letter' : 'Resend Letter'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - Document Preview Simulation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60">
          <div className="max-w-3xl mx-auto bg-white text-slate-850 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0">
            {/* Document Header with Corporate Branding */}
            <div className="flex justify-between items-start border-b-2 border-purple-600 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm tracking-wider">
                    2C
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                      2COMS Consulting Pvt Ltd
                    </h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                      Enterprise Workforce & Deputation Solutions
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Regd Office: Infinity Benchmark, 10th Floor, Salt Lake Sector V, Kolkata - 700091<br />
                  CIN: U74140WB1993PTC057790 | ISO 9001:2015 Certified
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-200 font-mono">
                  REF: 2C/{candidate.client.slice(0, 3).toUpperCase()}/{new Date().getFullYear()}/{candidate.candidateCode.slice(-4)}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Date: <strong className="text-slate-850">{candidate.letterGeneratedDate || '2026-10-01'}</strong>
                </p>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="mb-6 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-sm text-slate-900">{candidate.candidateName}</p>
              <p>Candidate ID: <span className="font-mono font-semibold">{candidate.candidateCode}</span></p>
              <p>Email: {candidate.email}</p>
              <p>Contact: {candidate.phone}</p>
              <p>Location: {candidate.location}, India</p>
            </div>

            {/* Subject */}
            <div className="mb-6 p-3 bg-slate-50 border-l-4 border-purple-600 rounded text-xs">
              <p className="font-bold text-slate-900">
                Subject: Offer of Employment as <span className="text-purple-700">{candidate.designation}</span> on Deputation with <span className="text-purple-700">{candidate.client}</span>
              </p>
            </div>

            {/* Letter Content Body */}
            <div className="text-xs text-slate-700 space-y-4 leading-relaxed">
              <p>
                Dear <strong>{candidate.candidateName}</strong>,
              </p>

              <p>
                Further to our discussions, 2COMS Consulting Pvt. Ltd. is pleased to offer you the position of{' '}
                <strong>{candidate.designation}</strong> in our Deputation Operations division. As mutually agreed, you will be deputed to our client organization{' '}
                <strong>{candidate.client}</strong> at their <strong>{candidate.location}</strong> facility.
              </p>

              <p>
                Your planned Date of Joining will be on or before <strong>{candidate.dateOfJoining}</strong>. Your employment will be governed by the standard terms and conditions of deputation as detailed below and in the enclosed compensation annexure.
              </p>

              {/* Compensation Summary Table */}
              <div className="my-5 rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <span>ANNEXURE A: COMPENSATION & BENEFIT STRUCTURE</span>
                  <span className="font-mono text-purple-700 font-bold">Annual CTC: ₹{candidate.annualCtc.toLocaleString('en-IN')}</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold">
                      <th className="px-4 py-2 text-left">Salary Component</th>
                      <th className="px-4 py-2 text-right">Monthly (INR)</th>
                      <th className="px-4 py-2 text-right">Annual (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="px-4 py-1.5">Basic Salary</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{basicSalary.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{(basicSalary * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-1.5">House Rent Allowance (HRA)</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{hra.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{(hra * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-1.5">Special / Flexi Allowance</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{specialAllowance.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-1.5 text-right font-mono">₹{(specialAllowance * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                      <td className="px-4 py-2">Gross Salary (A)</td>
                      <td className="px-4 py-2 text-right font-mono text-purple-700">₹{candidate.grossSalaryMonthly.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-right font-mono text-purple-700">₹{(candidate.grossSalaryMonthly * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-1.5 text-slate-600">Employer Provident Fund (PF)</td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-600">₹{employerPf.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-600">₹{(employerPf * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-purple-50 font-bold text-purple-900 border-t-2 border-purple-200">
                      <td className="px-4 py-2.5">Total Cost to Company (CTC)</td>
                      <td className="px-4 py-2.5 text-right font-mono">₹{(candidate.grossSalaryMonthly + employerPf).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-mono">₹{candidate.annualCtc.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Key Clauses */}
              <div className="space-y-2 text-[11px] text-slate-600">
                <p>
                  <strong>1. Pre-joining Verification:</strong> This offer is contingent upon successful statutory background verification including Aadhaar authentication, PAN verification, and Penny-drop bank validation.
                </p>
                <p>
                  <strong>2. Probation & Notice Period:</strong> You will be under probation for a period of 3 months from your joining date. Notice period during probation will be 15 days, and 30 days upon confirmation.
                </p>
                <p>
                  <strong>3. Confidentiality:</strong> You shall strictly maintain absolute confidentiality regarding client systems, proprietary workflows, and customer information.
                </p>
              </div>

              {/* Signatures & Execution Section */}
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[11px] text-slate-500 mb-4">Authorized Signatory for 2COMS:</p>
                  <div className="h-12 flex items-center">
                    <span className="font-serif italic font-bold text-lg text-slate-700">Sudip Banerjee</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs">Sudip Banerjee</p>
                  <p className="text-[10px] text-slate-500">Head of Deputation & HR Operations</p>
                  <p className="text-[10px] text-slate-400 font-mono">Digitally signed on {candidate.letterGeneratedDate}</p>
                </div>

                <div className="border-l border-slate-200 pl-8">
                  <p className="text-[11px] text-slate-500 mb-2">Candidate Acceptance & Acknowledgement:</p>
                  {candidate.offerLetterStatus === 'Signed' ? (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Digitally Signed by Candidate</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-mono">
                        Aadhaar eSign ID: 2C-ESIGN-8492019
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        Signed At: {candidate.signedAt || candidate.letterAcceptanceDate || 'Completed'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                      <p className="text-amber-800 font-semibold mb-1">
                        {candidate.offerLetterStatus === 'Not Sent' ? 'Offer Letter Not Dispatched Yet' : 'Awaiting Candidate Acceptance'}
                      </p>
                      <p className="text-[11px] text-amber-600">
                        Candidate will sign using OTP-based Aadhaar eSign link.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-2xl shrink-0">
          <div className="flex items-center gap-2">
            {onOpenCandidate360 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCandidate360(candidate.candidateCode);
                }}
                type="button"
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Candidate 360 View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => onDownload && onDownload(candidate)}
              type="button"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
