import { Page, APIRequestContext } from '@playwright/test';

export interface CleanupTask {
  type: 'dossier' | 'annonce' | 'message' | 'appointment' | 'partie-prenante' | 'consentement';
  id: number | string;
  orgId?: string;
}

export class TestDataCleanup {
  private cleanupTasks: CleanupTask[] = [];
  private baseUrl: string;

  constructor(
    private page: Page,
    private apiContext?: APIRequestContext
  ) {
    this.baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
  }

  trackDossier(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'dossier', id, orgId });
  }

  trackAnnonce(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'annonce', id, orgId });
  }

  trackMessage(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'message', id, orgId });
  }

  trackAppointment(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'appointment', id, orgId });
  }

  trackPartiePrenante(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'partie-prenante', id, orgId });
  }

  trackConsentement(id: number | string, orgId?: string): void {
    this.cleanupTasks.push({ type: 'consentement', id, orgId });
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const authData = await this.page.evaluate(() => {
      return {
        orgId: window.localStorage.getItem('org_id'),
        token: window.localStorage.getItem('auth_token'),
      };
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authData.orgId) {
      headers['X-Org-Id'] = authData.orgId;
    }

    if (authData.token) {
      headers['Authorization'] = `Bearer ${authData.token}`;
    }

    return headers;
  }

  private getEndpoint(task: CleanupTask): string {
    const endpoints: Record<string, string> = {
      'dossier': `/api/v1/dossiers/${task.id}`,
      'annonce': `/api/v1/annonces/${task.id}`,
      'message': `/api/v1/messages/${task.id}`,
      'appointment': `/api/v1/appointments/${task.id}`,
      'partie-prenante': `/api/v1/parties-prenantes/${task.id}`,
      'consentement': `/api/v1/consentements/${task.id}`,
    };

    return endpoints[task.type];
  }

  async cleanupAll(): Promise<void> {
    if (this.cleanupTasks.length === 0) {
      return;
    }

    const headers = await this.getAuthHeaders();
    const errors: string[] = [];

    const tasksToCleanup = [...this.cleanupTasks].reverse();

    for (const task of tasksToCleanup) {
      try {
        const endpoint = this.getEndpoint(task);
        const url = `${this.baseUrl}${endpoint}`;

        if (this.apiContext) {
          await this.apiContext.delete(url, { headers });
        } else {
          await this.page.evaluate(
            async ({ url, headers }) => {
              await fetch(url, {
                method: 'DELETE',
                headers,
              });
            },
            { url, headers }
          );
        }

        await this.page.waitForTimeout(100);
      } catch (error) {
        const errorMsg = `Failed to cleanup ${task.type} ${task.id}: ${error}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    this.cleanupTasks = [];

    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} error(s)`);
    }
  }

  async cleanupByType(type: CleanupTask['type']): Promise<void> {
    const tasksOfType = this.cleanupTasks.filter((t) => t.type === type);
    
    if (tasksOfType.length === 0) {
      return;
    }

    const headers = await this.getAuthHeaders();

    for (const task of tasksOfType.reverse()) {
      try {
        const endpoint = this.getEndpoint(task);
        const url = `${this.baseUrl}${endpoint}`;

        if (this.apiContext) {
          await this.apiContext.delete(url, { headers });
        } else {
          await this.page.evaluate(
            async ({ url, headers }) => {
              await fetch(url, {
                method: 'DELETE',
                headers,
              });
            },
            { url, headers }
          );
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${task.type} ${task.id}: ${error}`);
      }
    }

    this.cleanupTasks = this.cleanupTasks.filter((t) => t.type !== type);
  }

  getTrackedTasks(): CleanupTask[] {
    return [...this.cleanupTasks];
  }

  clearTracking(): void {
    this.cleanupTasks = [];
  }

  async cleanupLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      const keysToRemove = Object.keys(window.localStorage).filter(
        (key) => key.startsWith('test-') || key.startsWith('e2e-')
      );
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    });
  }

  async fullCleanup(): Promise<void> {
    await this.cleanupAll();
    await this.cleanupLocalStorage();
  }
}

export async function createTestDataCleanup(
  page: Page,
  apiContext?: APIRequestContext
): Promise<TestDataCleanup> {
  return new TestDataCleanup(page, apiContext);
}
