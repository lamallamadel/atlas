import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Add whatever your templates use frequently:
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,

        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatSnackBarModule,
        MatTabsModule,
        MatCardModule,
        MatExpansionModule,
        MatPaginatorModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,

        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatSnackBarModule,
        MatTabsModule,
        MatCardModule,
        MatExpansionModule,
        MatPaginatorModule,
        MatDatepickerModule,
        MatNativeDateModule
    ]
})
export class MaterialTestingModule { }
