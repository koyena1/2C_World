import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, GraduationCap, Lock } from 'lucide-react';
import { PageHeader } from '../../components/page/PageHeader';
import { SectionCard } from '../../components/page/SectionCard';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { FIELD } from '../hr-ops/formStyles';
import { setLmsConfig, useServices } from '../hr-ops/servicesStore';

const isValidUrl = (v: string) => /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}$/i.test(v.trim());

/** LMS hand-off: the redirect URL is set up here (Admin) and "Open LMS" simulates the redirect from the OB Portal. */
export const LmsPage: React.FC = () => {
  const { lms } = useServices();
  const access = useFeatureAccess('lms');
  const { actor } = useRole();
  const { message, showToast, hideToast } = useToast();
  const canEdit = access === 'manage';
  const [url, setUrl] = useState(lms.url);
  const [sso, setSso] = useState(lms.singleSignOn);
  const [touched, setTouched] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const valid = isValidUrl(url);
  const dirty = url !== lms.url || sso !== lms.singleSignOn;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    setLmsConfig({ ...lms, url: url.trim(), singleSignOn: sso, enabled: true });
    logAudit({ area: 'lms', action: `Set LMS redirect URL to ${url.trim()}`, actorId: actor.id, actorName: actor.name });
    showToast('LMS redirect saved.');
  };

  const open = () => {
    setRedirecting(true);
    timer.current = window.setTimeout(() => {
      setRedirecting(false);
      showToast(`Redirect to LMS simulated: ${lms.url}${lms.singleSignOn ? ' (signed in with SSO)' : ''}`);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        icon={GraduationCap}
        title="LMS"
        subtitle="Learning Management System · redirect from the OB Portal"
        actions={
          <button type="button" className="cc-btn cc-btn-primary" onClick={open} disabled={!lms.enabled || redirecting}>
            <ExternalLink className="w-3.5 h-3.5" />
            {redirecting ? 'Redirecting…' : 'Open LMS'}
          </button>
        }
      />

      <div className="cc-container cc-stack py-5">
        <div className={`tone-chip ${lms.enabled ? 'tone-good' : 'tone-warn'} rounded-xl p-3 text-xs`}>
          <p className="font-semibold">{lms.enabled ? 'Redirect is set up' : 'Redirect not set up yet'}</p>
          <p className="mt-0.5 opacity-90">
            {lms.enabled
              ? 'Employees and HR users are sent to the LMS from here.'
              : canEdit
                ? 'Enter the LMS address below and save to enable the redirect.'
                : 'An Admin needs to enter the LMS address before it can be opened.'}
          </p>
        </div>

        <SectionCard
          title="Redirect settings"
          subtitle="Where the OB Portal sends users"
          action={
            canEdit ? (
              <button type="button" className="cc-btn cc-btn-secondary" onClick={save} disabled={!dirty && lms.enabled}>
                Save redirect
              </button>
            ) : undefined
          }
        >
          <div className="space-y-4 text-xs max-w-2xl">
            <div>
              <label htmlFor="lms-url" className="font-semibold block mb-1">LMS address (URL)</label>
              <input
                id="lms-url"
                className={FIELD}
                value={url}
                placeholder="https://lms.yourcompany.com"
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={!canEdit}
              />
              {touched && canEdit && !valid && (
                <p className="text-rose-600 mt-1">Enter a full address starting with https://, for example https://lms.yourcompany.com</p>
              )}
              {!canEdit && (
                <p className="cc-muted mt-1 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" /> View only for your role.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={sso} onChange={(e) => setSso(e.target.checked)} disabled={!canEdit} className="mt-0.5" />
              <span>
                <span className="font-semibold block">Sign in automatically (single sign-on)</span>
                <span className="cc-muted">Passes the logged-in user to the LMS so they do not sign in again.</span>
              </span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="How the redirect works">
          <ol className="cc-muted text-xs list-decimal pl-5 space-y-1">
            <li>The user clicks Open LMS in the OB Portal.</li>
            <li>{sso ? 'A one-time sign-in token is created for that user.' : 'The user is sent to the LMS sign-in page.'}</li>
            <li>The LMS opens in a new tab with the user's courses.</li>
          </ol>
        </SectionCard>
      </div>
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
