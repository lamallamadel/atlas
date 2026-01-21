import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AnnoncesComponent } from './pages/annonces/annonces.component';
import { AnnonceCreateComponent } from './pages/annonces/annonce-create.component';
import { AnnonceDetailComponent } from './pages/annonces/annonce-detail.component';
import { DossiersComponent } from './pages/dossiers/dossiers.component';
import { DossierDetailComponent } from './pages/dossiers/dossier-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import { SearchComponent } from './pages/search/search.component';
import { TaskListComponent } from './components/task-list.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
  // OAuth2/OIDC redirect target
  { path: 'auth/callback', component: LoginComponent, data: { animation: 'LoginPage' } },
  { path: 'access-denied', component: AccessDeniedComponent, data: { animation: 'AccessDeniedPage' } },
  { path: 'session-expired', component: SessionExpiredComponent, data: { animation: 'SessionExpiredPage' } },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, data: { animation: 'DashboardPage' } },
      { path: 'reports', component: ReportsDashboardComponent, data: { animation: 'ReportsPage' } },
      { path: 'search', component: SearchComponent, data: { animation: 'SearchPage' } },
      { path: 'tasks', component: TaskListComponent, data: { animation: 'TasksPage' } },
      { path: 'annonces', component: AnnoncesComponent, data: { animation: 'AnnoncesPage' } },
      { path: 'annonces/new', component: AnnonceCreateComponent, data: { animation: 'AnnonceCreatePage' } },
      { path: 'annonces/:id', component: AnnonceDetailComponent, data: { animation: 'AnnonceDetailPage' } },
      { path: 'annonces/:id/edit', component: AnnonceCreateComponent, data: { animation: 'AnnonceEditPage' } },
      { path: 'dossiers', component: DossiersComponent, data: { animation: 'DossiersPage' } },
      { path: 'dossiers/:id', component: DossierDetailComponent, data: { animation: 'DossierDetailPage' } },
      { 
        path: 'workflow-admin', 
        loadChildren: () => import('./pages/workflow-admin/workflow-admin.module').then(m => m.WorkflowAdminModule),
        data: { animation: 'WorkflowAdminPage' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
