import { Component, OnInit, OnChanges, SimpleChanges, input, inject } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivityApiService, ActivityResponse, ActivityType, ActivityVisibility, ActivityCreateRequest, ActivityUpdateRequest } from '../services/activity-api.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { NoteFormDialogComponent, NoteFormDialogResult } from './note-form-dialog.component';
import {
  DsButtonComponent,
  DsCardComponent,
  DsIconComponent,
  DsToastService,
  DsSkeletonComponent,
  DsDialogService
} from '../design-system';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-activity-timeline',
    standalone: true,
    templateUrl: './activity-timeline.component.html',
    styleUrls: ['./activity-timeline.component.css'],
    imports: [
      CommonModule,
      DsButtonComponent,
      DsIconComponent,
      DsCardComponent,
      DsSkeletonComponent,
      CdkConnectedOverlay,
      CdkOverlayOrigin,
    ]
})
export class ActivityTimelineComponent implements OnInit, OnChanges {
  private readonly overlay = inject(Overlay);
  private activityApiService = inject(ActivityApiService);
  private toastService = inject(DsToastService);
  private dsDialogService = inject(DsDialogService);
  private sanitizer = inject(DomSanitizer);

  /** Menu actions note (remplace `mat-menu`, une ligne ouverte à la fois). */
  noteActionsMenuOpenForId: number | null = null;
  readonly noteMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly noteMenuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];

  readonly dossierId = input.required<number>();

  activities: ActivityResponse[] = [];
  loading = false;
  expandedActivityIds = new Set<number>();

  ActivityType = ActivityType;
  ActivityVisibility = ActivityVisibility;

  ngOnInit(): void {
    if (this.dossierId()) {
      this.loadActivities();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] && !changes['dossierId'].firstChange) {
      this.loadActivities();
    }
  }

  loadActivities(): void {
    const dossierId = this.dossierId();
    if (!dossierId) return;

    this.loading = true;
    this.activityApiService.list({
      dossierId: dossierId,
      size: 100,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        this.activities = response.content;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.loading = false;
        this.toastService.error('Échec du chargement des activités');
      }
    });
  }

  openNoteDialog(activity?: ActivityResponse): void {
    const dialogRef = this.dsDialogService.open<NoteFormDialogResult>(NoteFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        dossierId: this.dossierId(),
        content: activity?.content || '',
        visibility: activity?.visibility || ActivityVisibility.INTERNAL,
        isEdit: !!activity
      }
    });

    dialogRef.closed.subscribe((result: NoteFormDialogResult | undefined) => {
      if (result) {
        if (activity) {
          this.updateNote(activity.id, result.content, result.visibility);
        } else {
          this.saveNote(result.content, result.visibility);
        }
      }
    });
  }

  saveNote(content: string, visibility: ActivityVisibility): void {
    const request: ActivityCreateRequest = {
      type: ActivityType.NOTE,
      content: content,
      dossierId: this.dossierId(),
      visibility: visibility
    };

    this.activityApiService.create(request).subscribe({
      next: (activity) => {
        this.toastService.success('Note ajoutée avec succès');
        this.activities.unshift(activity);
      },
      error: (err) => {
        console.error('Error creating note:', err);
        this.toastService.error('Échec de l\'ajout de la note');
      }
    });
  }

  updateNote(activityId: number, content: string, visibility: ActivityVisibility): void {
    const request: ActivityUpdateRequest = {
      content: content,
      visibility: visibility
    };

    this.activityApiService.update(activityId, request).subscribe({
      next: (updatedActivity) => {
        this.toastService.success('Note modifiée avec succès');
        const index = this.activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
          this.activities[index] = updatedActivity;
        }
      },
      error: (err) => {
        console.error('Error updating note:', err);
        this.toastService.error('Échec de la modification de la note');
      }
    });
  }

  toggleNoteActionsMenu(activityId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.noteActionsMenuOpenForId =
      this.noteActionsMenuOpenForId === activityId ? null : activityId;
  }

  closeNoteActionsMenu(): void {
    this.noteActionsMenuOpenForId = null;
  }

  editActivity(activity: ActivityResponse): void {
    this.closeNoteActionsMenu();
    this.openNoteDialog(activity);
  }

  toggleExpanded(activityId: number): void {
    if (this.expandedActivityIds.has(activityId)) {
      this.expandedActivityIds.delete(activityId);
    } else {
      this.expandedActivityIds.add(activityId);
    }
  }

  isExpanded(activityId: number): boolean {
    return this.expandedActivityIds.has(activityId);
  }

  deleteActivity(activity: ActivityResponse): void {
    this.closeNoteActionsMenu();
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la note',
        message: 'Êtes-vous sûr de vouloir supprimer cette note ?'
      }
    });

    dialogRef.closed.subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.activityApiService.delete(activity.id).subscribe({
          next: () => {
            this.toastService.success('Note supprimée avec succès');
            this.activities = this.activities.filter(a => a.id !== activity.id);
          },
          error: (err) => {
            console.error('Error deleting activity:', err);
            this.toastService.error('Échec de la suppression');
          }
        });
      }
    });
  }

  getUserInitials(name: string | undefined): string {
    if (!name) return 'SY';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  getActivityTypeLabel(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'Note';
      case ActivityType.STATUS_CHANGE: return 'Statut';
      case ActivityType.APPOINTMENT_CREATED: return 'Rendez-vous';
      case ActivityType.MESSAGE_SENT: return 'Message';
      default: return type;
    }
  }

  getActivityTypeDsIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'edit';
      case ActivityType.STATUS_CHANGE: return 'refresh';
      case ActivityType.APPOINTMENT_CREATED: return 'calendar';
      case ActivityType.MESSAGE_SENT: return 'upload';
      default: return 'info';
    }
  }

  getVisibilityLabel(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL ? 'Interne' : 'Client';
  }

  getVisibilityDsIcon(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL ? 'lock' : 'users';
  }

  shouldShowExpand(content: string): boolean {
    return !!(content && content.length > 300);
  }

  truncateContent(content: string): string {
    if (!content) return '';
    return content.length <= 300 ? content : content.substring(0, 300) + '...';
  }

  sanitizeContent(content: string): SafeHtml {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
    return this.sanitizer.sanitize(1, escaped) || '';
  }

  getActivityTypeBadgeClass(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'badge-note';
      case ActivityType.STATUS_CHANGE: return 'badge-status';
      case ActivityType.APPOINTMENT_CREATED: return 'badge-appointment';
      case ActivityType.MESSAGE_SENT: return 'badge-message';
      default: return 'badge-default';
    }
  }

  getVisibilityBadgeClass(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL ? 'badge-internal' : 'badge-client';
  }

  formatDateTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByActivityId(index: number, activity: ActivityResponse): number {
    return activity.id;
  }
}
