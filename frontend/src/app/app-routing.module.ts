import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import { ObservabilityDashboardComponent } from './components/observability-dashboard.component';
import { SearchComponent } from './pages/search/search.component';
import { TaskListComponent } from './components/task-list.component';
import { CalendarViewComponent } from './components/calendar-view.component';
import { SettingsPageComponent } from './components/settings-page.component';
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
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
        data: { animation: 'DashboardPage' }
      },
      { path: 'reports', component: ReportsDashboardComponent, data: { animation: 'ReportsPage' } },
      { path: 'observability', component: ObservabilityDashboardComponent, data: { animation: 'ObservabilityPage' } },
      { path: 'search', component: SearchComponent, data: { animation: 'SearchPage' } },
      { path: 'tasks', component: TaskListComponent, data: { animation: 'TasksPage' } },
      { path: 'calendar', component: CalendarViewComponent, data: { animation: 'CalendarPage' } },

      { path: 'annonces', component: AnnoncesComponent, data: { animation: 'AnnoncesPage' } },
      { path: 'annonces/new', component: AnnonceCreateComponent, data: { animation: 'AnnonceCreatePage' } },
      { path: 'annonces/:id', component: AnnonceDetailComponent, data: { animation: 'AnnonceDetailPage' } },
      { path: 'annonces/:id/edit', component: AnnonceCreateComponent, data: { animation: 'AnnonceEditPage' } },
      { path: 'dossiers', component: DossiersComponent, data: { animation: 'DossiersPage' } },
      { path: 'dossiers/:id', component: DossierDetailComponent, data: { animation: 'DossierDetailPage' } },
      { path: 'settings', component: SettingsPageComponent, data: { animation: 'SettingsPage' } },

      {
        path: 'annonces',
        loadChildren: () => import('./pages/annonces/annonces.module').then(m => m.AnnoncesModule),
        data: { animation: 'AnnoncesPage' }
      },
      {
        path: 'dossiers',
        loadChildren: () => import('./pages/dossiers/dossiers.module').then(m => m.DossiersModule),
        data: { animation: 'DossiersPage' }
      },

      { 
        path: 'workflow-admin', 
        loadChildren: () => import('./pages/workflow-admin/workflow-admin.module').then(m => m.WorkflowAdminModule),
        data: { animation: 'WorkflowAdminPage' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'disabled',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64]
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
