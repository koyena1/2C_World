import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Loader2, Mail, MessageCircle, Printer, Smartphone, X } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { useRole } from '../../context/RoleContext';
import { cn } from '../../utils/cn';
import { logAudit } from '../hr-ops/auditStore';
import { CARD_PX_H, CARD_PX_W, drawCardFront, loadPhoto } from '../id-cards/idCardRender';

/* ------------------------------------------------------------------ */
/* Shared modal shell (sits above the Candidate Details popup)         */
/* ------------------------------------------------------------------ */

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, subtitle, onClose, footer, maxWidth = 'max-w-lg', children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('cc-card w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150', maxWidth)}>
        <header className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[color:var(--cc-divider)] shrink-0">
          <div className="min-w-0">
            <h2 className="cc-title text-sm font-bold">{title}</h2>
            {subtitle && <p className="cc-muted text-[11px] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary !w-8 !h-8 !px-0 shrink-0" aria-label="Close" title="Close">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5">{children}</div>
        <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 sm:px-5 py-3 border-t border-[color:var(--cc-divider)] shrink-0">{footer}</footer>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; htmlFor: string; error?: string; children: React.ReactNode; className?: string }> = ({ label, htmlFor, error, children, className }) => (
  <div className={cn('min-w-0', className)}>
    <label htmlFor={htmlFor} className="cc-label">{label}</label>
    {children}
    {error && <p role="alert" className="text-[11px] font-semibold mt-1 tone-bad tone-text">{error}</p>}
  </div>
);

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

/* ------------------------------------------------------------------ */
/* 1. Edit candidate                                                   */
/* ------------------------------------------------------------------ */

interface EditDialogProps {
  candidate: Candidate;
  onClose: () => void;
  onSave: (updated: Candidate) => void;
}

type EditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  emergencyContact: string;
  designation: string;
  department: string;
  workLocation: string;
  dateOfJoining: string;
  endOfContract: string;
  grossSalaryMonthly: string;
  recruiterName: string;
  bloodGroup: string;
  source: Candidate['source'];
};

const SOURCES: Candidate['source'][] = ['Naukri', 'LinkedIn', 'Internal Referral', 'Campus', 'Vendor'];

const toForm = (c: Candidate): EditForm => ({
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  phone: c.phone,
  whatsappNumber: c.whatsappNumber,
  emergencyContact: c.emergencyContact,
  designation: c.designation,
  department: c.department,
  workLocation: c.workLocation,
  dateOfJoining: c.dateOfJoining,
  endOfContract: c.endOfContract ?? '',
  grossSalaryMonthly: String(c.grossSalaryMonthly ?? ''),
  recruiterName: c.recruiterName,
  bloodGroup: c.bloodGroup ?? '',
  source: c.source,
});

const digitCount = (v: string) => v.replace(/\D/g, '').length;

const validateEdit = (f: EditForm): Partial<Record<keyof EditForm, string>> => {
  const e: Partial<Record<keyof EditForm, string>> = {};
  if (!f.firstName.trim()) e.firstName = 'First name is required.';
  if (!f.lastName.trim()) e.lastName = 'Last name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (digitCount(f.phone) < 10) e.phone = 'Enter a valid phone number (at least 10 digits).';
  if (f.whatsappNumber.trim() && digitCount(f.whatsappNumber) < 10) e.whatsappNumber = 'Enter a valid WhatsApp number.';
  if (!f.designation.trim()) e.designation = 'Designation is required.';
  if (!f.department.trim()) e.department = 'Department is required.';
  if (!f.workLocation.trim()) e.workLocation = 'Work location is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfJoining)) e.dateOfJoining = 'Select a valid joining date.';
  if (f.endOfContract && f.dateOfJoining && f.endOfContract < f.dateOfJoining) e.endOfContract = 'End of contract cannot be before the joining date.';
  const ctc = Number(f.grossSalaryMonthly);
  if (!Number.isFinite(ctc) || ctc <= 0) e.grossSalaryMonthly = 'Enter a monthly salary greater than 0.';
  if (!f.recruiterName.trim()) e.recruiterName = 'Recruiter is required.';
  return e;
};

