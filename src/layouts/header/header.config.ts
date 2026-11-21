/** Header content: the signed-in persona shown in the profile dropdown, keyed by active role. */
export interface HeaderUser {
  name: string;
  initials: string;
  /** Text under the name, e.g. "Admin Role". */
  roleLabel: string;
}

export const HEADER_USERS: Record<string, HeaderUser> = {
  admin: { name: 'Ananya (Ops Lead)', initials: 'OP', roleLabel: 'Admin Role' },
  candidate: { name: 'Priya Sharma (Candidate)', initials: 'CD', roleLabel: 'Candidate Role' },
  hr: { name: 'Vikram (Client HR)', initials: 'HR', roleLabel: 'HR Role' },
};

export const DEFAULT_HEADER_USER_KEY = 'hr';
