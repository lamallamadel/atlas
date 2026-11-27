import { DEMO_ACCOUNTS } from './demo-accounts';
import { demoLanding, demoToken } from './demo-token';

function payload(token: string): Record<string, unknown> {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

describe('comptes démo', () => {
  it('couvrent 10 agences (directeur, manager, 2 agents), 10 propriétaires et un super-admin', () => {
    const agencies = new Set(DEMO_ACCOUNTS.filter(a => a.orgId.startsWith('DEMO-') && a.orgId !== 'DEMO-PLATFORM').map(a => a.orgId));
    expect(agencies.size).toBe(10);
    for (const org of agencies) {
      const roles = DEMO_ACCOUNTS.filter(a => a.orgId === org).flatMap(a => a.roles).sort();
      expect(roles).toEqual(['ADMIN', 'AGENT', 'AGENT', 'MANAGER']);
    }
    expect(DEMO_ACCOUNTS.filter(a => a.roles.includes('OWNER'))).toHaveLength(10);
    expect(DEMO_ACCOUNTS.filter(a => a.roles.includes('SUPER_ADMIN'))).toHaveLength(1);
    expect(new Set(DEMO_ACCOUNTS.map(a => a.sub)).size).toBe(DEMO_ACCOUNTS.length);
  });

  it('produit un jeton mock-demo dont la charge utile porte sub, rôles et organisation, accents compris', () => {
    const owner = DEMO_ACCOUNTS.find(a => a.sub === 'demo-owner-05')!;
    const token = demoToken(owner, 1000);
    expect(token.startsWith('mock-demo-')).toBe(true);
    expect(token.split('.')).toHaveLength(3);
    const p = payload(token);
    expect(p['sub']).toBe('demo-owner-05');
    expect(p['org_id']).toBe('OWN-DEMO05');
    expect(p['roles']).toEqual(['OWNER']);
    expect(p['name']).toBe('Leïla Berrada');
    expect(p['exp']).toBe(1000 + 8 * 3600);
  });

  it("envoie chaque profil sur sa page d'arrivée", () => {
    const by = (sub: string) => DEMO_ACCOUNTS.find(a => a.sub === sub)!;
    expect(demoLanding(by('demo-owner-01'))).toBe('/proprietaire');
    expect(demoLanding(by('demo-superadmin'))).toBe('/pro/moderation');
    expect(demoLanding(by('demo-detroit-agent1'))).toBe('/dashboard');
  });
});
