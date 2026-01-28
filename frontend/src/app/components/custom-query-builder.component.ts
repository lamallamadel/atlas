import { Component, OnInit } from '@angular/core';
import { AnalyticsApiService, CustomQuery } from '../services/analytics-api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-custom-query-builder',
  template: `
    <div class="custom-query-builder">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Custom SQL Query Builder</mat-card-title>
          <button mat-raised-button color="primary" (click)="createNewQuery()">
            <mat-icon>add</mat-icon>
            New Query
          </button>
        </mat-card-header>
        
        <mat-card-content>
          <div class="query-list" *ngIf="!editingQuery">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by Category</mat-label>
              <mat-select [(ngModel)]="selectedCategory" (selectionChange)="onCategoryChange()">
                <mat-option value="">All</mat-option>
                <mat-option value="leads">Leads</mat-option>
                <mat-option value="sales">Sales</mat-option>
                <mat-option value="agents">Agents</mat-option>
                <mat-option value="properties">Properties</mat-option>
              </mat-select>
            </mat-form-field>

            <table mat-table [dataSource]="queries" class="queries-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let query">{{query.name}}</td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let query">{{query.category}}</td>
              </ng-container>

              <ng-container matColumnDef="isApproved">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let query">
                  <mat-chip [color]="query.isApproved ? 'primary' : 'warn'" selected>
                    {{query.isApproved ? 'Approved' : 'Pending'}}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="executionCount">
                <th mat-header-cell *matHeaderCellDef>Executions</th>
                <td mat-cell *matCellDef="let query">{{query.executionCount || 0}}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let query">
                  <button mat-icon-button (click)="editQuery(query)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="executeQuery(query)" 
                          [disabled]="!query.isApproved" matTooltip="Execute">
                    <mat-icon>play_arrow</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteQuery(query)" matTooltip="Delete" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <div class="query-editor" *ngIf="editingQuery">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Query Name</mat-label>
              <input matInput [(ngModel)]="editingQuery.name" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="editingQuery.description" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="editingQuery.category">
                <mat-option value="leads">Leads</mat-option>
                <mat-option value="sales">Sales</mat-option>
                <mat-option value="agents">Agents</mat-option>
                <mat-option value="properties">Properties</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>SQL Query</mat-label>
              <textarea matInput [(ngModel)]="editingQuery.sqlQuery" 
                        rows="10" 
                        placeholder="SELECT * FROM dossier WHERE ..."
                        class="sql-editor"></textarea>
              <mat-hint>Only SELECT queries are allowed</mat-hint>
            </mat-form-field>

            <mat-checkbox [(ngModel)]="editingQuery.isPublic">
              Make this query public
            </mat-checkbox>

            <div class="editor-actions">
              <button mat-raised-button (click)="cancelEdit()">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveQuery()">Save</button>
            </div>
          </div>

          <div class="query-results" *ngIf="queryResults">
            <h3>Query Results</h3>
            <table mat-table [dataSource]="queryResults" class="results-table">
              <ng-container *ngFor="let col of resultColumns" [matColumnDef]="col">
                <th mat-header-cell *matHeaderCellDef>{{col}}</th>
                <td mat-cell *matCellDef="let row">{{row[col]}}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="resultColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: resultColumns;"></tr>
            </table>

            <button mat-raised-button (click)="exportResults()" class="export-btn">
              <mat-icon>download</mat-icon>
              Export to CSV
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .custom-query-builder {
      padding: 20px;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .filter-field {
      width: 200px;
      margin-bottom: 20px;
    }

    .queries-table, .results-table {
      width: 100%;
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .sql-editor {
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }

    .editor-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .query-results {
      margin-top: 30px;
    }

    .export-btn {
      margin-top: 16px;
    }

    mat-chip {
      font-size: 12px;
    }
  `]
})
export class CustomQueryBuilderComponent implements OnInit {
  queries: CustomQuery[] = [];
  editingQuery: CustomQuery | null = null;
  selectedCategory = '';
  queryResults: any[] | null = null;
  resultColumns: string[] = [];
  
  displayedColumns = ['name', 'category', 'isApproved', 'executionCount', 'actions'];

  constructor(
    private analyticsService: AnalyticsApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadQueries();
  }

  loadQueries(): void {
    this.analyticsService.getCustomQueries().subscribe({
      next: (response) => {
        this.queries = response.content || [];
      },
      error: (error) => {
        this.snackBar.open('Failed to load queries', 'Close', { duration: 3000 });
      }
    });
  }

  createNewQuery(): void {
    this.editingQuery = {
      name: '',
      description: '',
      sqlQuery: '',
      category: 'leads',
      isPublic: false
    };
  }

  editQuery(query: CustomQuery): void {
    this.editingQuery = { ...query };
  }

  saveQuery(): void {
    if (!this.editingQuery) return;

    const saveOperation = this.editingQuery.id
      ? this.analyticsService.updateCustomQuery(this.editingQuery.id, this.editingQuery)
      : this.analyticsService.createCustomQuery(this.editingQuery);

    saveOperation.subscribe({
      next: () => {
        this.snackBar.open('Query saved successfully', 'Close', { duration: 3000 });
        this.editingQuery = null;
        this.loadQueries();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to save query', 'Close', { duration: 3000 });
      }
    });
  }

  cancelEdit(): void {
    this.editingQuery = null;
  }

  executeQuery(query: CustomQuery): void {
    if (!query.id) return;

    this.analyticsService.executeCustomQuery(query.id, {}).subscribe({
      next: (results) => {
        this.queryResults = results;
        if (results.length > 0) {
          this.resultColumns = Object.keys(results[0]);
        }
        this.snackBar.open('Query executed successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Query execution failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteQuery(query: CustomQuery): void {
    if (!query.id) return;

    if (confirm(`Are you sure you want to delete "${query.name}"?`)) {
      this.analyticsService.deleteCustomQuery(query.id).subscribe({
        next: () => {
          this.snackBar.open('Query deleted successfully', 'Close', { duration: 3000 });
          this.loadQueries();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete query', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onCategoryChange(): void {
    if (this.selectedCategory) {
      this.analyticsService.getQueriesByCategory(this.selectedCategory).subscribe({
        next: (queries) => {
          this.queries = queries;
        }
      });
    } else {
      this.loadQueries();
    }
  }

  exportResults(): void {
    if (!this.queryResults) return;

    const csv = this.convertToCSV(this.queryResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
