import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { VitrineHomeComponent } from './home/vitrine-home.component';
import { AgencesComponent } from './agences/agences.component';
import { PromoTeursComponent } from './promoteurs/promoteurs.component';
import { TarifsComponent } from './tarifs/tarifs.component';
import { DemoComponent } from './demo/demo.component';
import { ContactComponent } from './contact/contact.component';

const routes: Routes = [
  { path: '',           component: VitrineHomeComponent },
  { path: 'agences',    component: AgencesComponent },
  { path: 'promoteurs', component: PromoTeursComponent },
  { path: 'tarifs',     component: TarifsComponent },
  { path: 'demo',       component: DemoComponent },
  { path: 'contact',    component: ContactComponent },
];

@NgModule({
  declarations: [
    VitrineHomeComponent,
    AgencesComponent,
    PromoTeursComponent,
    TarifsComponent,
    DemoComponent,
    ContactComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class VitrineModule {}
