import { Routes } from '@angular/router';
import { VitrineHomeComponent } from './home/vitrine-home.component';
import { AgencesComponent } from './agences/agences.component';
import { PromoTeursComponent } from './promoteurs/promoteurs.component';
import { TarifsComponent } from './tarifs/tarifs.component';
import { DemoComponent } from './demo/demo.component';
import { ContactComponent } from './contact/contact.component';

export const VITRINE_ROUTES: Routes = [
  { path: '',           component: VitrineHomeComponent },
  { path: 'agences',    component: AgencesComponent },
  { path: 'promoteurs', component: PromoTeursComponent },
  { path: 'tarifs',     component: TarifsComponent },
  { path: 'demo',       component: DemoComponent },
  { path: 'contact',    component: ContactComponent },
];
