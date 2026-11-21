import React, { useEffect, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ShieldCheck,
  AlertCircle,
  FileX,
  Maximize2,
  Minimize2,
  Calendar,
  HardDrive,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  ExternalLink,
  Printer
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface DocumentPreviewData {
  id?: string;
  name: string;
  category?: string;
  docType?: 'Aadhaar' | 'PAN' | 'Bank' | 'UAN' | 'Education' | 'Experience' | 'Offer Letter' | 'Other';
  uploadedAt?: string;
  status?: string;
  size?: string;
  candidateName?: string;
  candidateId?: string;
  candidateDesignation?: string;
  clientName?: string;
  documentNumber?: string;
  isUploaded?: boolean;
  remarks?: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentPreviewData | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { isDark } = useTheme();
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Fit-to-width: measure the preview area and the rendered document (layout size, unaffected by transforms)
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const [docEl, setDocEl] = useState<HTMLDivElement | null>(null);
  const [innerW, setInnerW] = useState<number>(0);
  const [docSize, setDocSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!canvasEl) return;
    const measure = () => {
      const cs = getComputedStyle(canvasEl);
      setInnerW(canvasEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvasEl);
    return () => ro.disconnect();
  }, [canvasEl]);

  useEffect(() => {
    if (!docEl) return;
    const measure = () => setDocSize({ w: docEl.offsetWidth, h: docEl.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(docEl);
    return () => ro.disconnect();
  }, [docEl]);

  if (!isOpen || !document) return null;

  const isUploaded = document.isUploaded !== false && document.status !== 'Not Uploaded';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Determine doc type category
  const inferDocType = (): 'Aadhaar' | 'PAN' | 'Bank' | 'UAN' | 'Education' | 'Experience' | 'Offer Letter' | 'Other' => {
    if (document.docType) return document.docType;
    const lower = (document.name + ' ' + (document.category || '')).toLowerCase();
    if (lower.includes('aadhaar')) return 'Aadhaar';
    if (lower.includes('pan')) return 'PAN';
    if (lower.includes('cheque') || lower.includes('bank') || lower.includes('passbook')) return 'Bank';
    if (lower.includes('uan') || lower.includes('epfo') || lower.includes('pf')) return 'UAN';
    if (lower.includes('degree') || lower.includes('btech') || lower.includes('education') || lower.includes('marksheet')) return 'Education';
    if (lower.includes('relieving') || lower.includes('experience') || lower.includes('payslip')) return 'Experience';
    if (lower.includes('offer') || lower.includes('appointment')) return 'Offer Letter';
    return 'Other';
  };

  const detectedType = inferDocType();

  // The document scales down to the available width (never up); the zoom buttons zoom relative to that fit.
  const isRotated = rotation % 180 !== 0;
  const boxW = isRotated ? docSize.h : docSize.w;
  const boxH = isRotated ? docSize.w : docSize.h;
  const fit = boxW > 0 && innerW > 0 ? Math.min(1, innerW / boxW) : 1;
  const scale = fit * zoom;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-4xl h-[100dvh] sm:h-[88vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border max-sm:border-0 transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-slate-900 border-slate-750 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        } ${isFullscreen ? 'max-w-none w-screen h-screen sm:h-screen rounded-none sm:rounded-none' : ''}`}
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div
          className={`px-3 sm:px-5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:pt-3.5 pb-2.5 sm:pb-3.5 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4 shrink-0 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Document Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 order-1">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                isUploaded
                  ? isDark
                    ? 'bg-sky-950/60 border-sky-800 text-sky-400'
                    : 'bg-sky-50 border-sky-200 text-sky-600'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-400'
              }`}
            >
              {isUploaded ? <FileText className="w-5 h-5" /> : <FileX className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className={`font-bold text-sm truncate max-w-full ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {document.name}
                </h3>
                {document.category && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      isDark
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {document.category}
                  </span>
                )}
                {isUploaded ? (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                      document.status === 'Verified'
                        ? isDark
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{document.status || 'Verified'}</span>
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                      isDark
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span>Not Uploaded</span>
                  </span>
                )}
              </div>

              <div
                className={`text-[11px] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {document.candidateName && <span>Candidate: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{document.candidateName}</strong></span>}
                {document.documentNumber && <span><span aria-hidden className="hidden sm:inline">· </span>ID: <strong className="font-mono">{document.documentNumber}</strong></span>}
                {document.size && <span><span aria-hidden className="hidden sm:inline">· </span>Size: <strong className="font-mono">{document.size}</strong></span>}
                {document.uploadedAt && <span><span aria-hidden className="hidden sm:inline">· </span>Uploaded: <strong className="font-mono">{document.uploadedAt}</strong></span>}
              </div>
            </div>
          </div>

          {/* Action Toolbar & Close */}
          <div className="contents">
            {isUploaded && (
              <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-1.5 sm:shrink-0">
                {/* Zoom Controls */}
                <div
                  className={`flex items-center rounded-lg border p-0.5 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className={`p-1.5 rounded transition-colors ${
                      zoom <= 0.5
                        ? 'opacity-40 cursor-not-allowed'
                        : isDark
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className={`px-2 py-1 text-[11px] font-mono font-semibold rounded transition-colors ${
                      isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Reset Zoom to 100%"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    className={`p-1.5 rounded transition-colors ${
                      zoom >= 2.5
                        ? 'opacity-40 cursor-not-allowed'
                        : isDark
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Rotate 90 Degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`hidden sm:inline-flex p-1.5 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Download Document Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className={`hidden sm:flex px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors items-center gap-1.5 ${
                    downloadSuccess
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  }`}
                  title="Download File"
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 sm:p-1.5 rounded-lg transition-colors order-2 sm:order-3 shrink-0 sm:ml-1 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT VIEWING CANVAS                                                   */}
        {/* ========================================================================= */}
        <div
          ref={setCanvasEl}
          className={`flex-1 min-h-0 overflow-auto p-3 sm:p-8 flex relative select-none ${
            isDark ? 'bg-slate-950/80' : 'bg-slate-100'
          }`}
        >
          {!isUploaded ? (
            /* Document Not Uploaded State */
            <div className="m-auto max-w-md w-full text-center p-6 sm:p-8 rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <FileX className="w-8 h-8" />
              </div>
              <div>
                <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Document Not Uploaded
                </h4>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  The candidate ({document.candidateName || 'Candidate'}) has not uploaded their{' '}
                  <span className="font-semibold">{document.name}</span> yet.
                </p>
                {document.remarks && (
                  <p className="text-xs text-amber-400 mt-2 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    Status Note: {document.remarks}
                  </p>
                )}
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Close Preview
                </button>
              </div>
            </div>
          ) : (
            /* Realistic High-Fidelity Document Rendering Canvas */
            <div
              className="relative shrink-0 m-auto"
              style={{
                width: boxW * scale,
                height: boxH * scale,
                visibility: docSize.w > 0 ? 'visible' : 'hidden',
              }}
            >
              <div
                ref={setDocEl}
                className="absolute left-1/2 top-1/2 transition-transform duration-150 ease-out"
                style={{
                  width: 'max-content',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                }}
              >
              {/* RENDER BY DOCUMENT TYPE */}
              {detectedType === 'Aadhaar' && (
                <div className="w-[620px] rounded-2xl border-2 border-slate-300 bg-white text-slate-900 shadow-2xl p-6 relative overflow-hidden font-sans">
                  {/* Top Tricolor stripe */}
                  <div className="h-2 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600 absolute top-0 left-0" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-xs text-center leading-tight">
                        भारत Govt
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-700 tracking-wide">
                          भारत सरकार / Government of India
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700">
                          भारतीय विशिष्ट पहचान प्राधिकरण / UIDAI
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Unique Identification Authority
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        VERIFIED e-KYC
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="py-5 flex gap-5">
                    {/* Photo Box */}
                    <div className="w-28 h-36 rounded-lg border-2 border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 shrink-0">
                      <User className="w-16 h-16 text-slate-400" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold mt-1 text-slate-600">
                        Photo Verified
                      </span>
                    </div>

                    {/* Personal Details */}
                    <div className="flex-1 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Name / नाम:</span>
                        <p className="font-bold text-sm text-slate-900">{document.candidateName || 'Priya Sharma'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">DOB / जन्म तिथि:</span>
                          <p className="font-semibold text-slate-800">18/04/1996</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Gender / लिंग:</span>
                          <p className="font-semibold text-slate-800">Female / महिला</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Address / पता:</span>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          #402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103
                        </p>
                      </div>
                    </div>

                    {/* QR Code Simulation */}
                    <div className="w-24 h-24 border border-slate-300 bg-slate-50 p-1.5 rounded flex flex-col items-center justify-center shrink-0">
                      <div className="w-full h-full bg-slate-900/90 rounded flex items-center justify-center text-white text-[8px] font-mono text-center leading-none p-1">
                        SECURE QR CODE
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1">UIDAI CERT</span>
                    </div>
                  </div>

                  {/* Aadhaar Number Band */}
                  <div className="border-t border-b border-red-200 bg-red-50/60 py-2.5 text-center my-1 rounded">
                    <span className="font-mono text-xl font-black tracking-widest text-red-900">
                      {document.documentNumber ? `XXXX XXXX ${document.documentNumber.slice(-4)}` : 'XXXX XXXX 4921'}
                    </span>
                    <div className="text-[10px] font-bold text-red-800 tracking-wider mt-0.5">
                      मेरा आधार, मेरी पहचान
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="pt-2 flex items-center justify-between text-[9px] text-slate-500">
                    <span>Generated via UIDAI Aadhaar Verification Gateway</span>
                    <span className="font-mono">DigiLocker Authenticated · 2026-09-13</span>
                  </div>
                </div>
              )}

              {detectedType === 'PAN' && (
                <div className="w-[580px] rounded-2xl border-2 border-sky-300 bg-linear-to-br from-sky-50 via-white to-blue-50 text-slate-900 shadow-2xl p-6 relative overflow-hidden font-sans">
                  {/* Top Indian Government Header */}
                  <div className="flex items-center justify-between border-b-2 border-sky-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px] leading-tight text-center">
                        GOVT INDIA
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
                          INCOME TAX DEPARTMENT
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700">
                          आयकर विभाग / GOVT. OF INDIA
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black uppercase text-sky-900 tracking-wider">
                        PERMANENT ACCOUNT CARD
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">NSDL / NSDL e-Gov</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="py-4 flex gap-5">
                    {/* Photo & Hologram */}
                    <div className="space-y-2 shrink-0">
                      <div className="w-24 h-28 rounded border border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-14 h-14" />
                      </div>
                      <div className="w-24 h-5 rounded bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 border border-amber-400 text-[8px] font-bold text-amber-950 flex items-center justify-center tracking-widest">
                        ★ HOLOGRAM ★
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Name / नाम</span>
                        <p className="font-bold text-sm text-slate-900 uppercase">
                          {document.candidateName || 'PRIYA SHARMA'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Father's Name / पिता का नाम</span>
                        <p className="font-semibold text-slate-800 uppercase">RAMESH SHARMA</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Date of Birth / जन्म की तारीख</span>
                        <p className="font-mono font-semibold text-slate-800">18/04/1996</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Signature / हस्ताक्षर</span>
                        <div className="font-serif italic text-base text-blue-900">
                          {document.candidateName || 'Priya Sharma'}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="w-24 h-24 border border-slate-300 bg-slate-900 text-white p-1 rounded flex items-center justify-center text-[8px] font-mono text-center">
                      ITD SECURE QR
                    </div>
                  </div>

                  {/* PAN Number Band */}
                  <div className="bg-blue-900 text-white rounded-lg p-2.5 text-center shadow-inner">
                    <span className="text-[10px] uppercase tracking-wider block text-blue-200 font-semibold">
                      Permanent Account Number
                    </span>
                    <span className="font-mono text-xl font-black tracking-widest text-white">
                      {document.documentNumber || 'ABCPS1234D'}
                    </span>
                  </div>
                </div>
              )}

              {detectedType === 'Bank' && (
                <div className="w-[660px] rounded-xl border-2 border-slate-300 bg-[#f7f9fa] text-slate-900 shadow-2xl p-6 relative overflow-hidden font-sans">
                  {/* Watermark diagonal */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                    <span className="text-7xl font-black text-rose-600 rotate-[-25deg] tracking-widest">
                      CANCELLED
                    </span>
                  </div>

                  {/* Cheque Header */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-blue-700 text-white font-black text-sm flex items-center justify-center">
                        HDFC
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">HDFC BANK LTD</h4>
                        <p className="text-[11px] text-slate-600">
                          Koramangala 5th Block Branch, Bengaluru - 560095 · IFSC: <span className="font-mono font-bold">HDFC0000029</span>
                        </p>
                      </div>
                    </div>
                    <div className="border border-slate-400 rounded px-2 py-1 bg-white text-right font-mono text-xs">
                      <span className="text-[9px] text-slate-400 block">DATE</span>
                      <span className="font-bold">1 3 0 9 2 0 2 6</span>
                    </div>
                  </div>

                  {/* Payee Line */}
                  <div className="py-5 space-y-4">
                    <div className="flex items-end gap-2 border-b border-dashed border-slate-400 pb-1">
                      <span className="text-xs font-bold text-slate-700">PAY:</span>
                      <span className="text-sm font-bold text-rose-600 tracking-wider">
                        /// CANCELLED FOR SALARY ACCOUNT VERIFICATION ///
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1 border-b border-dashed border-slate-400 pb-1">
                        <span className="text-xs font-bold text-slate-700">RUPEES: </span>
                        <span className="text-xs font-mono text-slate-500">Not Applicable - Specimen Proof</span>
                      </div>
                      <div className="border-2 border-slate-600 px-4 py-1.5 rounded bg-white font-mono font-bold text-base">
                        ₹ ——————
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="border border-slate-400 rounded-md p-2 bg-white">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">A/C No.</span>
                        <span className="font-mono font-bold text-base text-slate-900">
                          {document.documentNumber || '0029104000192841'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Account Holder:</span>
                        <span className="font-bold text-xs uppercase text-slate-800">
                          {document.candidateName || 'Priya Sharma'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MICR Band Bottom */}
                  <div className="mt-4 pt-3 border-t border-slate-300 font-mono text-sm tracking-widest text-slate-700 flex justify-center gap-8 bg-slate-200/60 py-2 rounded">
                    <span>⑆000123⑆</span>
                    <span>560240012⑈</span>
                    <span>000123⑉ 10</span>
                  </div>
                </div>
              )}

              {detectedType === 'UAN' && (
                <div className="w-[600px] rounded-xl border-2 border-emerald-300 bg-white text-slate-900 shadow-2xl p-6 relative overflow-hidden font-sans">
                  <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-black text-[10px] flex items-center justify-center text-center">
                        EPFO INDIA
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-emerald-900">
                          EMPLOYEES' PROVIDENT FUND ORGANISATION
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          कर्मचारी भविष्य निधि संगठन / Ministry of Labour & Employment
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      UAN CARD
                    </span>
                  </div>

                  <div className="py-5 space-y-3 text-xs">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                        Universal Account Number (UAN)
                      </span>
                      <span className="font-mono text-2xl font-black text-emerald-950 tracking-widest">
                        {document.documentNumber || '101293847291'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-slate-50">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Member Name:</span>
                        <p className="font-bold text-sm text-slate-900">{document.candidateName || 'Priya Sharma'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Father's Name:</span>
                        <p className="font-semibold text-slate-800">Ramesh Sharma</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Aadhaar Seeded:</span>
                        <p className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">KYC Verification:</span>
                        <p className="font-semibold text-emerald-700">Digital Signature Approved</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Generated from EPFO Member Portal Unified Services</span>
                    <span className="font-mono">Last Sync: 2026-09-14</span>
                  </div>
                </div>
              )}

              {detectedType === 'Education' && (
                <div className="w-[620px] rounded-xl border-4 border-amber-600/40 bg-amber-50/40 text-slate-900 shadow-2xl p-8 relative overflow-hidden font-serif">
                  <div className="border-2 border-amber-700/60 p-6 rounded-lg text-center space-y-4 bg-white/90">
                    <div className="w-14 h-14 rounded-full border-2 border-amber-700 mx-auto flex items-center justify-center font-bold text-amber-900 text-xs">
                      SEAL
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-950 uppercase tracking-widest">
                        Visvesvaraya Technological University
                      </h3>
                      <p className="text-xs italic text-slate-600 mt-1">
                        State University of Karnataka, Established under VTU Act 1994
                      </p>
                    </div>

                    <div className="py-2">
                      <p className="text-xs text-slate-700">This is to certify that</p>
                      <h4 className="text-lg font-bold text-slate-900 uppercase tracking-wider my-1">
                        {document.candidateName || 'Priya Sharma'}
                      </h4>
                      <p className="text-xs text-slate-700">
                        has been duly admitted to the degree of
                      </p>
                      <h5 className="text-base font-bold text-amber-900 uppercase tracking-wide my-1">
                        Bachelor of Engineering in Computer Science & Engineering
                      </h5>
                      <p className="text-xs text-slate-700">
                        having passed the prescribed examinations in <strong>First Class with Distinction</strong>
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-6 border-t border-amber-200 text-xs font-sans">
                      <div className="text-left">
                        <span className="font-mono text-[10px] text-slate-500 block">Reg. No: 1VT14CS089</span>
                        <span className="text-[10px] text-slate-500">Bengaluru, Karnataka</span>
                      </div>
                      <div className="text-center">
                        <div className="font-serif italic text-sm text-slate-700">Registrar (Evaluation)</div>
                        <span className="text-[9px] text-slate-500 uppercase">Controller of Exams</span>
                      </div>
                      <div className="text-right">
                        <div className="font-serif italic text-sm text-slate-700">Vice-Chancellor</div>
                        <span className="text-[9px] text-slate-500 uppercase">Authorized Signatory</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detectedType === 'Offer Letter' && (
                <div className="w-[620px] rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xl p-8 relative overflow-hidden font-sans">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-sky-600 text-white font-bold flex items-center justify-center text-sm">
                        2C
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">2COMS Consulting Pvt. Ltd.</h4>
                        <p className="text-[10px] text-slate-500">Talent Acquisition & Deputation Services</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        Digitally Signed & Accepted
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">REF: 2C/OFFER/2026/8941</p>
                    </div>
                  </div>

                  <div className="py-5 space-y-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Dear {document.candidateName || 'Priya Sharma'},</p>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        We are pleased to offer you the position of{' '}
                        <strong>{document.candidateDesignation || 'Senior Frontend Engineer'}</strong> with deputation to{' '}
                        <strong>{document.clientName || 'Tata Consultancy Services Ltd'}</strong>.
                      </p>
                    </div>

                    <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                        Compensation & Terms Summary:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Designation:</span>
                          <p className="font-semibold">{document.candidateDesignation || 'Senior Frontend Engineer'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Client Deputation:</span>
                          <p className="font-semibold">{document.clientName || 'Tata Consultancy Services Ltd'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Annual Gross CTC:</span>
                          <p className="font-semibold text-emerald-700 font-mono">₹ 14,40,000 Per Annum</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Date of Joining:</span>
                          <p className="font-semibold font-mono">2026-09-18</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between text-xs">
                      <div>
                        <div className="font-serif italic text-sm text-slate-800">Ananya Mukherjee</div>
                        <p className="text-[10px] text-slate-500">Lead HR & Deputations · 2COMS</p>
                      </div>
                      <div className="border border-emerald-300 bg-emerald-50 p-2 rounded text-right">
                        <span className="text-[10px] font-bold text-emerald-800 block">Accepted by Candidate</span>
                        <span className="font-mono text-[9px] text-emerald-700">OTP Verified · IP: 103.21.14.88</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detectedType === 'Experience' && (
                <div className="w-[600px] rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xl p-8 relative overflow-hidden font-sans">
                  <div className="border-b pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 uppercase">Infosys Limited</h4>
                      <p className="text-[10px] text-slate-500">Electronics City, Hosur Road, Bengaluru</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">REF: INF/REL/2026/4102</span>
                  </div>

                  <div className="py-5 space-y-3 text-xs leading-relaxed text-slate-700">
                    <div className="text-center my-2">
                      <h3 className="font-bold text-sm uppercase text-slate-900 tracking-wider">
                        RELIEVING CUM EXPERIENCE CERTIFICATE
                      </h3>
                    </div>
                    <p>
                      This is to certify that <strong>{document.candidateName || 'Priya Sharma'}</strong> (Employee ID: INF-8921)
                      was employed with Infosys Limited from <strong>15th July 2021</strong> to <strong>31st August 2026</strong>.
                    </p>
                    <p>
                      At the time of leaving, their designation was <strong>Software Engineer - Frontend Specialist</strong>. During their
                      tenure, we found their conduct satisfactory and services commendable.
                    </p>
                    <p>
                      All company assets, ID credentials, and dues have been settled in full. We wish them all success in their future endeavors.
                    </p>
                    <div className="pt-6 flex justify-between items-end border-t">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Date of Issue: 31-Aug-2026</span>
                        <span className="text-[10px] text-slate-500">Bengaluru Development Center</span>
                      </div>
                      <div className="text-right">
                        <div className="font-serif italic text-sm text-slate-800">Authorized HR Signatory</div>
                        <span className="text-[9px] text-slate-500 uppercase">Infosys Human Resources</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detectedType === 'Other' && (
                <div className="w-[580px] rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xl p-8 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-sky-600" />
                      <h4 className="font-bold text-sm text-slate-900">{document.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Page 1 of 1</span>
                  </div>
                  <div className="py-6 text-center space-y-2 bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-800">{document.name}</p>
                    <p className="text-xs text-slate-500">
                      Uploaded by Candidate · Size: {document.size || '1.5 MB'}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">
                      Status: {document.status || 'Verified and Archived'}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div
          className={`px-3 sm:px-5 pt-2 sm:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0 text-xs ${
            isDark ? 'bg-slate-950/90 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Verified by 2COMS · AES-256 encrypted</span>
              <span className="hidden sm:inline">Document verified by 2COMS Onboarding Engine · Encrypted Storage (AES-256)</span>
            </span>
          </div>

          <div className="grid grid-cols-[auto_1fr] sm:flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 sm:py-1.5 rounded-lg border font-semibold transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>
            {isUploaded && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2.5 sm:py-1.5 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadSuccess ? 'Downloaded!' : 'Download Document'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
