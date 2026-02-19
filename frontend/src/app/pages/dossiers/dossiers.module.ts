import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LayoutModule } from '@angular/cdk/layout';

import { DossierSharedModule } from './dossier-shared.module';
import { SharedPipesModule } from '../../shared/shared-pipes.module';
import { SharedComponentsModule } from '../../shared/shared-components.module';

import { DossiersComponent } from './dossiers.component';
import { DossierDetailComponent } from './dossier-detail.component';
import { DossierCreateComponent } from './dossier-create.component';
import { MessagingTabComponent } from './messaging-tab.component';
import { OutboundMessageFormComponent } from './outbound-message-form.component';
import { OutboundMessageListComponent } from './outbound-message-list.component';

const routes: Routes = [
  { path: '', component: DossiersComponent, data: { animation: 'DossiersPage' } },
  { path: ':id', component: DossierDetailComponent, data: { animation: 'DossierDetailPage' } }
];

@NgModule({
  declarations: [
    DossiersComponent,
    DossierDetailComponent,
    DossierCreateComponent,
    MessagingTabComponent,
    OutboundMessageFormComponent,
    OutboundMessageListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DossierSharedModule,
    SharedPipesModule,
    SharedComponentsModule,
    MatTabsModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    LayoutModule
  ]
})
export class DossiersModule {}
