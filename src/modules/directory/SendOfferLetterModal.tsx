import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { OfferLetterCandidate } from '../../types/offerLetter';
import { useTheme } from '../../hooks/useTheme';

interface SendOfferLetterModalProps {
  isOpen: boolean;
  candidate: OfferLetterCandidate | null;
  onClose: () => void;
  onSendConfirm: (candidateId: string, channel: 'Email & WhatsApp' | 'Email' | 'WhatsApp') => void;
}

export const SendOfferLetterModal: React.FC<SendOfferLetterModalProps> = ({
  isOpen,
  candidate,
  onClose,
  onSendConfirm,
}) => {
  const { isDark } = useTheme();

  const [channel, setChannel] = useState<'Email & WhatsApp' | 'Email' | 'WhatsApp'>('Email & WhatsApp');
  const [includeSmsAlert, setIncludeSmsAlert] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !candidate) return null;

  const isResend = candidate.offerLetterStatus === 'Sent' || candidate.offerLetterStatus === 'Sent But Not Signed';

  const handleSend = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSendConfirm(candidate.id, channel);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isResend ? 'Resend Offer Letter & eSign Link' : 'Dispatch Formal Offer Letter'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate: <strong className="text-slate-800 dark:text-slate-200">{candidate.candidateName}</strong> ({candidate.candidateCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Candidate Card Summary */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Client & Location</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.client} · {candidate.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Designation</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.designation}</span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination Email</span>
                <span className="font-mono">{candidate.email}</span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination Mobile</span>
                <span className="font-mono">{candidate.phone}</span>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Select Dispatch Delivery Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('Email & WhatsApp')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  channel === 'Email & WhatsApp'
                    ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Both (Best)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Email PDF + WhatsApp interactive link
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel('Email')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  channel === 'Email'
                    ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Email Only</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Official offer letter PDF attachment
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  channel === 'WhatsApp'
                    ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Verified Green Badge Bot Message
                </p>
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
            isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Template: <strong className="font-mono">{candidate.templateName}</strong></span>
            </div>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded">
              Deputation Standard
            </span>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSmsAlert}
                onChange={(e) => setIncludeSmsAlert(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Trigger transactional SMS reminder with secure eSign portal link
              </span>
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Optional HR Custom Note for Candidate
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please sign by Friday 5 PM to confirm your seat for the Bangalore batch..."
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-purple-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Dispatching...' : isResend ? 'Resend Now' : 'Send Offer Letter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
