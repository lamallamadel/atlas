/**
 * Rôles d'agence (étape 6). Même lecture que le serveur : `PRO` vaut `AGENT`, `SUPER_ADMIN` a les
 * droits d'un administrateur. Le front s'en sert pour masquer des actions ; le serveur décide.
 */
export type AgencyRole = 'ADMIN' | 'MANAGER' | 'AGENT';

export const AGENCY_ROLES: readonly AgencyRole[] = ['AGENT', 'MANAGER', 'ADMIN'];

export const AGENCY_ROLE_LABELS: Record<AgencyRole, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  AGENT: 'Agent',
};

/** Ce dont les règles ont besoin d'AuthService. */
export interface RoleSource {
  hasRole(role: string): boolean;
}

export function agencyRoleOf(auth: RoleSource): AgencyRole | null {
  if (auth.hasRole('ADMIN') || auth.hasRole('SUPER_ADMIN')) return 'ADMIN';
  if (auth.hasRole('MANAGER')) return 'MANAGER';
  if (auth.hasRole('AGENT') || auth.hasRole('PRO')) return 'AGENT';
  return null;
}

export function isManagerOrAdmin(auth: RoleSource): boolean {
  const role = agencyRoleOf(auth);
  return role === 'ADMIN' || role === 'MANAGER';
}

/** Rôles qu'un utilisateur peut inviter : tous pour l'admin, des agents pour le manager. */
export function invitableRoles(auth: RoleSource): AgencyRole[] {
  const role = agencyRoleOf(auth);
  if (role === 'ADMIN') return [...AGENCY_ROLES];
  if (role === 'MANAGER') return ['AGENT'];
  return [];
}
