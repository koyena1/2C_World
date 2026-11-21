import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, MinusCircle, Ban, ArrowRightCircle, AlertOctagon } from 'lucide-react';
import { JoiningStatus, KycDocumentStatus, PennyTestStatus } from '../../types/onboarding';

interface StatusBadgeProps {
  type: 'joining' | 'kyc' | 'penny';
  status: JoiningStatus | KycDocumentStatus | PennyTestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (type === 'joining') {
    switch (status) {
      case 'Joined':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Joined
          </span>
        );
      case 'Yet to Join':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Yet to Join
          </span>
        );
      case 'Offer Accepted':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Offer Accepted
          </span>
        );
      case 'Verification In Progress':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Verifying
          </span>
        );
      case 'Deferred':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Deferred
          </span>
        );
      case 'Dropout':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Dropout
          </span>
        );
      case 'Absconded':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Absconded
          </span>
        );
      case 'Offer Dropped':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Dropped
          </span>
        );
    }
  }

  if (type === 'kyc') {
    switch (status) {
      case 'Verified':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Verified</span>
          </span>
        );
      case 'Pending Manual Review':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Manual Review</span>
          </span>
        );
      case 'API Mismatch':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>API Mismatch</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      case 'Skipped':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            <MinusCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Skipped</span>
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-slate-50 text-slate-500 border border-slate-200 ${sizeClasses}`}>
            <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Not Started</span>
          </span>
        );
    }
  }

  // Penny Drop / ₹1 Testing Status
  if (type === 'penny') {
    switch (status) {
      case 'Verified':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>₹1 Verified</span>
          </span>
        );
      case 'Initiated':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>₹1 Initiated</span>
          </span>
        );
      case 'Pending':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>₹1 Pending</span>
          </span>
        );
      case 'Mismatch':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>₹1 Mismatch</span>
          </span>
        );
      case 'Failed':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>₹1 Failed</span>
          </span>
        );
      case 'Not Sent':
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
            <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>₹1 Not Sent</span>
          </span>
        );
    }
  }

  return null;
};
