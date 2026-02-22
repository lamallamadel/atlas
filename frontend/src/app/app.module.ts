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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';

import { GenericTableComponent } from './components/generic-table.component';
import { EmptyStateComponent } from './components/empty-state.component';
import { BadgeStatusComponent } from './components/badge-status.component';
import { BadgeComponent } from './components/badge.component';
import { BadgeShowcaseComponent } from './components/badge-showcase.component';
import { LoadingSkeletonComponent } from './components/loading-skeleton.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader.component';


import { PartiePrenanteFormDialogComponent } from './components/partie-prenante-form-dialog.component';
import { MessageFormDialogComponent } from './components/message-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './components/confirm-delete-dialog.component';
import { AppointmentFormDialogComponent } from './components/appointment-form-dialog.component';
import { BulkOperationDialogComponent } from './components/bulk-operation-dialog.component';
import { ReportsDashboardComponent } from './components/reports-dashboard.component';
import DatetimePickerComponent from './components/datetime-picker.component';
import { GlobalSearchBarComponent } from './components/global-search-bar.component';
import { SearchComponent } from './pages/search/search.component';
import { NoteFormDialogComponent } from './components/note-form-dialog.component';
import { MobileFilterSheetComponent } from './components/mobile-filter-sheet.component';
import { EnhancedSnackbarComponent } from './components/enhanced-snackbar.component';
import { SuccessAnimationComponent } from './components/success-animation.component';
import { ApiStatusIndicatorComponent } from './components/api-status-indicator.component';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { HttpAuthInterceptor } from './interceptors/http-auth.interceptor';
import { FormValidationAnimationDirective } from './directives/form-validation-animation.directive';
import { KeyboardShortcutHintDirective } from './directives/keyboard-shortcut-hint.directive';
import { FocusTrapDirective } from './directives/focus-trap.directive';
import { LazyLoadImageDirective } from './directives/lazy-load-image.directive';
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';

import { SwipeGestureDirective } from './directives/swipe-gesture.directive';
import { AnimatedButtonDirective } from './directives/animated-button.directive';
import { AnimatedFocusDirective } from './directives/animated-focus.directive';
import { MaintainScrollDirective } from './directives/maintain-scroll.directive';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { PriceFormatPipe } from './pipes/price-format.pipe';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';
import { LocalizePipe } from './pipes/localize.pipe';
import { CollaborationPresenceComponent } from './components/collaboration-presence.component';
import { CollaborationCursorComponent } from './components/collaboration-cursor.component';
import { CollaborationActivityStreamComponent } from './components/collaboration-activity-stream.component';
import { CollaborationFilterShareComponent } from './components/collaboration-filter-share.component';
import { HighlightPipe } from './pipes/highlight.pipe';


import { OAuthModule } from 'angular-oauth2-oidc';
import { AuthService } from './services/auth.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { NgChartsModule } from 'ng2-charts';
import { DocumentPreviewDialogComponent } from './components/document-preview-dialog.component';
import { LeadImportDialogComponent } from './components/lead-import-dialog.component';
import { LeadExportDialogComponent } from './components/lead-export-dialog.component';
import { TaskListComponent } from './components/task-list.component';
import { TaskCardComponent } from './components/task-card.component';
import { TaskFormDialogComponent } from './components/task-form-dialog.component';
import { ObservabilityDashboardComponent } from './components/observability-dashboard.component';
import { WhatsappMessagingUiComponent } from './components/whatsapp-messaging-ui.component';
import { KeyboardShortcutsComponent } from './components/keyboard-shortcuts.component';
import { CommandPaletteComponent } from './components/command-palette.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ConfirmNavigationDialogComponent } from './components/confirm-navigation-dialog.component';
import { FormProgressIndicatorComponent } from './components/form-progress-indicator.component';
import { InlineValidationSuggestionComponent } from './components/inline-validation-suggestion.component';
import { ContextualHintDirective } from './directives/contextual-hint.directive';
import { EnhancedFormExampleComponent } from './components/enhanced-form-example.component';
import { CalendarViewComponent } from './components/calendar-view.component';
import { CalendarListViewComponent } from './components/calendar-list-view.component';
import { NotificationCenterComponent } from './components/notification-center.component';
import { ExportProgressDialogComponent } from './components/export-progress-dialog.component';
import { NotificationDemoComponent } from './components/notification-demo.component';
import { AdvancedFiltersComponent } from './components/advanced-filters.component';
import { AdvancedFiltersDialogComponent } from './components/advanced-filters-dialog.component';
import { VoipConfigDialogComponent } from './components/voip-config-dialog.component';
import { OfflineIndicatorComponent } from './components/offline-indicator.component';
import { OfflineInterceptor } from './interceptors/offline.interceptor';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';
import { VirtualScrollListComponent } from './components/virtual-scroll-list.component';
import { MobileActionSheetComponent } from './components/mobile-action-sheet.component';

