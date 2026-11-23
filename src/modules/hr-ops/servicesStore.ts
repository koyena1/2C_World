import { useSyncExternalStore } from 'react';
import {
  INITIAL_AGENT_MAPPING,
  INITIAL_LMS_CONFIG,
  INITIAL_TICKETS,
  type AgentMapping,
  type LmsConfig,
  type Ticket,
} from '../../data/mockServicesData';

/**
 * In-memory state for the Support Ticket and LMS pages (frontend simulation, resets on reload):
 * raised tickets, the category -> agent mapping, the LMS redirect settings, and a candidate to
 * prefill when a ticket is started from a candidate profile.
 */
interface State {
  /** Candidate to prefill on the Support Ticket page (set by Candidate 360, cleared once used). */
  ticketCandidate?: { id: string; name: string };
  tickets: Ticket[];
  mapping: AgentMapping[];
  lms: LmsConfig;
}

let state: State = { tickets: INITIAL_TICKETS, mapping: INITIAL_AGENT_MAPPING, lms: INITIAL_LMS_CONFIG };
const listeners = new Set<() => void>();

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const setTicketCandidate = (ticketCandidate?: { id: string; name: string }) => set({ ticketCandidate });
export const addTicket = (t: Ticket) => set({ tickets: [t, ...state.tickets] });
export const updateTicket = (id: string, patch: Partial<Ticket>) =>
  set({ tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
export const setAgentMapping = (mapping: AgentMapping[]) => set({ mapping });
export const setLmsConfig = (lms: LmsConfig) => set({ lms });
export const nextTicketId = () => `TKT-${1042 + state.tickets.length - INITIAL_TICKETS.length}`;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useServices = (): State => useSyncExternalStore(subscribe, () => state);
