import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReIconComponent } from '../app/components/re-icon/re-icon.component';
import { IconRegistryService } from '../app/services/icon-registry.service';

const meta: Meta<ReIconComponent> = {
  title: 'Design System/Real Estate Icons',
  component: ReIconComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, HttpClientModule],
      declarations: [ReIconComponent],
      providers: [IconRegistryService]
    })
  ],
  argTypes: {
    icon: {
      control: 'select',
      options: [
        're-house', 're-apartment', 're-villa', 're-office', 're-warehouse', 're-land',
        're-bedroom', 're-bathroom', 're-kitchen', 're-living-room', 're-garage', 're-balcony',
        're-pool', 're-garden', 're-parking', 're-elevator', 're-security', 're-heating', 're-ac',
        're-contract', 're-deed', 're-inspection', 're-blueprint', 're-certificate',
        're-visit', 're-keys', 're-sold', 're-rent', 're-price', 're-offer',
        're-area', 're-floor-plan', 're-location', 're-compass', 're-energy', 
        're-calendar-visit', 're-photo', 're-virtual-tour'
      ]
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xlarge']
    },
    color: {
      control: 'color'
    }
  }
};

export default meta;
type Story = StoryObj<ReIconComponent>;

export const Default: Story = {
  args: {
    icon: 're-house',
    size: 'medium'
  }
};

export const AllSizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 16px;">
        <app-re-icon icon="re-house" size="small"></app-re-icon>
        <app-re-icon icon="re-house" size="medium"></app-re-icon>
        <app-re-icon icon="re-house" size="large"></app-re-icon>
        <app-re-icon icon="re-house" size="xlarge"></app-re-icon>
      </div>
      <div style="margin-top: 8px; display: flex; gap: 16px;">
        <span>16px</span>
        <span>24px</span>
        <span>32px</span>
        <span>48px</span>
      </div>
    `
  })
};

export const WithColors: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: 16px;">
        <app-re-icon icon="re-house" color="#1976d2"></app-re-icon>
        <app-re-icon icon="re-apartment" color="#388e3c"></app-re-icon>
        <app-re-icon icon="re-villa" color="#f57c00"></app-re-icon>
        <app-re-icon icon="re-office" color="#7b1fa2"></app-re-icon>
        <app-re-icon icon="re-warehouse" color="#c62828"></app-re-icon>
      </div>
    `
  })
};

export const HouseTypes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-house" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Maison</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-apartment" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Appartement</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-villa" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Villa</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-office" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Bureau</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-warehouse" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Entrepôt</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-land" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Terrain</div>
        </div>
      </div>
    `
  })
};

export const Rooms: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-bedroom" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Chambre</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-bathroom" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Salle de bain</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-kitchen" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Cuisine</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-living-room" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Salon</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-garage" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Garage</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-balcony" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Balcon</div>
        </div>
      </div>
    `
  })
};

export const Amenities: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-pool" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Piscine</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-garden" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Jardin</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-parking" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Parking</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-elevator" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Ascenseur</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-security" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Sécurité</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-heating" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Chauffage</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-ac" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Climatisation</div>
        </div>
      </div>
    `
  })
};

export const Documents: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-contract" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Contrat</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-deed" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Acte</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-inspection" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Inspection</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-blueprint" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Plan</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-certificate" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Certificat</div>
        </div>
      </div>
    `
  })
};

export const Actions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-visit" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Visite</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-keys" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Clés</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-sold" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Vendu</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-rent" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Loué</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-price" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Prix</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-offer" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Offre</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-calendar-visit" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Calendrier</div>
        </div>
      </div>
    `
  })
};

export const Measurements: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px;">
        <div style="text-align: center;">
          <app-re-icon icon="re-area" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Surface</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-floor-plan" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Plan d'étage</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-location" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Localisation</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-compass" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Orientation</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-energy" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Énergie</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-photo" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Photo</div>
        </div>
        <div style="text-align: center;">
          <app-re-icon icon="re-virtual-tour" size="large"></app-re-icon>
          <div style="margin-top: 8px; font-size: 12px;">Visite virtuelle</div>
        </div>
      </div>
    `
  })
};
