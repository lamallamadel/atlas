import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import { ObservabilityDashboardComponent } from './components/observability-dashboard.component';
import { SearchComponent } from './pages/search/search.component';
import { TaskListComponent } from './components/task-list.component';
import { CalendarViewComponent } from './components/calendar-view.component';
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
      { path: 'observability', component: ObservabilityDashboardComponent, data: { animation: 'ObservabilityPage' } },
      { path: 'search', component: SearchComponent, data: { animation: 'SearchPage' } },
      { path: 'tasks', component: TaskListComponent, data: { animation: 'TasksPage' } },
      { path: 'calendar', component: CalendarViewComponent, data: { animation: 'CalendarPage' } },
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
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
