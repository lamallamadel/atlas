import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ActivityVisibility } from '../services/activity-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent,
  DsCardComponent
} from '../design-system';

export interface NoteFormDialogData {
  dossierId: number;
  content?: string;
  visibility?: ActivityVisibility;
  isEdit?: boolean;
}

export interface NoteFormDialogResult {
  content: string;
  visibility: ActivityVisibility;
}

@Component({
    selector: 'app-note-form-dialog',
    standalone: true,
    templateUrl: './note-form-dialog.component.html',
    styleUrls: ['./note-form-dialog.component.css'],
    imports: [
      CommonModule,
      FormsModule,
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class NoteFormDialogComponent {
  noteContent = '';
  noteVisibility: ActivityVisibility = ActivityVisibility.INTERNAL;
  ActivityVisibility = ActivityVisibility;
  isEdit = false;

  readonly visibilityOptions: DsSelectOption[] = [
    { value: ActivityVisibility.INTERNAL, label: 'Interne (Équipe uniquement)' },
    { value: ActivityVisibility.CLIENT_VISIBLE, label: 'Public (Visible par le client)' }
  ];

  constructor(
    private dialogRef: DialogRef<NoteFormDialogResult>,
    @Inject(DIALOG_DATA) public data: NoteFormDialogData
  ) {
    this.isEdit = data.isEdit || false;
    this.noteContent = data.content || '';
    this.noteVisibility = data.visibility || ActivityVisibility.INTERNAL;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const trimmedContent = this.noteContent.trim();
    if (!trimmedContent) {
      return;
    }

    const result: NoteFormDialogResult = {
      content: this.noteContent,
      visibility: this.noteVisibility
    };

    this.dialogRef.close(result);
  }

  isContentEmpty(): boolean {
    return !this.noteContent.trim();
  }
}
