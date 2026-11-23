/** Mock data for the header services: ticketing (req 19), LMS redirect (req 17) and payroll (req 18). */

export type TicketCategory = 'KYC & Documents' | 'Offer Letters' | 'Attendance' | 'Payroll' | 'Compliance (PF/ESIC)' | 'Access & Roles';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In progress' | 'Escalated' | 'Resolved';

export interface TicketAgent {
  id: string;
  name: string;
}

export const TICKET_AGENTS: TicketAgent[] = [
  { id: 'AG-01', name: 'Sourav Dutta' },
  { id: 'AG-02', name: 'Neha Kapoor' },
  { id: 'AG-03', name: 'Imran Sheikh' },
  { id: 'AG-04', name: 'Priyanka Rao' },
];

export interface AgentMapping {
  category: TicketCategory;
  agentId: string;
  /** Hours before an unresolved ticket escalates to the ticketing portal. */
  escalateAfterHours: number;
}

export const INITIAL_AGENT_MAPPING: AgentMapping[] = [
  { category: 'KYC & Documents', agentId: 'AG-01', escalateAfterHours: 24 },
  { category: 'Offer Letters', agentId: 'AG-02', escalateAfterHours: 24 },
  { category: 'Attendance', agentId: 'AG-03', escalateAfterHours: 12 },
  { category: 'Payroll', agentId: 'AG-04', escalateAfterHours: 8 },
  { category: 'Compliance (PF/ESIC)', agentId: 'AG-04', escalateAfterHours: 24 },
  { category: 'Access & Roles', agentId: 'AG-02', escalateAfterHours: 48 },
];

export const TICKET_CATEGORIES = INITIAL_AGENT_MAPPING.map((m) => m.category);

export interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  /** Candidate the ticket is about, if any. */
  candidateId?: string;
  candidateName?: string;
  agentId: string;
  raisedBy: string;
  raisedAt: string;
  /** Reference on the external ticketing portal once escalated. */
  portalRef?: string;
}

export const INITIAL_TICKETS: Ticket[] = [
  { id: 'TKT-1041', subject: 'PAN name mismatch needs manual override', category: 'KYC & Documents', priority: 'High', status: 'In progress', candidateName: 'Rahul Verma', agentId: 'AG-01', raisedBy: 'Vikram (Client HR)', raisedAt: '2026-10-03T10:20:00' },
  { id: 'TKT-1038', subject: 'Offer letter shows wrong joining location', category: 'Offer Letters', priority: 'Medium', status: 'Open', agentId: 'AG-02', raisedBy: 'Ananya (Ops Lead)', raisedAt: '2026-10-02T15:05:00' },
  { id: 'TKT-1029', subject: 'ESIC upload rejected for valid rows', category: 'Compliance (PF/ESIC)', priority: 'Critical', status: 'Escalated', agentId: 'AG-04', raisedBy: 'Ananya (Ops Lead)', raisedAt: '2026-09-30T09:40:00', portalRef: 'ESC-77412' },
];

export interface LmsConfig {
  url: string;
  enabled: boolean;
  /** Pass the logged-in user to the LMS (single sign-on). */
  singleSignOn: boolean;
  lastTested?: string;
}

export const INITIAL_LMS_CONFIG: LmsConfig = { url: '', enabled: false, singleSignOn: true };
