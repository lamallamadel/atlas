import { Routes } from '@angular/router';
import { PortailHomeComponent } from './home/portail-home.component';
import { RechercheComponent } from './recherche/recherche.component';
import { AnnonceDetailComponent } from './annonce-detail/annonce-detail.component';
import { MentionsLegalesComponent } from './mentions-legales/mentions-legales.component';
import { ConfidentialiteComponent } from './confidentialite/confidentialite.component';
import { ConsentementComponent } from './consentement/consentement.component';
import { ContactConversationComponent } from './contact-conversation/contact-conversation.component';

export const PORTAIL_ROUTES: Routes = [
  { path: '', component: PortailHomeComponent },
  { path: 'recherche', component: RechercheComponent },
  { path: 'annonces/:id', component: AnnonceDetailComponent },
  { path: 'mentions-legales', component: MentionsLegalesComponent },
  { path: 'confidentialite', component: ConfidentialiteComponent },
  { path: 'consentement/:token', component: ConsentementComponent },
  // Cas d'usage n°1 : le prospect suit son échange avec un propriétaire (lien reçu par WhatsApp ou e-mail).
  { path: 'contact/:token', component: ContactConversationComponent },
];
