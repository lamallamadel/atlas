# Compact Angular Project Report

**Project:** /mnt/c/Users/PRO/work/immo/frontend
**Generated:** Sun May  3 05:01:01 CEST 2026

## Project type

Angular frontend with Capacitor, Playwright, Storybook, PWA/service-worker support, i18n, charts, PDF/export tooling, and many real-estate workflow modules.

## Key config files
```
./angular.json
./capacitor.config.ts
./karma.conf.js
./ngsw-config.json
./package.json
./playwright.config.ts
./proxy.conf.json
./tsconfig.app.json
./tsconfig.json
./tsconfig.spec.json
```

## Main app structure
```
./src/app
./src/app/animations
./src/app/components
./src/app/components/chart
./src/app/components/illustrations
./src/app/components/re-icon
./src/app/components/region-status
./src/app/directives
./src/app/guards
./src/app/interceptors
./src/app/layout
./src/app/layout/app-layout
./src/app/layout/public-layout
./src/app/mocks
./src/app/models
./src/app/pages
./src/app/pages/access-denied
./src/app/pages/annonces
./src/app/pages/dashboard
./src/app/pages/developer-portal
./src/app/pages/dossiers
./src/app/pages/login
./src/app/pages/ml-insights
./src/app/pages/portail
./src/app/pages/search
./src/app/pages/session-expired
./src/app/pages/vitrine
./src/app/pages/workflow-admin
./src/app/pipes
./src/app/services
./src/app/shared
./src/app/testing
```

## Routes
```
./src/app/app.routes.ts
./src/app/pages/annonces/annonces.routes.ts
./src/app/pages/dossiers/dossiers.routes.ts
./src/app/pages/portail/portail.routes.ts
./src/app/pages/vitrine/vitrine.routes.ts
./src/app/pages/workflow-admin/workflow-admin.routes.ts
```

## Pages
```
./src/app/pages/access-denied/access-denied.component.ts
./src/app/pages/annonces/annonce-create.component.ts
./src/app/pages/annonces/annonce-detail.component.ts
./src/app/pages/annonces/annonces.component.ts
./src/app/pages/dashboard/dashboard.component.ts
./src/app/pages/developer-portal/developer-portal.component.ts
./src/app/pages/dossiers/dossier-create-dialog.component.ts
./src/app/pages/dossiers/dossier-create.component.ts
./src/app/pages/dossiers/dossier-detail.component.ts
./src/app/pages/dossiers/dossiers.component.ts
./src/app/pages/dossiers/lead-management-example.component.ts
./src/app/pages/dossiers/messaging-tab.component.ts
./src/app/pages/dossiers/outbound-message-form.component.ts
./src/app/pages/dossiers/outbound-message-list.component.ts
./src/app/pages/login/login.component.ts
./src/app/pages/ml-insights/ml-insights-dashboard.component.ts
./src/app/pages/portail/annonce-detail/annonce-detail.component.ts
./src/app/pages/portail/confidentialite/confidentialite.component.ts
./src/app/pages/portail/home/portail-home.component.ts
./src/app/pages/portail/mentions-legales/mentions-legales.component.ts
./src/app/pages/portail/recherche/recherche.component.ts
./src/app/pages/search/search.component.ts
./src/app/pages/session-expired/session-expired.component.ts
./src/app/pages/vitrine/agences/agences.component.ts
./src/app/pages/vitrine/contact/contact.component.ts
./src/app/pages/vitrine/demo/demo.component.ts
./src/app/pages/vitrine/home/vitrine-home.component.ts
./src/app/pages/vitrine/promoteurs/promoteurs.component.ts
./src/app/pages/vitrine/tarifs/tarifs.component.ts
./src/app/pages/workflow-admin/template-editor/template-editor.component.ts
./src/app/pages/workflow-admin/template-library/template-library.component.ts
./src/app/pages/workflow-admin/template-preview/template-preview.component.ts
./src/app/pages/workflow-admin/transition-rule-form/transition-rule-form.component.ts
./src/app/pages/workflow-admin/variable-manager/variable-manager.component.ts
./src/app/pages/workflow-admin/workflow-admin.component.ts
./src/app/pages/workflow-admin/workflow-editor/workflow-editor.component.ts
./src/app/pages/workflow-admin/workflow-node/workflow-node.component.ts
./src/app/pages/workflow-admin/workflow-preview/workflow-preview.component.ts
```

