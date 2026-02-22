import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { SharedPipesModule } from './shared-pipes.module';

import { GenericTableComponent } from '../components/generic-table.component';
import { EmptyStateComponent } from '../components/empty-state.component';
import { LoadingSkeletonComponent } from '../components/loading-skeleton.component';
import { BadgeStatusComponent } from '../components/badge-status.component';
import { KanbanBoardComponent } from '../components/kanban-board.component';
import { MobileDossierCardComponent } from '../components/mobile-dossier-card.component';
import { WhatsappMessagingContainerComponent } from '../components/whatsapp-messaging-container.component';
import { WhatsappThreadComponent } from '../components/whatsapp-thread.component';
import { WhatsappMessageInputComponent } from '../components/whatsapp-message-input.component';
import { TemplateSelectionSheetComponent } from '../components/template-selection-sheet.component';
import { ActivityTimelineComponent } from '../components/activity-timeline.component';
import { DocumentListComponent } from '../components/document-list.component';
import { DocumentUploadComponent } from '../components/document-upload.component';
import { QuickActionsComponent } from '../components/quick-actions.component';
import { SwipeGestureDirective } from '../directives/swipe-gesture.directive';
import { SkeletonLoaderComponent } from '../components/skeleton-loader.component';
import { CollaborationPresenceComponent } from '../components/collaboration-presence.component';
import { CollaborationCursorComponent } from '../components/collaboration-cursor.component';
import { CollaborationActivityStreamComponent } from '../components/collaboration-activity-stream.component';
import { CollaborationFilterShareComponent } from '../components/collaboration-filter-share.component';
import { SpinnerComponent } from '../components/spinner.component';

@NgModule({
  declarations: [
    GenericTableComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    BadgeStatusComponent,
    KanbanBoardComponent,
    MobileDossierCardComponent,
    WhatsappMessagingContainerComponent,
    WhatsappThreadComponent,
    WhatsappMessageInputComponent,
    TemplateSelectionSheetComponent,
    ActivityTimelineComponent,
    DocumentListComponent,
    DocumentUploadComponent,
    QuickActionsComponent,
    SwipeGestureDirective,
    SkeletonLoaderComponent,
    CollaborationPresenceComponent,
    CollaborationCursorComponent,
    CollaborationActivityStreamComponent,
    CollaborationFilterShareComponent,
    SpinnerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedPipesModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatBottomSheetModule,
    MatListModule,
    DragDropModule,
    ScrollingModule
  ],
  exports: [
    GenericTableComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    BadgeStatusComponent,
    KanbanBoardComponent,
    MobileDossierCardComponent,
    WhatsappMessagingContainerComponent,
    WhatsappThreadComponent,
    WhatsappMessageInputComponent,
    TemplateSelectionSheetComponent,
    ActivityTimelineComponent,
    DocumentListComponent,
    DocumentUploadComponent,
    QuickActionsComponent,
    SwipeGestureDirective,
    SkeletonLoaderComponent,
    CollaborationPresenceComponent,
    CollaborationCursorComponent,
    CollaborationActivityStreamComponent,
    CollaborationFilterShareComponent,
    SpinnerComponent
  ]
})
export class SharedComponentsModule {}
