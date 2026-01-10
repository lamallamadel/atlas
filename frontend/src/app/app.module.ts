import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LayoutModule } from '@angular/cdk/layout';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { GenericTableComponent } from './components/generic-table.component';
import { EmptyStateComponent } from './components/empty-state.component';
import { BadgeStatusComponent } from './components/badge-status.component';
import { LoadingSkeletonComponent } from './components/loading-skeleton.component';
import { PartiePrenanteFormDialogComponent } from './components/partie-prenante-form-dialog.component';
import { MessageFormDialogComponent } from './components/message-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './components/confirm-delete-dialog.component';
import { AppointmentFormDialogComponent } from './components/appointment-form-dialog.component';
import { BulkOperationDialogComponent } from './components/bulk-operation-dialog.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import { GlobalSearchBarComponent } from './components/global-search-bar.component';
import { SearchComponent } from './pages/search/search.component';
import { ActivityTimelineComponent } from './components/activity-timeline.component';
import { MobileFilterSheetComponent } from './components/mobile-filter-sheet.component';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { HttpAuthInterceptor } from './interceptors/http-auth.interceptor';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { PriceFormatPipe } from './pipes/price-format.pipe';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';
import { OAuthModule } from 'angular-oauth2-oidc';
import { AuthService } from './services/auth.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NgChartsModule } from 'ng2-charts';

registerLocaleData(localeFr);

export function initAuth(authService: AuthService): () => Promise<void> {
  return () => authService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    AppLayoutComponent,
    DashboardComponent,
    AnnoncesComponent,
    AnnonceCreateComponent,
    AnnonceDetailComponent,
    DossiersComponent,
    DossierCreateComponent,
    DossierDetailComponent,
    LoginComponent,
    AccessDeniedComponent,
    SessionExpiredComponent,
    GenericTableComponent,
    EmptyStateComponent,
    BadgeStatusComponent,
    LoadingSkeletonComponent,
    PartiePrenanteFormDialogComponent,
    MessageFormDialogComponent,
    ConfirmDeleteDialogComponent,
    AppointmentFormDialogComponent,
    BulkOperationDialogComponent,
    ReportsDashboardComponent,
    GlobalSearchBarComponent,
    SearchComponent,
    ActivityTimelineComponent,
    MobileFilterSheetComponent,
    DateFormatPipe,
    PriceFormatPipe,
    PhoneFormatPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCardModule,
    MatTabsModule,
    MatDialogModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatBottomSheetModule,
    LayoutModule,
    NgChartsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },

    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpAuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorrelationIdInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
