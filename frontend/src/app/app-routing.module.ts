import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AnnoncesComponent } from './pages/annonces/annonces.component';
import { AnnonceCreateComponent } from './pages/annonces/annonce-create.component';
import { AnnonceDetailComponent } from './pages/annonces/annonce-detail.component';
import { DossiersComponent } from './pages/dossiers/dossiers.component';
import { DossierCreateComponent } from './pages/dossiers/dossier-create.component';
import { DossierDetailComponent } from './pages/dossiers/dossier-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import { SearchComponent } from './pages/search/search.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // OAuth2/OIDC redirect target
  { path: 'auth/callback', component: LoginComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: 'session-expired', component: SessionExpiredComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'reports', component: ReportsDashboardComponent },
      { path: 'search', component: SearchComponent },
      { path: 'annonces', component: AnnoncesComponent },
      { path: 'annonces/new', component: AnnonceCreateComponent },
      { path: 'annonces/:id', component: AnnonceDetailComponent },
      { path: 'annonces/:id/edit', component: AnnonceCreateComponent },
      { path: 'dossiers', component: DossiersComponent },
      { path: 'dossiers/new', component: DossierCreateComponent },
      { path: 'dossiers/:id', component: DossierDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
