import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IconGalleryComponent } from './components/icon-gallery.component';
import { ReIconComponent } from '../app/components/re-icon/re-icon.component';
import { IconRegistryService } from '../app/services/icon-registry.service';

const meta: Meta<IconGalleryComponent> = {
  title: 'Design System/Icon Gallery',
  component: IconGalleryComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule, HttpClientModule],
      declarations: [IconGalleryComponent, ReIconComponent],
      providers: [IconRegistryService]
    })
  ],
  parameters: {
    layout: 'fullscreen',
  }
};

export default meta;
type Story = StoryObj<IconGalleryComponent>;

export const InteractiveGallery: Story = {
  render: () => ({
    template: '<app-icon-gallery></app-icon-gallery>'
  })
};
