import type { Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { TimelineComponent, DsTimelineEvent } from '../app/design-system/patterns/timeline/timeline.component';
import { MessagingThreadComponent, DsMessage } from '../app/design-system/patterns/messaging-thread/messaging-thread.component';

/* ═══════════════════════════════════════
   TIMELINE
   ═══════════════════════════════════════ */
const TIMELINE_EVENTS: DsTimelineEvent[] = [
  { id: '1', date: '2026-05-01T09:00:00', label: 'Dossier créé', actor: 'Alice Moreau', type: 'creation' },
  { id: '2', date: '2026-05-02T14:30:00', label: 'Qualification complétée', actor: 'Alice Moreau', type: 'status' },
  { id: '3', date: '2026-05-03T10:00:00', label: 'RDV planifié — 6 mai 10h', actor: 'Bob Leroy', type: 'appointment' },
  { id: '4', date: '2026-05-04T08:15:00', label: 'Email envoyé : confirmation RDV', actor: 'Système', type: 'message' },
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
  { id: 1, author: 'Marie Dupont', content: 'Bonjour, je suis intéressée par le bien au 12 rue de la Paix.', date: '2026-05-03T10:00:00', direction: 'inbound', channel: 'whatsapp', status: 'read' },
  { id: 2, author: 'Alice Moreau', content: 'Bonjour Marie ! Je peux vous proposer une visite mercredi à 10h. Cela vous convient ?', date: '2026-05-03T10:05:00', direction: 'outbound', channel: 'whatsapp', status: 'delivered' },
  { id: 3, author: 'Marie Dupont', content: 'Parfait, mercredi 10h c\'est idéal pour moi !', date: '2026-05-03T10:08:00', direction: 'inbound', channel: 'whatsapp', status: 'read' },
  { id: 4, author: 'Alice Moreau', content: 'Rendez-vous confirmé. Je vous envoie les détails par email.', date: '2026-05-03T10:10:00', direction: 'outbound', channel: 'email', status: 'sent' },
];

export const MessagingThreadDefault: StoryObj = {
  name: 'MessagingThread / WhatsApp + Email',
  render: () => ({
    moduleMetadata: { imports: [MessagingThreadComponent] },
    template: `
      <div style="max-width:580px;padding:32px;background:var(--ds-bg)">
        <ds-messaging-thread [messages]="messages" currentUser="Alice Moreau"></ds-messaging-thread>
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
        <ds-messaging-thread [messages]="[]" currentUser="Alice Moreau"></ds-messaging-thread>
      </div>`,
    props: {},
  }),
};

export default {
  title: 'Design System/Patterns/Messaging & Timeline',
  tags: ['autodocs'],
} as Meta;