import { MobileDossierCardComponent } from './components/mobile-dossier-card.component';
import { LogoComponent } from './components/logo.component';
import { LogoInlineComponent } from './components/logo-inline.component';
import { CustomSpinnerComponent } from './components/custom-spinner.component';
import { SpinnerComponent } from './components/spinner.component';
import { LoadingButtonComponent } from './components/loading-button.component';
import { AnimationsDemoComponent } from './components/animations-demo.component';
import { ButtonExamplesComponent } from './components/button-examples.component';
import { ProgressBarComponent } from './components/progress-bar.component';
import { ReportBuilderComponent } from './components/report-builder.component';
import { ExecutiveDashboardComponent } from './components/executive-dashboard.component';
import { MobileBottomNavigationComponent } from './components/mobile-bottom-navigation.component';
import { SwipeableCardComponent } from './components/swipeable-card.component';
import { PwaInstallPromptComponent } from './components/pwa-install-prompt.component';
import { AppShellComponent } from './components/app-shell.component';
import { OfflineDossiersViewerComponent } from './components/offline-dossiers-viewer.component';
import { PhotoGalleryComponent } from './components/photo-gallery.component';
import { NotificationToastComponent } from './components/notification-toast.component';
import { LottieAnimationComponent } from './components/lottie-animation.component';
import { AnimatedEmptyStateComponent } from './components/animated-empty-state.component';
import { LottieAnimationsDemoComponent } from './components/lottie-animations-demo.component';
import { LocaleSwitcherComponent } from './components/locale-switcher.component';
import { SettingsPageComponent } from './components/settings-page.component';
import { UiPreferencesFormComponent } from './components/ui-preferences-form.component';
import { NotificationPreferencesFormComponent } from './components/notification-preferences-form.component';

import { WaterfallChartComponent } from './components/waterfall-chart.component';
import { AiAgentPanelComponent } from './components/ai-agent-panel.component';
import { DossierSharedModule } from './pages/dossiers/dossier-shared.module';
import { SharedPipesModule } from './shared/shared-pipes.module';
import { SharedComponentsModule } from './shared/shared-components.module';


registerLocaleData(localeFr, 'fr');
registerLocaleData(localeEn, 'en');
registerLocaleData(localeEs, 'es');

export function initAuth(authService: AuthService): () => Promise<void> {
  return () => authService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    AppLayoutComponent,
    LoginComponent,
    AccessDeniedComponent,
    SessionExpiredComponent,

    GenericTableComponent,
    EmptyStateComponent,
    BadgeStatusComponent,
    BadgeComponent,
    BadgeShowcaseComponent,
    LoadingSkeletonComponent,
    SkeletonLoaderComponent,


    PartiePrenanteFormDialogComponent,
    MessageFormDialogComponent,
    ConfirmDeleteDialogComponent,
    AppointmentFormDialogComponent,
    BulkOperationDialogComponent,
    ReportsDashboardComponent,
    DatetimePickerComponent,
    GlobalSearchBarComponent,
    SearchComponent,
    NoteFormDialogComponent,
    MobileFilterSheetComponent,
    EnhancedSnackbarComponent,
    SuccessAnimationComponent,
    ApiStatusIndicatorComponent,
    FormValidationAnimationDirective,
    KeyboardShortcutHintDirective,
    FocusTrapDirective,
    LazyLoadImageDirective,
    InfiniteScrollDirective,

    SwipeGestureDirective,
    AnimatedButtonDirective,
    AnimatedFocusDirective,
    MaintainScrollDirective,
    DateFormatPipe,
    PriceFormatPipe,
    PhoneFormatPipe,
    LocalizePipe,
    HighlightPipe,
    WhatsappMessagingUiComponent,
    CollaborationPresenceComponent,
    CollaborationCursorComponent,
    CollaborationActivityStreamComponent,
    CollaborationFilterShareComponent,

    DocumentPreviewDialogComponent,
    LeadImportDialogComponent,
    LeadExportDialogComponent,
    TaskListComponent,
    TaskCardComponent,
    TaskFormDialogComponent,
    ObservabilityDashboardComponent,
    WhatsappMessagingUiComponent,
    KeyboardShortcutsComponent,
    CommandPaletteComponent,
    ConfirmNavigationDialogComponent,
    FormProgressIndicatorComponent,
    InlineValidationSuggestionComponent,
    ContextualHintDirective,
    EnhancedFormExampleComponent,
    CalendarViewComponent,
    CalendarListViewComponent,
    NotificationCenterComponent,
    ExportProgressDialogComponent,
    NotificationDemoComponent,
    AdvancedFiltersComponent,
    AdvancedFiltersDialogComponent,
    VoipConfigDialogComponent,
    OfflineIndicatorComponent,
    VirtualScrollListComponent,
    MobileActionSheetComponent,

    MobileDossierCardComponent,
    LogoComponent,
    LogoInlineComponent,
    CustomSpinnerComponent,
    SpinnerComponent,
    LoadingButtonComponent,
    AnimationsDemoComponent,
    ButtonExamplesComponent,
    ProgressBarComponent,
    ReportBuilderComponent,
    ExecutiveDashboardComponent,
    MobileBottomNavigationComponent,
    SwipeableCardComponent,
    PwaInstallPromptComponent,
    AppShellComponent,
    OfflineDossiersViewerComponent,
    PhotoGalleryComponent,
    NotificationToastComponent,
    LottieAnimationComponent,
    AnimatedEmptyStateComponent,
    LottieAnimationsDemoComponent,
    LocaleSwitcherComponent,
    SettingsPageComponent,
    UiPreferencesFormComponent,
    NotificationPreferencesFormComponent,
    WaterfallChartComponent,
    AiAgentPanelComponent

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
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatBadgeModule,
    MatSliderModule,
    MatSlideToggleModule,
    DragDropModule,
    LayoutModule,
    ScrollingModule,
    TextFieldModule,
    NgChartsModule,
    FullCalendarModule,
    DossierSharedModule,
    SharedPipesModule,
    SharedComponentsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },

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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: OfflineInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
