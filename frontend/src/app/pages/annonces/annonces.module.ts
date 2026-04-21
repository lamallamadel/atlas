import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';




import { AnnoncesComponent } from './annonces.component';
import { AnnonceCreateComponent } from './annonce-create.component';
import { AnnonceDetailComponent } from './annonce-detail.component';

const routes: Routes = [
  { path: '', component: AnnoncesComponent, data: { animation: 'AnnoncesPage' } },
  { path: 'new', component: AnnonceCreateComponent, data: { animation: 'AnnonceCreatePage' } },
  { path: ':id', component: AnnonceDetailComponent, data: { animation: 'AnnonceDetailPage' } },
  { path: ':id/edit', component: AnnonceCreateComponent, data: { animation: 'AnnonceEditPage' } }
];

@NgModule({
    imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatBottomSheetModule,
    MatDialogModule,
    DragDropModule,
    LayoutModule,
    AnnoncesComponent,
    AnnonceCreateComponent,
    AnnonceDetailComponent
]
})
export class AnnoncesModule {}