export const EditCandidateDialog: React.FC<EditDialogProps> = ({ candidate, onClose, onSave }) => {
  const initial = useMemo(() => toForm(candidate), [candidate]);
  const [form, setForm] = useState<EditForm>(initial);
  const [touched, setTouched] = useState(false);
  const errors = validateEdit(form);
  const changed = (Object.keys(initial) as Array<keyof EditForm>).filter((k) => initial[k] !== form[k]);
  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const show = (k: keyof EditForm) => (touched ? errors[k] : undefined);

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0 || changed.length === 0) return;
    onSave({
      ...candidate,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsappNumber: form.whatsappNumber.trim() || form.phone.trim(),
      emergencyContact: form.emergencyContact.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      workLocation: form.workLocation.trim(),
      dateOfJoining: form.dateOfJoining,
      endOfContract: form.endOfContract || undefined,
      grossSalaryMonthly: Number(form.grossSalaryMonthly),
      recruiterName: form.recruiterName.trim(),
      bloodGroup: form.bloodGroup,
      source: form.source,
    });
  };

  const input = (key: keyof EditForm, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, className?: string) => (
    <Field label={label} htmlFor={`edit-${key}`} error={show(key)} className={className}>
      <input
        id={`edit-${key}`}
        value={form[key]}
        onChange={(e) => set(key, e.target.value as never)}
        aria-invalid={Boolean(show(key))}
        className="cc-input"
        {...extra}
      />
    </Field>
  );

  return (
    <Modal
      title="Edit Candidate"
      subtitle={`${fullName(candidate)} · ${candidate.userId}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <span className="cc-muted text-[11px] sm:mr-auto self-center">{changed.length ? `${changed.length} field${changed.length === 1 ? '' : 's'} changed` : 'No changes yet'}</span>
          <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary w-full sm:w-auto">Cancel</button>
          <button type="button" onClick={save} disabled={changed.length === 0} className="cc-btn cc-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {input('firstName', 'First name')}
        {input('lastName', 'Last name')}
        {input('email', 'Email address', { type: 'email', autoComplete: 'off' })}
        {input('phone', 'Contact phone', { type: 'tel' })}
        {input('whatsappNumber', 'WhatsApp number', { type: 'tel' })}
        {input('emergencyContact', 'Emergency contact')}
        {input('designation', 'Designation')}
        {input('department', 'Department')}
        {input('workLocation', 'Work location / branch')}
        {input('recruiterName', 'Assigned recruiter')}
        {input('dateOfJoining', 'Date of joining', { type: 'date' })}
        {input('endOfContract', 'End of contract', { type: 'date', min: form.dateOfJoining || undefined })}
        {input('grossSalaryMonthly', 'Gross monthly CTC (₹)', { type: 'number', min: 0, inputMode: 'numeric' })}
        <Field label="Blood group" htmlFor="edit-bloodGroup">
          <SelectMenu id="edit-bloodGroup" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} className="cc-input">
            <option value="">Not set</option>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </SelectMenu>
        </Field>
        <Field label="Candidate source" htmlFor="edit-source">
          <SelectMenu id="edit-source" value={form.source} onChange={(e) => set('source', e.target.value as Candidate['source'])} className="cc-input">
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectMenu>
        </Field>
      </div>
      <p className="cc-muted text-[11px] mt-3">Client, KYC records, letters and the User ID are managed elsewhere and are not editable here.</p>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Send notification                                                */
/* ------------------------------------------------------------------ */

type Channel = 'whatsapp' | 'sms' | 'email';

const CHANNELS: Array<{ id: Channel; label: string; icon: typeof Mail; target: (c: Candidate) => string }> = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, target: (c) => c.whatsappNumber || c.phone },
  { id: 'sms', label: 'SMS', icon: Smartphone, target: (c) => c.phone },
  { id: 'email', label: 'Email', icon: Mail, target: (c) => c.email },
];

const TEMPLATES: Array<{ id: string; label: string; body: string }> = [
  { id: 'welcome', label: 'Welcome & onboarding link', body: 'Hi {name}, welcome to 2COMS! Please complete your onboarding for {client} using your invite link. Your ID is {userId}.' },
  { id: 'documents', label: 'Pending documents reminder', body: 'Hi {name}, a few documents are still pending for your {client} onboarding. Please upload them at the earliest to avoid delays in joining.' },
  { id: 'kyc', label: 'KYC verification pending', body: 'Hi {name}, your KYC verification is pending. Kindly complete Aadhaar, PAN, bank and UAN verification so we can confirm your joining on {doj}.' },
  { id: 'joining', label: 'Joining date reminder', body: 'Hi {name}, this is a reminder that you are due to join {client} as {designation} on {doj}. Please carry your original documents.' },
  { id: 'custom', label: 'Custom message', body: '' },
];

const fillTemplate = (body: string, c: Candidate) =>
  body
    .replace(/\{name\}/g, c.firstName)
    .replace(/\{client\}/g, c.clientName)
    .replace(/\{userId\}/g, c.userId)
    .replace(/\{doj\}/g, c.dateOfJoining)
    .replace(/\{designation\}/g, c.designation);

interface NotifyDialogProps {
  candidate: Candidate;
  onClose: () => void;
  onSent: (message: string) => void;
}

export const SendNotificationDialog: React.FC<NotifyDialogProps> = ({ candidate, onClose, onSent }) => {
  const { actor } = useRole();
  const [channels, setChannels] = useState<Channel[]>(['whatsapp']);
  const [templateId, setTemplateId] = useState('welcome');
  const [message, setMessage] = useState(() => fillTemplate(TEMPLATES[0].body, candidate));
  const [subject, setSubject] = useState('Message from 2COMS Connect');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Channel[] | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toggle = (id: Channel) => setChannels((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t && id !== 'custom') setMessage(fillTemplate(t.body, candidate));
  };

  const channelError = touched && channels.length === 0 ? 'Select at least one channel.' : '';
  const messageError = touched && !message.trim() ? 'Write a message to send.' : '';
  const smsParts = Math.max(1, Math.ceil(message.length / 160));

  const send = () => {
    setTouched(true);
    if (channels.length === 0 || !message.trim()) return;
    setSending(true);
    timer.current = window.setTimeout(() => {
      const labels = channels.map((c) => CHANNELS.find((x) => x.id === c)!.label).join(', ');
      logAudit({
        area: 'candidate-directory',
        action: `Sent notification to ${fullName(candidate)} via ${labels}`,
        subjectId: candidate.id,
        actorId: actor.id,
        actorName: actor.name,
      });
      setSending(false);
      setResults(channels);
      onSent(`Notification sent to ${fullName(candidate)} via ${labels}.`);
    }, 800);
  };

  return (
    <Modal
      title="Send Notification"
      subtitle={`${fullName(candidate)} · ${candidate.userId}`}
      onClose={onClose}
      footer={
        results ? (
          <button type="button" onClick={onClose} className="cc-btn cc-btn-primary w-full sm:w-auto">Done</button>
        ) : (
          <>
            <button type="button" onClick={onClose} disabled={sending} className="cc-btn cc-btn-secondary w-full sm:w-auto">Cancel</button>
            <button type="button" onClick={send} disabled={sending} className="cc-btn cc-btn-primary w-full sm:w-auto">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </>
        )
      }
    >
      {results ? (
        <div className="flex flex-col gap-2" role="status">
          <p className="cc-title text-sm font-semibold">Notification delivered</p>
          <ul className="flex flex-col gap-2">
            {results.map((id) => {
              const ch = CHANNELS.find((c) => c.id === id)!;
              return (
                <li key={id} className="tone-good flex items-center gap-2.5 rounded-lg border border-[color:var(--cc-card-border)] px-3 py-2">
                  <span className="tone-chip w-7 h-7 rounded-md flex items-center justify-center shrink-0"><ch.icon className="w-3.5 h-3.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="cc-title block text-xs font-semibold">{ch.label}</span>
                    <span className="cc-muted block text-[11px] truncate">{ch.target(candidate)}</span>
                  </span>
                  <span className="tone-good tone-text inline-flex items-center gap-1 text-[11px] font-semibold"><Check className="w-3.5 h-3.5" aria-hidden />Sent</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="cc-label">Send via</legend>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
              {CHANNELS.map((ch) => {
                const on = channels.includes(ch.id);
                return (
                  <label
                    key={ch.id}
                    className={cn(
                      'cc-card-hover flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer min-w-0',
                      on ? 'border-[color:var(--cc-accent)] bg-[color:var(--cc-accent-soft)]' : 'border-[color:var(--cc-card-border)]'
                    )}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggle(ch.id)} className="mt-0.5 accent-[color:var(--cc-accent)]" />
                    <span className="min-w-0">
                      <span className="cc-title flex items-center gap-1.5 text-xs font-semibold"><ch.icon className="w-3.5 h-3.5" aria-hidden />{ch.label}</span>
                      <span className="cc-muted block text-[10px] truncate">{ch.target(candidate)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {channelError && <p role="alert" className="text-[11px] font-semibold mt-1 tone-bad tone-text">{channelError}</p>}
          </fieldset>

          <Field label="Template" htmlFor="notify-template">
            <SelectMenu id="notify-template" value={templateId} onChange={(e) => pickTemplate(e.target.value)} className="cc-input">
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </SelectMenu>
          </Field>

          {channels.includes('email') && (
            <Field label="Email subject" htmlFor="notify-subject">
              <input id="notify-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="cc-input" />
            </Field>
          )}

          <Field label="Message" htmlFor="notify-message" error={messageError}>
            <textarea
              id="notify-message"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTemplateId('custom');
              }}
              aria-invalid={Boolean(messageError)}
              className="cc-input !h-auto py-2 resize-y"
            />
            <p className="cc-muted text-[11px] mt-1 tabular-nums">
              {message.length} characters{channels.includes('sms') ? ` · ${smsParts} SMS part${smsParts === 1 ? '' : 's'}` : ''}
            </p>
          </Field>
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Generate ID card                                                 */
/* ------------------------------------------------------------------ */

interface IdCardDialogProps {
  candidate: Candidate;
  onClose: () => void;
  onGenerated: (message: string) => void;
}

export const IdCardDialog: React.FC<IdCardDialogProps> = ({ candidate, onClose, onGenerated }) => {
  const { actor } = useRole();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let live = true;
    loadPhoto(candidate.avatarUrl).then((photo) => {
      if (live && canvasRef.current) drawCardFront(canvasRef.current, candidate, photo);
    });
    return () => {
      live = false;
    };
  }, [candidate]);

  const fileName = `2COMS_ID_Card_${candidate.userId}.png`;
  const record = (what: string) => {
    logAudit({ area: 'candidate-directory', action: `${what} ID card for ${fullName(candidate)}`, subjectId: candidate.id, actorId: actor.id, actorName: actor.name });
    onGenerated(`${what} ID card for ${fullName(candidate)}.`);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      record('Downloaded');
    }, 'image/png');
  };

  const print = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.open('', '_blank', 'width=900,height=640');
    if (!w) {
      onGenerated('Allow pop-ups to print the ID card, or use Download instead.');
      return;
    }
    w.document.write(
      `<!doctype html><title>${fileName}</title><style>@page{size:85.6mm 54mm;margin:0}html,body{margin:0}img{width:85.6mm;height:54mm;display:block}</style><img src="${canvas.toDataURL('image/png')}" onload="window.focus();window.print()">`
    );
    w.document.close();
    record('Printed');
  };

  return (
    <Modal
      title="Generate ID Card"
      subtitle={`${fullName(candidate)} · ${candidate.userId}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary w-full sm:w-auto">Close</button>
          <button type="button" onClick={print} className="cc-btn cc-btn-secondary w-full sm:w-auto">
            <Printer className="w-3.5 h-3.5" aria-hidden />
            <span>Print</span>
          </button>
          <button type="button" onClick={download} className="cc-btn cc-btn-primary w-full sm:w-auto">
            <Download className="w-3.5 h-3.5" aria-hidden />
            <span>Download PNG</span>
          </button>
        </>
      }
    >
      <div className="rounded-xl p-3 sm:p-4 border border-[color:var(--panel-border)]" style={{ background: 'var(--panel-bg)' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`ID card preview for ${fullName(candidate)}`}
          className="w-full h-auto rounded-2xl shadow-lg"
          style={{ aspectRatio: `${CARD_PX_W} / ${CARD_PX_H}` }}
        />
      </div>
      <p className="cc-muted text-[11px] mt-3">Standard CR80 card size (85.6 × 54 mm). The QR code carries the candidate's User ID for gate verification.</p>
    </Modal>
  );
};