## Services
```
./src/app/services/activity-api.service.ts
./src/app/services/ai-agent.service.ts
./src/app/services/analytics-api.service.ts
./src/app/services/annonce-api.service.ts
./src/app/services/annonce-bulk.service.ts
./src/app/services/appointment-api.service.ts
./src/app/services/aria-live-announcer.service.ts
./src/app/services/audit-event-api.service.ts
./src/app/services/auth.service.ts
./src/app/services/billing.service.ts
./src/app/services/biometric-auth.service.ts
./src/app/services/bulk-operation.service.ts
./src/app/services/calendar-sync.service.ts
./src/app/services/chart-color-palette.service.ts
./src/app/services/chart-utils.service.ts
./src/app/services/collaboration.service.ts
./src/app/services/comment.service.ts
./src/app/services/consentement-api.service.ts
./src/app/services/crypto.service.ts
./src/app/services/customer-portal.service.ts
./src/app/services/dashboard-customization.service.ts
./src/app/services/dashboard-kpi.service.ts
./src/app/services/data-export.service.ts
./src/app/services/developer-portal-api.service.ts
./src/app/services/document-api.service.ts
./src/app/services/document-workflow.service.ts
./src/app/services/dossier-api.service.ts
./src/app/services/dossier-bulk.service.ts
./src/app/services/dossier-filter-api.service.ts
./src/app/services/empty-state-illustrations.service.ts
./src/app/services/esignature-api.service.ts
./src/app/services/export.service.ts
./src/app/services/filter-preset.service.ts
./src/app/services/focus-management.service.ts
./src/app/services/form-draft.service.ts
./src/app/services/form-validation.service.ts
./src/app/services/fuzzy-search.service.ts
./src/app/services/http-cache.service.ts
./src/app/services/i18n.service.ts
./src/app/services/icon-registry.service.ts
./src/app/services/keyboard-shortcut.service.ts
./src/app/services/lead-api.service.ts
./src/app/services/lead-scoring-api.service.ts
./src/app/services/live-announcer.service.ts
./src/app/services/message-api.service.ts
./src/app/services/ml.service.ts
./src/app/services/native-app-init.service.ts
./src/app/services/native-biometric.service.ts
./src/app/services/native-calendar.service.ts
./src/app/services/native-filesystem.service.ts
./src/app/services/native-platform.service.ts
./src/app/services/native-push-notifications.service.ts
./src/app/services/navigation.service.ts
./src/app/services/notification-api.service.ts
./src/app/services/notification.service.ts
./src/app/services/offline-conflict-resolver.service.ts
./src/app/services/offline-message-queue.service.ts
./src/app/services/offline-queue.service.ts
./src/app/services/offline-storage.service.ts
./src/app/services/offline.service.ts
./src/app/services/onboarding-tour.service.ts
./src/app/services/outbound-message-api.service.ts
./src/app/services/partie-prenante-api.service.ts
./src/app/services/pdf-template.service.ts
./src/app/services/performance-monitor.service.ts
./src/app/services/ping.service.ts
./src/app/services/portail.service.ts
./src/app/services/predictive-analytics.service.ts
./src/app/services/prefetch.service.ts
./src/app/services/push-notification.service.ts
./src/app/services/pwa.service.ts
./src/app/services/quick-actions.service.ts
./src/app/services/recent-navigation.service.ts
./src/app/services/region-routing.service.ts
./src/app/services/report-api.service.ts
./src/app/services/report-scheduling.service.ts
./src/app/services/reporting-api.service.ts
./src/app/services/search-api.service.ts
./src/app/services/search-history.service.ts
./src/app/services/service-worker-registration.service.ts
./src/app/services/smart-suggestions-api.service.ts
./src/app/services/smart-suggestions.service.ts
./src/app/services/task-api.service.ts
./src/app/services/tenant-provisioning.service.ts
./src/app/services/theme.service.ts
./src/app/services/toast-notification.service.ts
./src/app/services/tour-definition.service.ts
./src/app/services/user-preferences.service.ts
./src/app/services/vitrine.service.ts
./src/app/services/voip.service.ts
./src/app/services/websocket.service.ts
./src/app/services/whatsapp-template-api.service.ts
./src/app/services/white-label.service.ts
./src/app/services/widget-registry.service.ts
./src/app/services/workflow-api.service.ts
```

## Guards and interceptors
```
./src/app/guards/auth.guard.spec.ts
./src/app/guards/auth.guard.ts
./src/app/guards/form-unsaved-changes.guard.spec.ts
./src/app/guards/form-unsaved-changes.guard.ts
./src/app/guards/role.guard.spec.ts
./src/app/guards/role.guard.ts
./src/app/interceptors/correlation-id.interceptor.spec.ts
./src/app/interceptors/correlation-id.interceptor.ts
./src/app/interceptors/http-auth.interceptor.spec.ts
./src/app/interceptors/http-auth.interceptor.ts
./src/app/interceptors/http-cache.interceptor.ts
./src/app/interceptors/offline.interceptor.spec.ts
./src/app/interceptors/offline.interceptor.ts
./src/app/interceptors/region-routing.interceptor.ts
```

## Models
```
./src/app/models/api-marketplace.models.ts
./src/app/models/chart.types.ts
./src/app/models/customer-portal.models.ts
./src/app/models/document-workflow.model.ts
./src/app/models/esignature.models.ts
./src/app/models/user-preferences.model.ts
./src/app/pages/workflow-admin/models/template.model.ts
./src/app/pages/workflow-admin/models/workflow.model.ts
```

## Components count
```
Components: 169
Services:   98
Routes:     6
Guards:     6
Interceptors: 8
```
