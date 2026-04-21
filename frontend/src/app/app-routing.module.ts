import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
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

export const routes: Routes = [
  // ── Standalone pages ──────────────────────────────────────────
  { path: 'login',          component: LoginComponent,          data: { animation: 'LoginPage' } },
  { path: 'auth/callback',  component: LoginComponent,          data: { animation: 'LoginPage' } },
  { path: 'access-denied',  component: AccessDeniedComponent,  data: { animation: 'AccessDeniedPage' } },
  { path: 'session-expired',component: SessionExpiredComponent, data: { animation: 'SessionExpiredPage' } },

  // ── PUBLIC LAYOUT — Portail B2C + Vitrine B2B ─────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      // Portail B2C (lazy-loaded)
      {
        path: '',
        loadChildren: () => import('./pages/portail/portail.module').then(m => m.PortailModule)
      },
      // Vitrine B2B (lazy-loaded)
      {
        path: 'biz',
        loadChildren: () => import('./pages/vitrine/vitrine.module').then(m => m.VitrineModule)
      },
    ]
  },

  // ── ESPACE PRO — authenticated layout ─────────────────────────
  {
    path: 'pro',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
        data: { animation: 'DashboardPage' }
      },
      { path: 'reports',       component: ReportsDashboardComponent,     data: { animation: 'ReportsPage' } },
      { path: 'observability', component: ObservabilityDashboardComponent,data: { animation: 'ObservabilityPage' } },
      { path: 'search',        component: SearchComponent,               data: { animation: 'SearchPage' } },
      { path: 'tasks',         component: TaskListComponent,             data: { animation: 'TasksPage' } },
      { path: 'calendar',      component: CalendarViewComponent,         data: { animation: 'CalendarPage' } },
      { path: 'settings',      component: SettingsPageComponent,         data: { animation: 'SettingsPage' } },
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
  },

  // Legacy root redirect — forward old /dashboard, /dossiers etc. to /pro/*
  { path: 'dashboard',       redirectTo: 'pro/dashboard', pathMatch: 'full' },
  { path: 'dossiers',        redirectTo: 'pro/dossiers',  pathMatch: 'prefix' },
  { path: 'annonces',        redirectTo: 'pro/annonces',  pathMatch: 'prefix' },
  { path: 'calendar',        redirectTo: 'pro/calendar',  pathMatch: 'full' },
  { path: 'tasks',           redirectTo: 'pro/tasks',     pathMatch: 'full' },
  { path: 'settings',        redirectTo: 'pro/settings',  pathMatch: 'full' },
  { path: 'reports',         redirectTo: 'pro/reports',   pathMatch: 'full' },
  { path: 'observability',   redirectTo: 'pro/observability', pathMatch: 'full' },
  { path: 'search',          redirectTo: 'pro/search',    pathMatch: 'full' },
  { path: 'workflow-admin',  redirectTo: 'pro/workflow-admin', pathMatch: 'prefix' },

  { path: '**', redirectTo: '' }
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
