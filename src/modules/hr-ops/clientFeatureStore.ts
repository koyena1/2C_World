import { useSyncExternalStore } from 'react';

/**
 * Client-level feature switches (frontend simulation). Currently: the physical-signature feature
 * (requirement 13), enabled per client. Edited in User Settings -> Client Features.
 */
export const CLIENT_NAMES = [
  'Tata Consultancy Services',
  'Infosys Technologies',
  'HDFC Bank Ltd',
  'Flipkart Internet Pvt Ltd',
  'Larsen & Toubro Ltd',
  'Wipro Digital',
  'Reliance Retail Ltd',
];

let signatureEnabled: Record<string, boolean> = {
  'Tata Consultancy Services': true,
  'Infosys Technologies': true,
  'HDFC Bank Ltd': false,
  'Flipkart Internet Pvt Ltd': true,
  'Larsen & Toubro Ltd': false,
  'Wipro Digital': false,
  'Reliance Retail Ltd': false,
};
const listeners = new Set<() => void>();

export const setSignatureEnabled = (client: string, enabled: boolean) => {
  signatureEnabled = { ...signatureEnabled, [client]: enabled };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Map client name -> is the signature feature on. */
export const useSignatureEnabledMap = (): Record<string, boolean> => useSyncExternalStore(subscribe, () => signatureEnabled);
export const useIsSignatureEnabled = (client: string): boolean => Boolean(useSignatureEnabledMap()[client]);
