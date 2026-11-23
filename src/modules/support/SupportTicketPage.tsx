import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, CircleDot, LifeBuoy, Send, TriangleAlert } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { PageHeader } from '../../components/page/PageHeader';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiCard } from '../../components/page/KpiCard';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { formatAuditTime, logAudit } from '../hr-ops/auditStore';
import { FIELD } from '../hr-ops/formStyles';
import { addTicket, nextTicketId, setAgentMapping, setTicketCandidate, updateTicket, useServices } from '../hr-ops/servicesStore';
import { TICKET_AGENTS, TICKET_CATEGORIES, type TicketCategory, type TicketPriority } from '../../data/mockServicesData';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_TONE: Record<string, string> = {
  Open: 'tone-info',
  'In progress': 'tone-warn',
  Escalated: 'tone-bad',
  Resolved: 'tone-good',
};
const agentName = (id: string) => TICKET_AGENTS.find((a) => a.id === id)?.name ?? id;

/** Support Ticket: raise a ticket (auto-assigned to the mapped agent), track it, and escalate to the ticketing portal. */
export const SupportTicketPage: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const { tickets, mapping, ticketCandidate } = useServices();
  const access = useFeatureAccess('tickets');
  const { actor } = useRole();
  const { message, showToast, hideToast } = useToast();
  const canEdit = access === 'manage';
  const [tab, setTab] = useState(canEdit ? 'raise' : 'tickets');

  const [category, setCategory] = useState<TicketCategory>(TICKET_CATEGORIES[0]);
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [candidateId, setCandidateId] = useState(ticketCandidate?.id ?? '');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // A candidate chosen on another page (Candidate 360) is prefilled once, then cleared.
  useEffect(() => {
    if (ticketCandidate) {
      setCandidateId(ticketCandidate.id);
      setTicketCandidate(undefined);
    }
  }, [ticketCandidate]);

  const mapped = mapping.find((m) => m.category === category);
  const subjectError = submitted && subject.trim().length < 5 ? 'Give the ticket a short subject (at least 5 characters).' : '';
  const sorted = useMemo(() => [...candidates].sort((a, b) => a.firstName.localeCompare(b.firstName)), [candidates]);
  const count = (s: string) => tickets.filter((t) => t.status === s).length;

  const submit = () => {
    setSubmitted(true);
    if (subject.trim().length < 5 || !mapped) return;
    const cand = candidates.find((c) => c.id === candidateId);
    const id = nextTicketId();
    addTicket({
      id,
      subject: subject.trim(),
      category,
      priority,
      status: 'Open',
      candidateId: cand?.id,
      candidateName: cand ? `${cand.firstName} ${cand.lastName}` : undefined,
      agentId: mapped.agentId,
      raisedBy: actor.name,
      raisedAt: `${DASHBOARD_REFERENCE_DATE}T09:00:00`,
    });
    logAudit({ area: 'tickets', action: `Raised ${id}: ${subject.trim()}`, subjectId: cand?.id, actorId: actor.id, actorName: actor.name });
    showToast(`Ticket ${id} raised and assigned to ${agentName(mapped.agentId)}.`);
    setSubject('');
    setDetails('');
    setSubmitted(false);
    setTab('tickets');
  };

  const escalate = (id: string) => {
    const ref = `ESC-${77500 + tickets.length}`;
    updateTicket(id, { status: 'Escalated', portalRef: ref });
    logAudit({ area: 'tickets', action: `Escalated ${id} to the ticketing portal (${ref})`, actorId: actor.id, actorName: actor.name });
    showToast(`${id} escalated to the ticketing portal as ${ref}.`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader icon={LifeBuoy} title="Support Ticket" subtitle="Raise tickets, track them and escalate to the ticketing portal" />

      <div className="cc-container cc-stack py-5">
        <div className="cc-grid grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Open" value={count('Open')} detail="Waiting for an agent" icon={CircleDot} tone="info" />
          <KpiCard label="In progress" value={count('In progress')} detail="Being worked on" icon={LifeBuoy} tone="warn" />
          <KpiCard label="Escalated" value={count('Escalated')} detail="Sent to the ticketing portal" icon={TriangleAlert} tone="bad" />
          <KpiCard label="Resolved" value={count('Resolved')} detail="Closed tickets" icon={CheckCircle2} tone="good" />
        </div>

        <CategoryTabs
          value={tab}
          onChange={setTab}
          tabs={[
            ...(canEdit ? [{ value: 'raise', label: 'Raise ticket' }] : []),
            { value: 'tickets', label: 'Tickets', count: tickets.filter((t) => t.status !== 'Resolved').length },
            { value: 'mapping', label: 'Agent mapping' },
          ]}
        />

        {tab === 'raise' && (
          <SectionCard title="Raise a ticket" subtitle="It is assigned automatically to the agent mapped to the category">
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1" htmlFor="tk-cat">Category</label>
                <SelectMenu id="tk-cat" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={FIELD}>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectMenu>
                {mapped && (
                  <p className="cc-muted mt-1">
                    Will be assigned to <strong>{agentName(mapped.agentId)}</strong>; escalates after {mapped.escalateAfterHours} h.
                  </p>
                )}
              </div>
              <div>
                <label className="font-semibold block mb-1" htmlFor="tk-pri">Priority</label>
                <SelectMenu id="tk-pri" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={FIELD}>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </SelectMenu>
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1" htmlFor="tk-cand">Candidate (optional)</label>
                <SelectMenu id="tk-cand" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className={FIELD}>
                  <option value="">Not about a specific candidate</option>
                  {sorted.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} · {c.clientName}
                    </option>
                  ))}
                </SelectMenu>
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1" htmlFor="tk-sub">Subject</label>
                <input id="tk-sub" className={FIELD} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" />
                {subjectError && <p className="text-rose-600 mt-1">{subjectError}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1" htmlFor="tk-det">Details</label>
                <textarea id="tk-det" rows={3} className={FIELD} value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>
                  <Send className="w-3.5 h-3.5" /> Raise ticket
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'tickets' && (
          <SectionCard title="Tickets" subtitle="Newest first">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs">
                <thead className="cc-muted">
                  <tr>
                    {['Ticket', 'Subject', 'Category', 'Priority', 'Agent', 'Status', 'Raised', ''].map((h) => (
                      <th key={h} className="px-2 py-2 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="cc-divide">
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="px-2 py-2 font-semibold whitespace-nowrap">{t.id}</td>
                      <td className="px-2 py-2 min-w-[12rem]">
                        {t.subject}
                        {t.candidateName && <span className="cc-muted block">{t.candidateName}</span>}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">{t.category}</td>
                      <td className="px-2 py-2">{t.priority}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{agentName(t.agentId)}</td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className={`tone-chip ${STATUS_TONE[t.status]} rounded-full px-2 py-0.5 font-semibold`}>{t.status}</span>
                        {t.portalRef && <span className="cc-muted block">{t.portalRef}</span>}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap cc-muted">{formatAuditTime(t.raisedAt)}</td>
                      <td className="px-2 py-2">
                        {t.status !== 'Escalated' && t.status !== 'Resolved' && canEdit && (
                          <button type="button" className="cc-btn cc-btn-secondary whitespace-nowrap" onClick={() => escalate(t.id)}>
                            <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === 'mapping' && (
          <SectionCard
            title="Agent mapping"
            subtitle={`Each category goes to one agent. Tickets not resolved in time escalate to the ticketing portal.${canEdit ? '' : ' View only for your role.'}`}
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs">
                <thead className="cc-muted">
                  <tr>
                    {['Category', 'Agent', 'Escalates after'].map((h) => (
                      <th key={h} className="px-2 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="cc-divide">
                  {mapping.map((m) => (
                    <tr key={m.category}>
                      <td className="px-2 py-2 font-semibold whitespace-nowrap">{m.category}</td>
                      <td className="px-2 py-2 min-w-[10rem]">
                        <SelectMenu
                          aria-label={`Agent for ${m.category}`}
                          value={m.agentId}
                          disabled={!canEdit}
                          onChange={(e) => {
                            setAgentMapping(mapping.map((x) => (x.category === m.category ? { ...x, agentId: e.target.value } : x)));
                            logAudit({ area: 'tickets', action: `Mapped ${m.category} to ${agentName(e.target.value)}`, actorId: actor.id, actorName: actor.name });
                          }}
                          className={FIELD}
                        >
                          {TICKET_AGENTS.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </SelectMenu>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">{m.escalateAfterHours} hours</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
