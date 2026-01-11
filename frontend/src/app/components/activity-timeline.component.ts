import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivityApiService, ActivityResponse, ActivityType, ActivityVisibility, ActivityCreateRequest } from '../services/activity-api.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { NoteFormDialogComponent, NoteFormDialogResult } from './note-form-dialog.component';

@Component({
  selector: 'app-activity-timeline',
  templateUrl: './activity-timeline.component.html',
  styleUrls: ['./activity-timeline.component.css']
})
export class ActivityTimelineComponent implements OnInit, OnChanges {
  @Input() dossierId!: number;

  activities: ActivityResponse[] = [];
  loading = false;
  expandedActivityIds = new Set<number>();

  ActivityType = ActivityType;
  ActivityVisibility = ActivityVisibility;

  constructor(
    private activityApiService: ActivityApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.dossierId) {
      this.loadActivities();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] && !changes['dossierId'].firstChange) {
      this.loadActivities();
    }
  }

  loadActivities(): void {
    if (!this.dossierId) {
      return;
    }

    this.loading = true;
    this.activityApiService.list({
      dossierId: this.dossierId,
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
        this.snackBar.open('Échec du chargement des activités', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  openNoteDialog(): void {
    const dialogRef = this.dialog.open(NoteFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        dossierId: this.dossierId
      }
    });

    dialogRef.afterClosed().subscribe((result: NoteFormDialogResult | undefined) => {
      if (result) {
        this.saveNote(result.content, result.visibility);
      }
    });
  }

  saveNote(content: string, visibility: ActivityVisibility): void {
    const request: ActivityCreateRequest = {
      type: ActivityType.NOTE,
      content: content,
      dossierId: this.dossierId,
      visibility: visibility
    };

    this.activityApiService.create(request).subscribe({
      next: (activity) => {
        this.snackBar.open('Note ajoutée avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.activities.unshift(activity);
      },
      error: (err) => {
        console.error('Error creating note:', err);
        this.snackBar.open('Échec de l\'ajout de la note', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
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
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: {
        title: 'Supprimer l\'activité',
        message: 'Êtes-vous sûr de vouloir supprimer cette activité ?'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.activityApiService.delete(activity.id).subscribe({
          next: () => {
            this.snackBar.open('Activité supprimée avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.activities = this.activities.filter(a => a.id !== activity.id);
          },
          error: (err) => {
            console.error('Error deleting activity:', err);
            this.snackBar.open('Échec de la suppression de l\'activité', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getActivityTypeLabel(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'Note';
      case ActivityType.STATUS_CHANGE: return 'Changement de statut';
      case ActivityType.APPOINTMENT_CREATED: return 'Rendez-vous créé';
      case ActivityType.MESSAGE_SENT: return 'Message envoyé';
      default: return type;
    }
  }

  getActivityTypeIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'note';
      case ActivityType.STATUS_CHANGE: return 'update';
      case ActivityType.APPOINTMENT_CREATED: return 'event';
      case ActivityType.MESSAGE_SENT: return 'send';
      default: return 'info';
    }
  }

  getActivityTypeBadgeClass(type: ActivityType): string {
    switch (type) {
      case ActivityType.NOTE: return 'activity-badge activity-note';
      case ActivityType.STATUS_CHANGE: return 'activity-badge activity-status';
      case ActivityType.APPOINTMENT_CREATED: return 'activity-badge activity-appointment';
      case ActivityType.MESSAGE_SENT: return 'activity-badge activity-message';
      default: return 'activity-badge';
    }
  }

  getVisibilityLabel(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL ? 'Interne' : 'Visible par le client';
  }

  getVisibilityBadgeClass(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL 
      ? 'visibility-badge visibility-internal' 
      : 'visibility-badge visibility-client';
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) {
      return '—';
    }
    const date = new Date(dateTime);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  shouldShowExpand(content: string): boolean {
    return !!(content && content.length > 200);
  }

  truncateContent(content: string): string {
    if (!content) {
      return '';
    }
    if (content.length <= 200) {
      return content;
    }
    return content.substring(0, 200) + '...';
  }

  trackByActivityId(index: number, activity: ActivityResponse): number {
    return activity.id;
  }
}
