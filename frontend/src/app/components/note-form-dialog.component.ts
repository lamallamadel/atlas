import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { ActivityVisibility } from '../services/activity-api.service';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

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
    templateUrl: './note-form-dialog.component.html',
    styleUrls: ['./note-form-dialog.component.css'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, CdkTextareaAutosize, FormsModule, MatHint, MatSelect, MatOption, MatIcon, MatDialogActions, MatButton]
})
export class NoteFormDialogComponent {
  noteContent = '';
  noteVisibility: ActivityVisibility = ActivityVisibility.INTERNAL;
  ActivityVisibility = ActivityVisibility;
  isEdit = false;

  constructor(
    public dialogRef: MatDialogRef<NoteFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NoteFormDialogData
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
