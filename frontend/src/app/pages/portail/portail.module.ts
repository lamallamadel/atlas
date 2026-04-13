import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { PortailHomeComponent } from './home/portail-home.component';
import { RechercheComponent } from './recherche/recherche.component';
import { AnnonceDetailComponent } from './annonce-detail/annonce-detail.component';
import { MentionsLegalesComponent } from './mentions-legales/mentions-legales.component';
import { ConfidentialiteComponent } from './confidentialite/confidentialite.component';

const routes: Routes = [
  { path: '', component: PortailHomeComponent },
  { path: 'recherche', component: RechercheComponent },
  { path: 'annonces/:id', component: AnnonceDetailComponent },
  { path: 'mentions-legales', component: MentionsLegalesComponent },
  { path: 'confidentialite', component: ConfidentialiteComponent },
];

@NgModule({
  declarations: [
    PortailHomeComponent,
    RechercheComponent,
    AnnonceDetailComponent,
    MentionsLegalesComponent,
    ConfidentialiteComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class PortailModule {}
