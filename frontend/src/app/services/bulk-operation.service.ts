import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import {
  BulkOperationDialogComponent,
  BulkOperationDialogData
} from '../components/bulk-operation-dialog.component';

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ id: number; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class BulkOperationService {
  constructor(private dialog: MatDialog) { }

  private isBulkOperationResult(value: unknown): value is BulkOperationResult {
    if (!value || typeof value !== 'object') {
      return false;
    }
    return (
      'successCount' in value ||
      'failureCount' in value ||
      'errors' in value
    );
  }

  executeBulkOperation<T>(
    operation: Observable<T>,
    config: {
      title: string;
      message: string;
      totalCount: number;
    }
  ): Observable<T> {
    const dialogData: BulkOperationDialogData = {
      title: config.title,
      message: config.message,
      successCount: 0,
      failureCount: 0,
      totalCount: config.totalCount,
      errors: [],
      inProgress: true
    };

    this.dialog.open(BulkOperationDialogComponent, {
      width: '500px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      disableClose: true,
      data: dialogData
    });

    return operation.pipe(
      tap<T>((result) => {
        dialogData.inProgress = false;

        const maybe = result as unknown;
        if (this.isBulkOperationResult(maybe)) {
          dialogData.successCount = maybe.successCount || 0;
          dialogData.failureCount = maybe.failureCount || 0;
          dialogData.errors = maybe.errors || [];
        }
      }),
      finalize(() => {
        if (dialogData.inProgress) {
          dialogData.inProgress = false;
          dialogData.failureCount = dialogData.totalCount;
          dialogData.errors = [
            { id: 0, message: "Une erreur est survenue lors de l'opération" }
          ];
        }
      })
    );
  }
}
