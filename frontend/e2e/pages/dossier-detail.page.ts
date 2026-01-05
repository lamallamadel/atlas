import { Page, Locator } from '@playwright/test';

export class DossierDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly changeStatusButton: Locator;
  
  // Tabs
  readonly informationsTab: Locator;
  readonly partiesTab: Locator;
  readonly messagesTab: Locator;
  readonly appointmentsTab: Locator;
  readonly consentsTab: Locator;
  readonly auditTab: Locator;
  
  // Messages tab
  readonly newMessageButton: Locator;
  readonly messageCards: Locator;
  
  // Appointments tab
  readonly planifierButton: Locator;
  readonly appointmentsTable: Locator;
  
  // Audit tab
  readonly auditTable: Locator;
  readonly entityTypeFilter: Locator;
  readonly actionFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('button.btn-back');
    this.changeStatusButton = page.locator('button:has-text("Changer statut")');
    
    // Tabs
    this.informationsTab = page.locator('.mat-tab-label:has-text("Informations")');
    this.partiesTab = page.locator('.mat-tab-label:has-text("Parties prenantes")');
    this.messagesTab = page.locator('.mat-tab-label:has-text("Messages")');
    this.appointmentsTab = page.locator('.mat-tab-label:has-text("Rendez-vous")');
    this.consentsTab = page.locator('.mat-tab-label:has-text("Consentements")');
    this.auditTab = page.locator('.mat-tab-label:has-text("Historique")');
    
    // Messages
    this.newMessageButton = page.locator('button:has-text("Nouveau message")');
    this.messageCards = page.locator('.message-card');
    
    // Appointments
    this.planifierButton = page.locator('button:has-text("Planifier")');
    this.appointmentsTable = page.locator('table.data-table');
    
    // Audit
    this.auditTable = page.locator('table.audit-table, table.data-table');
    this.entityTypeFilter = page.locator('select#entity-type-filter');
    this.actionFilter = page.locator('select#action-filter');
  }

  async switchToTab(tabName: string) {
    const tab = this.page.locator(`.mat-tab-label:has-text("${tabName}")`);
    await tab.click();
    await this.page.waitForTimeout(1000);
  }

  async addMessage(channel: string, direction: string, content: string, timestamp: string) {
    await this.switchToTab('Messages');
    await this.newMessageButton.click();
    
    await this.page.locator('select#channel, select[name="channel"]').selectOption(channel);
    await this.page.locator('select#direction, select[name="direction"]').selectOption(direction);
    await this.page.locator('textarea#content, textarea[name="content"]').fill(content);
    await this.page.locator('input[type="datetime-local"]').first().fill(timestamp);
    
    const submitButton = this.page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitButton.click();
    
    await this.page.waitForTimeout(2000);
  }

  async addAppointment(startTime: string, endTime: string, location: string, assignedTo: string, notes: string) {
    await this.switchToTab('Rendez-vous');
    await this.planifierButton.click();
    
    const datetimeInputs = this.page.locator('input[type="datetime-local"]');
    await datetimeInputs.first().fill(startTime);
    await datetimeInputs.nth(1).fill(endTime);
    await this.page.locator('input#location, input[name="location"]').fill(location);
    await this.page.locator('input#assignedTo, input[name="assignedTo"]').fill(assignedTo);
    await this.page.locator('textarea#notes, textarea[name="notes"]').fill(notes);
    
    const submitButton = this.page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitButton.click();
    
    await this.page.waitForTimeout(2000);
  }

  async verifyMessageExists(content: string) {
    const message = this.messageCards.filter({ hasText: content });
    return message.first().isVisible();
  }

  async verifyAppointmentExists(location: string) {
    const appointment = this.appointmentsTable.locator('tbody tr').filter({ hasText: location });
    return appointment.first().isVisible();
  }

  async getAuditEvents() {
    await this.switchToTab('Historique');
    await this.page.waitForSelector('table.audit-table, table.data-table', { timeout: 10000 });
    return this.auditTable.locator('tbody tr').count();
  }

  async filterAuditByEntityType(entityType: string) {
    await this.entityTypeFilter.selectOption({ label: entityType });
    await this.page.waitForTimeout(1000);
  }

  async filterAuditByAction(action: string) {
    await this.actionFilter.selectOption({ label: action });
    await this.page.waitForTimeout(1000);
  }

  extractDossierId(): string | null {
    const url = this.page.url();
    const match = url.match(/dossiers\/(\d+)/);
    return match ? match[1] : null;
  }
}
