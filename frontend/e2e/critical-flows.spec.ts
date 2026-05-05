import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Garde une liste explicite des specs couvrant les parcours métier critiques.
 * Si un fichier est renommé ou supprimé, ce test échoue et force la mise à jour du registre.
 */
const CRITICAL_FLOW_SPEC_FILES = [
  'annonce-wizard-e2e.spec.ts',
  'consentement-management-e2e.spec.ts',
  'dashboard-kpis-e2e.spec.ts',
  'dossier-appointment-stable.spec.ts',
  'dossier-full-workflow.spec.ts',
  'dossier-message-stable.spec.ts',
  'dossier-state-machine-e2e.spec.ts',
  'duplicate-detection-e2e.spec.ts',
  'multi-tenant-e2e.spec.ts',
  'partie-prenante-crud-e2e.spec.ts',
  'workflow-stepper-e2e.spec.ts',
] as const;

test.describe('Registre des parcours critiques', () => {
  test('chaque spec critique est présente sur le disque', () => {
    const e2eDir = path.join(process.cwd(), 'e2e');
    for (const file of CRITICAL_FLOW_SPEC_FILES) {
      const full = path.join(e2eDir, file);
      expect(
        fs.existsSync(full),
        `Mettre à jour le registre ou restaurer le fichier : ${file}`
      ).toBe(true);
    }
  });
});
