import { agencyRoleOf, invitableRoles, isManagerOrAdmin } from './agency-role';

const as = (...roles: string[]) => ({ hasRole: (r: string) => roles.includes(r) });

describe('agency roles', () => {
  it('reads PRO as AGENT and SUPER_ADMIN as ADMIN', () => {
    expect(agencyRoleOf(as('PRO'))).toBe('AGENT');
    expect(agencyRoleOf(as('AGENT'))).toBe('AGENT');
    expect(agencyRoleOf(as('MANAGER', 'PRO'))).toBe('MANAGER');
    expect(agencyRoleOf(as('SUPER_ADMIN'))).toBe('ADMIN');
    expect(agencyRoleOf(as('USER'))).toBeNull();
  });

  it('limits reassignment and invitations by role', () => {
    expect(isManagerOrAdmin(as('PRO'))).toBe(false);
    expect(isManagerOrAdmin(as('MANAGER'))).toBe(true);
    expect(invitableRoles(as('PRO'))).toEqual([]);
    expect(invitableRoles(as('MANAGER'))).toEqual(['AGENT']);
    expect(invitableRoles(as('ADMIN'))).toEqual(['AGENT', 'MANAGER', 'ADMIN']);
  });
});
