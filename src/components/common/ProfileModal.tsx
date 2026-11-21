import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Mail, Pencil, ShieldCheck, UserRound, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ProfileModalUser {
  name: string;
  email?: string;
  roleLabel: string;
  /** Profile photo URL. Without one, a profile icon is shown. */
  photoUrl?: string;
}

export interface ProfileFormValues {
  name: string;
  email: string;
}

interface ProfileModalProps {
  open: boolean;
  user: ProfileModalUser;
  onClose: () => void;
  /** When provided, an Edit button lets the user change their own name and email (never the role). */
  onSave?: (values: ProfileFormValues) => void;
}

type FieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validate = (values: ProfileFormValues): FieldErrors => {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter a name (at least 2 characters).';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
};

const Row: React.FC<{ icon: React.ReactNode; label: string; htmlFor?: string; children: React.ReactNode }> = ({
  icon,
  label,
  htmlFor,
  children,
}) => (
  <div className="flex items-start justify-between gap-4 px-3.5 py-2.5 border-t first:border-t-0 border-[color:var(--popover-border)]">
    <label htmlFor={htmlFor} className="flex items-center gap-2.5 h-8 text-[13px] font-medium text-[color:var(--popover-muted)] shrink-0">
      {icon}
      {label}
    </label>
    <div className="text-[13px] font-semibold text-right min-w-0 flex-1 flex flex-col items-end justify-center min-h-8 break-words">
      {children}
    </div>
  </div>
);

const inputClass = (invalid: boolean) =>
  cn(
    'w-full h-8 px-2.5 rounded-lg border text-[13px] font-medium text-left outline-none transition-colors',
    'bg-[color:var(--popover-bg)] text-[color:var(--popover-fg)]',
    'focus-visible:ring-2 focus-visible:ring-sky-500/60',
    invalid ? 'border-rose-500' : 'border-[color:var(--popover-border)] focus-visible:border-sky-500'
  );

const ghostButton =
  'px-3.5 py-1.5 text-[13px] font-semibold rounded-lg text-[color:var(--popover-muted)] hover:bg-slate-500/10 focus-visible:outline-2 focus-visible:outline-sky-500';

/**
 * "My Profile" dialog: photo, name, role chip and a details card.
 * With `onSave`, Edit turns Name and Email into inputs (Role stays read-only) with Save / Cancel.
 * Closes on X, Close, backdrop or Escape (Escape / Cancel first leave edit mode).
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ open, user, onClose, onSave }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileFormValues>({ name: '', email: '' });
  const [errors, setErrors] = useState<FieldErrors>({});

  // Always start from view mode when the dialog opens.
  useEffect(() => {
    if (open) {
      setEditing(false);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editing) nameRef.current?.focus();
    else closeRef.current?.focus();
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editing) setEditing(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, editing, onClose]);

  if (!open) return null;

  const startEditing = () => {
    setDraft({ name: user.name, email: user.email ?? '' });
    setErrors({});
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave?.({ name: draft.name.trim(), email: draft.email.trim() });
    setEditing(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && !editing && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onSubmit={handleSave}
        noValidate
        className="dropdown-pop w-full max-w-xs sm:max-w-sm max-h-full overflow-y-auto rounded-2xl border shadow-2xl bg-[color:var(--popover-bg)] text-[color:var(--popover-fg)] border-[color:var(--popover-border)]"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--popover-border)]">
          <h2 id="profile-modal-title" className="text-base font-bold">My Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="p-1.5 -mr-1.5 rounded-lg text-[color:var(--popover-muted)] hover:bg-slate-500/10 focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-5 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ring-[3px] ring-sky-200 dark:ring-sky-800 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <UserRound className="w-12 h-12" aria-hidden />
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 max-w-full">
            <p className="text-xl font-bold tracking-tight min-w-0 break-words">{user.name}</p>
            {onSave && !editing && (
              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit profile"
                title="Edit name and email"
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800 dark:hover:bg-sky-900/60 focus-visible:outline-2 focus-visible:outline-sky-500"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>

          <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            {user.roleLabel}
          </span>

          <div className="w-full mt-4 rounded-xl border text-left border-[color:var(--popover-border)]">
            <Row icon={<UserRound className="w-4 h-4" />} label="Name" htmlFor="profile-name">
              {editing ? (
                <>
                  <input
                    id="profile-name"
                    ref={nameRef}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    aria-invalid={Boolean(errors.name)}
                    autoComplete="name"
                    className={inputClass(Boolean(errors.name))}
                  />
                  {errors.name && <span className="mt-1 text-[11px] font-medium text-rose-500 text-left w-full">{errors.name}</span>}
                </>
              ) : (
                user.name
              )}
            </Row>

            {(user.email || editing) && (
              <Row icon={<Mail className="w-4 h-4" />} label="Email" htmlFor="profile-email">
                {editing ? (
                  <>
                    <input
                      id="profile-email"
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      aria-invalid={Boolean(errors.email)}
                      autoComplete="email"
                      className={cn(inputClass(Boolean(errors.email)), 'font-mono text-xs')}
                    />
                    {errors.email && <span className="mt-1 text-[11px] font-medium text-rose-500 text-left w-full">{errors.email}</span>}
                  </>
                ) : (
                  <span className="font-mono text-xs">{user.email}</span>
                )}
              </Row>
            )}

            <Row icon={<ShieldCheck className="w-4 h-4" />} label="Role">
              <span className="flex items-center gap-1.5">
                {editing && <Lock className="w-3 h-3 text-[color:var(--popover-muted)]" aria-label="Read-only" />}
                {user.roleLabel}
              </span>
            </Row>
          </div>

          {editing && <p className="mt-2 text-[11px] text-[color:var(--popover-muted)]">Role can't be changed here.</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[color:var(--popover-border)]">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className={ghostButton}>
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Save changes
              </button>
            </>
          ) : (
            <button ref={closeRef} type="button" onClick={onClose} className={ghostButton}>
              Close
            </button>
          )}
        </div>
      </form>
    </div>,
    document.body
  );
};
