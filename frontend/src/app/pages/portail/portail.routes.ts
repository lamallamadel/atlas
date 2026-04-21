import { Routes } from '@angular/router';
import { PortailHomeComponent } from './home/portail-home.component';
import { RechercheComponent } from './recherche/recherche.component';
import { AnnonceDetailComponent } from './annonce-detail/annonce-detail.component';
import { MentionsLegalesComponent } from './mentions-legales/mentions-legales.component';
import { ConfidentialiteComponent } from './confidentialite/confidentialite.component';

export const PORTAIL_ROUTES: Routes = [
  { path: '', component: PortailHomeComponent },
  { path: 'recherche', component: RechercheComponent },
  { path: 'annonces/:id', component: AnnonceDetailComponent },
  { path: 'mentions-legales', component: MentionsLegalesComponent },
  { path: 'confidentialite', component: ConfidentialiteComponent },
];
