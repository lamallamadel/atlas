import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { BulkOperationDialogComponent, BulkOperationDialogData } from '../components/bulk-operation-dialog.component';

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ id: number; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class BulkOperationService {
  constructor(private dialog: MatDialog) {}

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

    this.dialog.open(
      BulkOperationDialogComponent,
      {
        width: '500px',
        disableClose: true,
        data: dialogData
      }
    );

    return operation.pipe(
      tap((result: BulkOperationResult | unknown) => {
        dialogData.inProgress = false;
        if (result && typeof result === 'object' && 'successCount' in result) {
          const bulkResult = result as BulkOperationResult;
          dialogData.successCount = bulkResult.successCount || 0;
          dialogData.failureCount = bulkResult.failureCount || 0;
          dialogData.errors = bulkResult.errors || [];
        }
      }),
      finalize(() => {
        if (dialogData.inProgress) {
          dialogData.inProgress = false;
          dialogData.failureCount = dialogData.totalCount;
          dialogData.errors = [{ id: 0, message: 'Une erreur est survenue lors de l\'opération' }];
        }
      })
    );
  }
}
