import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Send, Smartphone } from 'lucide-react';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { Chip, ProgressBar } from '../dashboard/command-center/shared';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit, useAuditLog, formatAuditTime } from '../hr-ops/auditStore';
import { cn } from '../../utils/cn';
import {
  INITIAL_NOTIFICATION_EVENTS,
  NOTIFICATION_DELIVERY_LOG,
  NOTIFICATION_VARIABLES,
  type NotificationChannel,
  type NotificationDeliveryRow,
  type NotificationEvent,
  type NotificationStatus,
} from '../../data/mockRegularizationData';

interface NotificationsSubmoduleProps {
  onShowToast: (msg: string) => void;
  clientName: string;
}

const AREA = 'app-notifications';

const STATUS_TONE: Record<NotificationStatus, 'good' | 'info' | 'warn' | 'muted'> = {
  Live: 'good',
  'Ready for QA': 'info',
  'In development': 'warn',
  Pending: 'muted',
};
const STATUS_ORDER: NotificationStatus[] = ['Live', 'Ready for QA', 'In development', 'Pending'];

const CHANNELS: { key: NotificationChannel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'push', label: 'Push', icon: Smartphone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
];

const SAMPLE: Record<string, string> = {
  '{employee_name}': 'Rohan',
  '{time}': '09:30 AM',
  '{date}': '05 Oct 2026',
  '{shift}': 'General',
  '{client}': 'Tata Consultancy Services',
  '{reason}': 'Insufficient proof',
  '{hours}': '2',
};

const render = (template: string) => template.replace(/\{[a-z_]+\}/g, (m) => SAMPLE[m] ?? m);

