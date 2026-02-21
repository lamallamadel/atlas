import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
  title: 'Design System/Cards',
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

export const BasicCard: Story = {
  render: () => ({
    template: `
      <div class="card">
        <div class="card__header">
          <div class="card__icon">
            <mat-icon>home</mat-icon>
          </div>
          <div>
            <h3 class="card__title">Basic Card</h3>
            <p class="card__subtitle">With icon and subtitle</p>
          </div>
        </div>
        <div class="card__content">
          This card demonstrates the new design system with 12px border radius,
          subtle gradient background, 1px neutral border, and smooth hover elevation
          from shadow-2 to shadow-4 with a -2px translateY.
        </div>
        <div class="card__footer">
          <span style="color: var(--color-neutral-600); font-size: var(--font-size-sm);">
            2 hours ago
          </span>
          <div class="card__actions">
            <button mat-icon-button aria-label="Favorite">
              <mat-icon>favorite_border</mat-icon>
            </button>
            <button mat-icon-button aria-label="Share">
              <mat-icon>share</mat-icon>
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ActiveCard: Story = {
  render: () => ({
    template: `
      <div class="card card--active">
        <div class="card__badge">Active</div>
        <div class="card__header">
          <h3 class="card__title">Active Card with Inner Glow</h3>
        </div>
        <div class="card__content">
          This card is in an active/selected state, demonstrating the inner glow
          effect with the primary accent color. The border changes to primary-500
          and a subtle inner shadow creates depth.
        </div>
      </div>
    `,
  }),
};

export const SemanticColors: Story = {
  render: () => ({
    template: `
      <div class="card-grid card-grid--3-col">
        <div class="card card--primary">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>star</mat-icon>
            </div>
            <h4 class="card__title">Primary</h4>
          </div>
          <div class="card__content">
            Use for primary actions and main focus areas.
          </div>
        </div>

        <div class="card card--success">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h4 class="card__title">Success</h4>
          </div>
          <div class="card__content">
            Use for completed states and positive feedback.
          </div>
        </div>

        <div class="card card--warning">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>warning</mat-icon>
            </div>
            <h4 class="card__title">Warning</h4>
          </div>
          <div class="card__content">
            Use for warnings and important notices.
          </div>
        </div>

        <div class="card card--error">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>error</mat-icon>
            </div>
            <h4 class="card__title">Error</h4>
          </div>
          <div class="card__content">
            Use for errors and critical alerts.
          </div>
        </div>

        <div class="card card--info">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>info</mat-icon>
            </div>
            <h4 class="card__title">Info</h4>
          </div>
          <div class="card__content">
            Use for informational content.
          </div>
        </div>

        <div class="card card--secondary">
          <div class="card__header">
            <div class="card__icon">
              <mat-icon>label</mat-icon>
            </div>
            <h4 class="card__title">Secondary</h4>
          </div>
          <div class="card__content">
            Use for secondary information.
          </div>
        </div>
      </div>
    `,
  }),
};

export const CardVariants: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: var(--spacing-6);">
        <div class="card">
          <h4 class="card__title">Default Card</h4>
          <div class="card__content">
            Standard card with shadow-2 base elevation
          </div>
        </div>

        <div class="card card--flat">
          <h4 class="card__title">Flat Card</h4>
          <div class="card__content">
            No shadow, minimal elevation
          </div>
        </div>

        <div class="card card--elevated">
          <h4 class="card__title">Elevated Card</h4>
          <div class="card__content">
            Higher elevation with stronger shadow
          </div>
        </div>

        <div class="card card--outlined">
          <h4 class="card__title">Outlined Card</h4>
          <div class="card__content">
            Emphasized 2px border with no shadow
          </div>
        </div>
      </div>
    `,
  }),
};

