import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { WorkflowAdminComponent } from './workflow-admin.component';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';
import { WorkflowNodeComponent } from './workflow-node/workflow-node.component';
import { TransitionRuleFormComponent } from './transition-rule-form/transition-rule-form.component';
import { WorkflowPreviewComponent } from './workflow-preview/workflow-preview.component';
import { TemplateLibraryComponent } from './template-library/template-library.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { TemplatePreviewComponent } from './template-preview/template-preview.component';
import { VariableManagerComponent } from './variable-manager/variable-manager.component';
import { LineBreakPipe } from './pipes/line-break.pipe';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: WorkflowAdminComponent,
    canActivate: [AuthGuard],
    data: { animation: 'WorkflowAdminPage' }
  },
  {
    path: 'templates',
    component: TemplateLibraryComponent,
    canActivate: [AuthGuard],
    data: { animation: 'TemplateLibraryPage' }
  },
  {
    path: 'templates/new',
    component: TemplateEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: 'TemplateEditorPage' }
  },
  {
    path: 'templates/:id',
    component: TemplateEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: 'TemplateViewPage' }
  },
  {
    path: 'templates/:id/edit',
    component: TemplateEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: 'TemplateEditPage' }
  }
];

@NgModule({
  declarations: [
    WorkflowAdminComponent,
    WorkflowEditorComponent,
    WorkflowNodeComponent,
    TransitionRuleFormComponent,
    WorkflowPreviewComponent,
    TemplateLibraryComponent,
    TemplateEditorComponent,
    TemplatePreviewComponent,
    VariableManagerComponent,
    LineBreakPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class WorkflowAdminModule { }
