import type { Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { TimelineComponent, DsTimelineEvent } from '../app/design-system/patterns/timeline/timeline.component';
import { MessagingThreadComponent, DsMessage } from '../app/design-system/patterns/messaging-thread/messaging-thread.component';

/* ═══════════════════════════════════════
   TIMELINE
   ═══════════════════════════════════════ */
const TIMELINE_EVENTS: DsTimelineEvent[] = [
  { date: '2026-05-01T09:00:00', title: 'Dossier créé', description: 'Alice Moreau', variant: 'marine' },
  { date: '2026-05-02T14:30:00', title: 'Qualification complétée', description: 'Alice Moreau', variant: 'copper' },
  { date: '2026-05-03T10:00:00', title: 'RDV planifié — 6 mai 10h', description: 'Bob Leroy', variant: 'muted' },
  { date: '2026-05-04T08:15:00', title: 'Email envoyé : confirmation RDV', description: 'Système', variant: 'muted' },
];

export const TimelineDefault: StoryObj = {
  name: 'Timeline / CRM events',
  render: () => ({
    moduleMetadata: { imports: [TimelineComponent] },
    template: `
      <div style="max-width:560px;padding:32px;background:var(--ds-bg)">
        <ds-timeline [events]="events"></ds-timeline>
      </div>`,
    props: { events: TIMELINE_EVENTS },
  }),
};

/* ═══════════════════════════════════════
   MESSAGING THREAD
   ═══════════════════════════════════════ */
const MESSAGES: DsMessage[] = [
  { id: 1, senderName: 'Marie Dupont', content: 'Bonjour, je suis intéressée par le bien au 12 rue de la Paix.', direction: 'inbound', time: '10:00', status: 'read' },
  { id: 2, senderName: 'Alice Moreau', content: 'Bonjour Marie ! Je peux vous proposer une visite mercredi à 10h. Cela vous convient ?', direction: 'outbound', time: '10:05', status: 'delivered' },
  { id: 3, senderName: 'Marie Dupont', content: 'Parfait, mercredi 10h c\'est idéal pour moi !', direction: 'inbound', time: '10:08', status: 'read' },
  { id: 4, senderName: 'Alice Moreau', content: 'Rendez-vous confirmé. Je vous envoie les détails par email.', direction: 'outbound', time: '10:10', status: 'sent' },
];

export const MessagingThreadDefault: StoryObj = {
  name: 'MessagingThread / WhatsApp + Email',
  render: () => ({
    moduleMetadata: { imports: [MessagingThreadComponent] },
    template: `
      <div style="max-width:580px;padding:32px;background:var(--ds-bg)">
        <ds-messaging-thread [messages]="messages"></ds-messaging-thread>
      </div>`,
    props: { messages: MESSAGES },
  }),
};

export const MessagingThreadEmpty: StoryObj = {
  name: 'MessagingThread / Empty',
  render: () => ({
    moduleMetadata: { imports: [MessagingThreadComponent] },
    template: `
      <div style="max-width:580px;padding:32px;background:var(--ds-bg)">
        <ds-messaging-thread [messages]="[]"></ds-messaging-thread>
      </div>`,
    props: {},
  }),
};

export default {
  title: 'Design System/Patterns/Messaging & Timeline',
  tags: ['autodocs'],
} as Meta;
