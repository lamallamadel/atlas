import { Routes } from '@angular/router';
import { WorkflowAdminComponent } from './workflow-admin.component';
import { TemplateLibraryComponent } from './template-library/template-library.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { AuthGuard } from '../../guards/auth.guard';

export const WORKFLOW_ADMIN_ROUTES: Routes = [
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
