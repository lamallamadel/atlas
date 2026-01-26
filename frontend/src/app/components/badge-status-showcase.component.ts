import { Component } from '@angular/core';

@Component({
  selector: 'app-badge-status-showcase',
  template: `
    <div class="showcase-container">
      <h2>Extended Semantic Color System - Badge Status Showcase</h2>
      
      <section class="showcase-section">
        <h3>Property Status Badges (Extended Success Variants)</h3>
        <div class="badge-grid">
          <div class="badge-item">
            <app-badge-status status="SOLD" entityType="property"></app-badge-status>
            <span class="badge-description">Vendu - Success Sold (Green)</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="RENTED" entityType="property"></app-badge-status>
            <span class="badge-description">Loué - Success Rented (Teal)</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="SIGNED" entityType="property"></app-badge-status>
            <span class="badge-description">Signé - Success Signed (Blue-Green)</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="AVAILABLE" entityType="property"></app-badge-status>
            <span class="badge-description">Disponible - Standard Success</span>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>Warning Levels (Progressive Urgency)</h3>
        <div class="badge-grid">
          <div class="badge-item">
            <app-badge-status status="PENDING" entityType="property"></app-badge-status>
            <span class="badge-description">En attente - Attention Level</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="RESERVED" entityType="property"></app-badge-status>
            <span class="badge-description">Réservé - Urgent Level</span>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>Neutral-Warmth (Real Estate Tones)</h3>
        <div class="badge-grid">
          <div class="badge-item">
            <app-badge-status status="WITHDRAWN" entityType="property"></app-badge-status>
            <span class="badge-description">Retiré - Warm Gray</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="ARCHIVED" entityType="annonce"></app-badge-status>
            <span class="badge-description">Archivé - Warm Gray</span>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>Dossier Status (Existing + Enhanced)</h3>
        <div class="badge-grid">
          <div class="badge-item">
            <app-badge-status status="NEW" entityType="dossier"></app-badge-status>
            <span class="badge-description">Nouveau - Info</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="QUALIFYING" entityType="dossier"></app-badge-status>
            <span class="badge-description">Qualification - Warning Attention</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="QUALIFIED" entityType="dossier"></app-badge-status>
            <span class="badge-description">Qualifié - Success</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="APPOINTMENT" entityType="dossier"></app-badge-status>
            <span class="badge-description">Rendez-vous - Info</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="WON" entityType="dossier"></app-badge-status>
            <span class="badge-description">Gagné - Success</span>
          </div>
          <div class="badge-item">
            <app-badge-status status="LOST" entityType="dossier"></app-badge-status>
            <span class="badge-description">Perdu - Danger Soft</span>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>Surface Layering System</h3>
        <div class="surface-demo">
          <div class="surface-layer surface-base">
            <span>Surface Base</span>
            <div class="surface-layer surface-1">
              <span>Surface 1</span>
              <app-badge-status status="SOLD" entityType="property"></app-badge-status>
              <div class="surface-layer surface-2">
                <span>Surface 2</span>
                <app-badge-status status="RENTED" entityType="property"></app-badge-status>
                <div class="surface-layer surface-3">
                  <span>Surface 3</span>
                  <app-badge-status status="SIGNED" entityType="property"></app-badge-status>
                  <div class="surface-layer surface-4">
                    <span>Surface 4</span>
                    <app-badge-status status="AVAILABLE" entityType="property"></app-badge-status>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>Smooth Transitions Demo</h3>
        <p class="note">Hover over badges to see smooth color and transform transitions (250ms cubic-bezier)</p>
        <div class="badge-grid">
          <div class="badge-item">
            <app-badge-status status="SOLD" entityType="property"></app-badge-status>
          </div>
          <div class="badge-item">
            <app-badge-status status="RENTED" entityType="property"></app-badge-status>
          </div>
          <div class="badge-item">
            <app-badge-status status="PENDING" entityType="property"></app-badge-status>
          </div>
          <div class="badge-item">
            <app-badge-status status="RESERVED" entityType="property"></app-badge-status>
          </div>
        </div>
      </section>

      <section class="showcase-section">
        <h3>WCAG AAA Compliance (7:1 Contrast)</h3>
        <div class="contrast-info">
          <p>✅ All badge text uses 700+ color variants</p>
          <p>✅ Minimum 7:1 contrast ratio on white backgrounds</p>
          <p>✅ Critical text (prices, legal, errors) fully accessible</p>
          <p>✅ Dark mode automatically adjusts to maintain visibility</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .showcase-container {
      padding: var(--spacing-8);
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Roboto', sans-serif;
    }

    h2 {
      font-size: var(--font-size-3);
      color: var(--color-neutral-900);
      margin-bottom: var(--spacing-6);
      font-weight: var(--font-weight-bold);
    }

    h3 {
      font-size: var(--font-size-2);
      color: var(--color-neutral-800);
      margin-bottom: var(--spacing-4);
      font-weight: var(--font-weight-semibold);
    }

    .showcase-section {
      margin-bottom: var(--spacing-10);
      padding: var(--spacing-6);
      background: var(--color-surface-1);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-1);
    }

    .badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-4);
    }

    .badge-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      padding: var(--spacing-4);
      background: var(--color-surface-base);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-neutral-200);
      transition: var(--transition-badge-smooth);
    }

    .badge-item:hover {
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-2);
    }

    .badge-description {
      font-size: var(--font-size-sm);
      color: var(--color-neutral-700);
      font-weight: var(--font-weight-medium);
    }

    .surface-demo {
      background: var(--color-neutral-100);
      padding: var(--spacing-6);
      border-radius: var(--radius-lg);
    }

    .surface-layer {
      padding: var(--spacing-4);
      border-radius: var(--radius-md);
      margin: var(--spacing-3);
      transition: var(--transition-badge-smooth);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .surface-layer span {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin-bottom: var(--spacing-2);
    }

    .surface-base {
      background: var(--color-surface-base);
      box-shadow: var(--shadow-1);
    }

    .surface-1 {
      background: var(--color-surface-1);
      box-shadow: var(--shadow-1);
    }

    .surface-2 {
      background: var(--color-surface-2);
      box-shadow: var(--shadow-2);
    }

    .surface-3 {
      background: var(--color-surface-3);
      box-shadow: var(--shadow-3);
    }

    .surface-4 {
      background: var(--color-surface-4);
      box-shadow: var(--shadow-4);
    }

    .note {
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
      font-style: italic;
      margin-bottom: var(--spacing-4);
    }

    .contrast-info {
      background: var(--color-success-50);
      border-left: 4px solid var(--color-success-700);
      padding: var(--spacing-4);
      border-radius: var(--radius-md);
    }

    .contrast-info p {
      margin: var(--spacing-2) 0;
      color: var(--color-success-900);
      font-weight: var(--font-weight-medium);
    }

    @media (prefers-reduced-motion: reduce) {
      .badge-item,
      .surface-layer {
        transition: none !important;
      }
    }

    .dark-theme .showcase-section {
      background: var(--color-surface-1);
    }

    .dark-theme .badge-item {
      background: var(--color-surface-base);
      border-color: var(--color-neutral-700);
    }

    .dark-theme h2,
    .dark-theme h3 {
      color: var(--color-neutral-100);
    }

    .dark-theme .badge-description {
      color: var(--color-neutral-300);
    }

    .dark-theme .contrast-info {
      background: var(--color-success-900);
      border-left-color: var(--color-success-400);
    }

    .dark-theme .contrast-info p {
      color: var(--color-success-100);
    }
  `]
})
export class BadgeStatusShowcaseComponent {}
