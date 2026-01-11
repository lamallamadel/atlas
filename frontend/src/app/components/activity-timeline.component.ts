import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivityApiService, ActivityResponse, ActivityType, ActivityVisibility, ActivityCreateRequest, ActivityUpdateRequest } from '../services/activity-api.service';
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
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
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

  openNoteDialog(activity?: ActivityResponse): void {
    const dialogRef = this.dialog.open(NoteFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        dossierId: this.dossierId,
        content: activity?.content || '',
        visibility: activity?.visibility || ActivityVisibility.INTERNAL,
        isEdit: !!activity
      }
    });

    dialogRef.afterClosed().subscribe((result: NoteFormDialogResult | undefined) => {
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

  updateNote(activityId: number, content: string, visibility: ActivityVisibility): void {
    const request: ActivityUpdateRequest = {
      content: content,
      visibility: visibility
    };

    this.activityApiService.update(activityId, request).subscribe({
      next: (updatedActivity) => {
        this.snackBar.open('Note modifiée avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        const index = this.activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
          this.activities[index] = updatedActivity;
        }
      },
      error: (err) => {
        console.error('Error updating note:', err);
        this.snackBar.open('Échec de la modification de la note', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  editActivity(activity: ActivityResponse): void {
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
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: {
        title: 'Supprimer la note',
        message: 'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.activityApiService.delete(activity.id).subscribe({
          next: () => {
            this.snackBar.open('Note supprimée avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.activities = this.activities.filter(a => a.id !== activity.id);
          },
          error: (err) => {
            console.error('Error deleting activity:', err);
            this.snackBar.open('Échec de la suppression de la note', 'Fermer', {
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

  getUserInitials(name: string | undefined): string {
    if (!name) {
      return 'SY';
    }

    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'U';
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
    return visibility === ActivityVisibility.INTERNAL ? 'Interne' : 'Client';
  }

  getVisibilityIcon(visibility: ActivityVisibility): string {
    return visibility === ActivityVisibility.INTERNAL ? 'lock' : 'visibility';
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
    return !!(content && content.length > 300);
  }

  truncateContent(content: string): string {
    if (!content) {
      return '';
    }
    if (content.length <= 300) {
      return content;
    }
    return content.substring(0, 300) + '...';
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

  trackByActivityId(index: number, activity: ActivityResponse): number {
    return activity.id;
  }
}