export const PaddingVariants: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: var(--spacing-6);">
        <div class="card card--compact">
          <h4 class="card__title">Compact Padding</h4>
          <div class="card__content">
            16px padding for dense layouts
          </div>
        </div>

        <div class="card card--comfortable">
          <h4 class="card__title">Comfortable Padding (Default)</h4>
          <div class="card__content">
            24px padding for balanced spacing
          </div>
        </div>

        <div class="card card--spacious">
          <h4 class="card__title">Spacious Padding</h4>
          <div class="card__content">
            32px padding for airy layouts
          </div>
        </div>
      </div>
    `,
  }),
};

export const HorizontalCard: Story = {
  render: () => ({
    template: `
      <div class="card card--horizontal">
        <div style="width: 120px; min-width: 120px; height: 120px; background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500)); border-radius: var(--radius-lg);"></div>
        <div>
          <div class="card__header">
            <h3 class="card__title">Horizontal Layout</h3>
            <p class="card__subtitle">Media on the side</p>
          </div>
          <div class="card__content">
            This layout is ideal for list views where you want to show
            media alongside content in a horizontal arrangement.
          </div>
        </div>
      </div>
    `,
  }),
};

export const PropertyCard: Story = {
  render: () => ({
    template: `
      <div class="card card--primary" style="max-width: 400px;">
        <div class="card__badge">For Sale</div>
        
        <div style="width: 100%; height: 200px; background: linear-gradient(135deg, var(--color-primary-300), var(--color-primary-600)); border-radius: var(--radius-lg); margin-bottom: var(--spacing-4);"></div>
        
        <div class="card__header">
          <div class="card__icon">
            <mat-icon>home</mat-icon>
          </div>
          <div>
            <h3 class="card__title">Luxury Apartment</h3>
            <p class="card__subtitle">Paris, France</p>
          </div>
        </div>
        
        <div class="card__content">
          <p>Beautiful 3-bedroom apartment with stunning city views. Modern amenities and prime location.</p>
          <div style="display: flex; gap: var(--spacing-4); margin-top: var(--spacing-3);">
            <span>🛏️ 3 beds</span>
            <span>🚿 2 baths</span>
            <span>📏 120m²</span>
          </div>
        </div>
        
        <div class="card__footer">
          <span style="font-size: var(--font-size-2); font-weight: var(--font-weight-bold); color: var(--color-primary-600);">
            €350,000
          </span>
          <div class="card__actions">
            <button mat-icon-button aria-label="Favorite">
              <mat-icon>favorite_border</mat-icon>
            </button>
            <button mat-icon-button aria-label="Share">
              <mat-icon>share</mat-icon>
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const MaterialCard: Story = {
  render: () => ({
    template: `
      <mat-card style="max-width: 400px;">
        <mat-card-header>
          <div mat-card-avatar style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius-lg); background-color: var(--color-primary-50); color: var(--color-primary-600);">
            <mat-icon>business</mat-icon>
          </div>
          <mat-card-title>Material Card</mat-card-title>
          <mat-card-subtitle>Automatically Styled</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>
            Material Design cards automatically receive the new visual depth design
            with 12px border radius, subtle borders, gradient background, and smooth
            elevation transitions on hover.
          </p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button>CANCEL</button>
          <button mat-raised-button color="primary">OK</button>
        </mat-card-actions>
      </mat-card>
    `,
  }),
};

export const SelectedMaterialCard: Story = {
  render: () => ({
    template: `
      <mat-card [attr.aria-selected]="true" style="max-width: 400px;">
        <mat-card-header>
          <mat-card-title>Selected Material Card</mat-card-title>
          <mat-card-subtitle>With Inner Glow Effect</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>
            This card is marked as selected with aria-selected="true",
            automatically displaying the inner glow effect with primary color
            and enhanced border.
          </p>
        </mat-card-content>
      </mat-card>
    `,
  }),
};

export const CardGrid: Story = {
  render: () => ({
    template: `
      <div class="card-grid">
        <div class="card card--compact">
          <div class="card__icon" style="margin-bottom: var(--spacing-3);">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-primary-500);">analytics</mat-icon>
          </div>
          <h4 class="card__title">Total Sales</h4>
          <p style="font-size: var(--font-size-3); font-weight: var(--font-weight-bold); color: var(--color-neutral-900); margin: var(--spacing-2) 0;">
            €1,250,000
          </p>
          <p style="color: var(--color-success-600); font-size: var(--font-size-sm);">
            ↑ 15% from last month
          </p>
        </div>

        <div class="card card--compact">
          <div class="card__icon" style="margin-bottom: var(--spacing-3);">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-secondary-500);">people</mat-icon>
          </div>
          <h4 class="card__title">New Leads</h4>
          <p style="font-size: var(--font-size-3); font-weight: var(--font-weight-bold); color: var(--color-neutral-900); margin: var(--spacing-2) 0;">
            342
          </p>
          <p style="color: var(--color-success-600); font-size: var(--font-size-sm);">
            ↑ 8% from last month
          </p>
        </div>

        <div class="card card--compact">
          <div class="card__icon" style="margin-bottom: var(--spacing-3);">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-info-500);">home_work</mat-icon>
          </div>
          <h4 class="card__title">Properties</h4>
          <p style="font-size: var(--font-size-3); font-weight: var(--font-weight-bold); color: var(--color-neutral-900); margin: var(--spacing-2) 0;">
            127
          </p>
          <p style="color: var(--color-neutral-600); font-size: var(--font-size-sm);">
            Active listings
          </p>
        </div>

        <div class="card card--compact">
          <div class="card__icon" style="margin-bottom: var(--spacing-3);">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-warning-500);">schedule</mat-icon>
          </div>
          <h4 class="card__title">Appointments</h4>
          <p style="font-size: var(--font-size-3); font-weight: var(--font-weight-bold); color: var(--color-neutral-900); margin: var(--spacing-2) 0;">
            23
          </p>
          <p style="color: var(--color-neutral-600); font-size: var(--font-size-sm);">
            This week
          </p>
        </div>
      </div>
    `,
  }),
};

export const InteractiveStates: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: var(--spacing-6);">
        <div>
          <h4 style="margin-bottom: var(--spacing-3);">Hover State</h4>
          <div class="card" style="max-width: 300px;">
            <div class="card__content">
              Hover over this card to see the elevation increase and lift effect
            </div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom: var(--spacing-3);">Active State (Primary)</h4>
          <div class="card card--active" style="max-width: 300px;">
            <div class="card__content">
              Active card with primary inner glow
            </div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom: var(--spacing-3);">Active State (Accent)</h4>
          <div class="card card--accent-active" style="max-width: 300px;">
            <div class="card__content">
              Active card with accent inner glow
            </div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom: var(--spacing-3);">Active State (Success)</h4>
          <div class="card card--success-active" style="max-width: 300px;">
            <div class="card__content">
              Active card with success inner glow
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