export const NotificationsSubmodule: React.FC<NotificationsSubmoduleProps> = ({ onShowToast, clientName }) => {
  const access = useFeatureAccess('app-notifications');
  const { actor } = useRole();
  const canManage = access === 'manage';

  const [events, setEvents] = useState<NotificationEvent[]>(INITIAL_NOTIFICATION_EVENTS);
  const [log, setLog] = useState<NotificationDeliveryRow[]>(NOTIFICATION_DELIVERY_LOG);
  const [selectedId, setSelectedId] = useState('N1');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const history = useAuditLog({ area: AREA });
  const { activeId, toggle, close, isActive } = useKpiDetail<NotificationStatus>();

  const selected = events.find((e) => e.id === selectedId) ?? events[0];
  const draftText = draft[selected.id] ?? selected.template;
  const dirty = draftText !== selected.template;

  const total = events.length;
  const completed = events.filter((e) => e.status === 'Live').length;
  const counts = STATUS_ORDER.map((s) => ({ s, n: events.filter((e) => e.status === s).length }));

  const kpiDetail: KpiDetailData | null = activeId ? {
    title: `${activeId} notifications`,
    columns: [
      { key: 'event', label: 'Event' },
      { key: 'status', label: 'Status' },
      { key: 'channels', label: 'Channels on' },
      { key: 'owner', label: 'Owner' },
    ],
    rows: events.filter((e) => e.status === activeId).map((e) => ({
      event: e.event,
      status: <Chip tone={STATUS_TONE[e.status]}>{e.status}</Chip>,
      channels: CHANNELS.filter((c) => e.channels[c.key]).map((c) => c.label).join(', ') || 'None',
      owner: e.owner,
    })),
  } : null;

  const audit = (action: string, subjectId: string) =>
    logAudit({ area: AREA, action, subjectId, actorId: actor.id, actorName: actor.name });

  const toggleChannel = (ev: NotificationEvent, ch: NotificationChannel) => {
    if (!canManage || ev.status !== 'Live') return;
    const next = !ev.channels[ch];
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, channels: { ...e.channels, [ch]: next } } : e)));
    audit(`${next ? 'Enabled' : 'Disabled'} ${ch} channel for "${ev.event}"`, ev.id);
    onShowToast(`${ev.event}: ${ch} ${next ? 'enabled' : 'disabled'}.`);
  };

  const saveTemplate = () => {
    if (!canManage) return;
    if (draftText.trim().length < 10) {
      onShowToast('Template is too short. Write at least 10 characters.');
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === selected.id ? { ...e, template: draftText.trim() } : e)));
    setDraft((d) => {
      const { [selected.id]: _omit, ...rest } = d;
      return rest;
    });
    audit(`Updated message template for "${selected.event}"`, selected.id);
    onShowToast(`Template for "${selected.event}" saved.`);
  };

  const sendTest = () => {
    if (!canManage) return;
    if (selected.status !== 'Live') {
      onShowToast(`"${selected.event}" is ${selected.status.toLowerCase()}; test sends are only available for live notifications.`);
      return;
    }
    const active = CHANNELS.filter((c) => selected.channels[c.key]);
    if (active.length === 0) {
      onShowToast('Enable at least one channel before sending a test notification.');
      return;
    }
    setLog((prev) => {
      const next = [...prev];
      active.forEach((c) => {
        const label = c.label;
        const idx = next.findIndex((r) => r.eventId === selected.id && r.channel === label);
        if (idx >= 0) {
          next[idx] = { ...next[idx], sent: next[idx].sent + 1, delivered: next[idx].delivered + 1, lastSent: '05 Oct 2026, 10:05 AM' };
        } else {
          next.push({ eventId: selected.id, event: selected.event, channel: label, sent: 1, delivered: 1, failed: 0, lastSent: '05 Oct 2026, 10:05 AM' });
        }
      });
      return next;
    });
    audit(`Sent test notification "${selected.event}" via ${active.map((c) => c.label).join(', ')}`, selected.id);
    onShowToast(`Test "${selected.event}" sent to ${actor.name} via ${active.map((c) => c.label).join(', ')}.`);
  };

  const totals = log.reduce((a, r) => ({ sent: a.sent + r.sent, delivered: a.delivered + r.delivered, failed: a.failed + r.failed }), { sent: 0, delivered: 0, failed: 0 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="cc-title text-lg font-bold tracking-tight">App Notifications: Attendance</h2>
          <p className="cc-muted text-xs mt-0.5">
            Catalogue of attendance push, email and SMS notifications. Clock-in and clock-out are complete; the rest are being built. Applies to {clientName}.
          </p>
        </div>
        {!canManage && <Chip tone="muted" className="self-start">View only</Chip>}
      </div>

      {/* Progress summary */}
      <SectionCard title="Build progress" subtitle="Tracked against the attendance notification list">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="cc-title font-semibold">{completed} of {total} notifications completed</span>
            <span className="cc-muted tabular-nums">{Math.round((completed / total) * 100)}%</span>
          </div>
          <ProgressBar value={(completed / total) * 100} tone="good" label="Notifications completed" />
          <div className="flex flex-wrap gap-2 pt-1">
            {counts.map(({ s, n }) => (
              <button key={s} type="button" onClick={() => toggle(s)} aria-pressed={isActive(s)} className={cn('rounded-full cursor-pointer', isActive(s) && 'ring-2 ring-[var(--cc-accent)]')}>
                <Chip tone={STATUS_TONE[s]}>{n} {s}</Chip>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
      <KpiDetailPanel detail={kpiDetail} onClose={close} />

      {/* Catalogue */}
      <SectionCard title="Notification catalogue" subtitle="Channels can be switched on only once a notification is live">
        <div className="cc-table-wrap">
          <table className="cc-table-stack cc-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                {CHANNELS.map((c) => <th key={c.key}>{c.label}</th>)}
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className={cn('cursor-pointer', e.id === selected.id && 'bg-[var(--cc-accent-soft)]')}
                  onClick={() => setSelectedId(e.id)}
                  aria-selected={e.id === selected.id}
                >
                  <td className="whitespace-nowrap cc-title font-semibold">
                    <span className="inline-flex items-center gap-2"><Bell className="w-3.5 h-3.5 cc-muted" />{e.event}</span>
                  </td>
                  <td><Chip tone={STATUS_TONE[e.status]}>{e.status}</Chip></td>
                  {CHANNELS.map((c) => {
                    const live = e.status === 'Live';
                    const on = e.channels[c.key];
                    return (
                      <td key={c.key} onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${c.label} for ${e.event}`}
                          disabled={!live || !canManage}
                          title={live ? undefined : 'Available once the notification is live'}
                          onClick={() => toggleChannel(e, c.key)}
                          className={cn('tone-good w-9 h-5 rounded-full relative transition-colors border disabled:opacity-40 disabled:cursor-not-allowed', on ? 'tone-fill border-transparent' : 'cc-track border-[var(--cc-card-border)]')}
                        >
                          <span className={cn('absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform', on && 'translate-x-4')} />
                        </button>
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap">{e.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Template + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <SectionCard title={`Message template: ${selected.event}`} subtitle="Select a row above to edit its template">
          <label className="cc-label" htmlFor="notif-template">Template</label>
          <textarea
            id="notif-template"
            rows={4}
            className="cc-input !h-auto py-2"
            value={draftText}
            disabled={!canManage}
            onChange={(e) => setDraft((d) => ({ ...d, [selected.id]: e.target.value }))}
          />
          <p className="cc-hint">Variables:</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {NOTIFICATION_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                disabled={!canManage}
                className="tone-info tone-chip px-2 py-0.5 rounded-md text-[11px] font-mono disabled:opacity-50"
                onClick={() => setDraft((d) => ({ ...d, [selected.id]: `${draftText} ${v}` }))}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" className="cc-btn cc-btn-primary" disabled={!canManage || !dirty} onClick={saveTemplate}>Save template</button>
            <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage} onClick={sendTest}>
              <Send className="w-3.5 h-3.5" /> Send test notification
            </button>
          </div>
          {!canManage && <p className="cc-muted text-[11px] mt-2">View only: Admin and HR manage notification settings.</p>}
        </SectionCard>

        <SectionCard title="Preview" subtitle="Sample values filled in">
          <div className="mx-auto w-[240px] rounded-[28px] border-4 border-[var(--cc-card-border)] p-3 bg-[var(--cc-row-hover)]">
            <div className="cc-muted text-[10px] text-center mb-3 tabular-nums">09:30 · Mon 5 Oct</div>
            <div className="cc-card p-2.5 text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="cc-accent-chip w-4 h-4 rounded flex items-center justify-center"><Bell className="w-2.5 h-2.5" /></span>
                <span className="cc-muted text-[10px] font-semibold uppercase tracking-wide">2COMS Connect · now</span>
              </div>
              <div className="cc-title text-xs font-bold">{selected.event}</div>
              <p className="cc-text text-[11px] mt-0.5 break-words">{render(draftText)}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Delivery log */}
      <SectionCard
        title="Delivery log"
        subtitle="Live notifications only"
        action={<Chip tone="muted">{totals.sent.toLocaleString('en-IN')} sent · {totals.failed.toLocaleString('en-IN')} failed</Chip>}
      >
        <div className="cc-table-wrap">
          <table className="cc-table-stack cc-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Channel</th>
                <th className="text-right">Sent</th>
                <th className="text-right">Delivered</th>
                <th className="text-right">Failed</th>
                <th>Last sent</th>
              </tr>
            </thead>
            <tbody>
              {log.map((r) => (
                <tr key={`${r.eventId}-${r.channel}`}>
                  <td className="whitespace-nowrap cc-title font-semibold">{r.event}</td>
                  <td>{r.channel}</td>
                  <td className="text-right tabular-nums">{r.sent.toLocaleString('en-IN')}</td>
                  <td className="text-right tabular-nums">{r.delivered.toLocaleString('en-IN')}</td>
                  <td className="text-right tabular-nums">
                    {r.failed > 0 ? <Chip tone="bad">{r.failed}</Chip> : 0}
                  </td>
                  <td className="whitespace-nowrap">{r.lastSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="cc-title text-xs font-bold mb-1.5">Recent changes</h3>
            <ul className="space-y-1 text-xs cc-text">
              {history.slice(0, 5).map((h) => (
                <li key={h.id}>{h.action} · {h.actorName} · {formatAuditTime(h.at)}</li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
