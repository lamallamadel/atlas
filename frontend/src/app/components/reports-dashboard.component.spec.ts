import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgChartsModule } from 'ng2-charts';

import { ReportsDashboardComponent } from './reports-dashboard.component';

describe('ReportsDashboardComponent', () => {
  let component: ReportsDashboardComponent;
  let fixture: ComponentFixture<ReportsDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportsDashboardComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatDatepickerModule,
        MatNativeDateModule,
        BrowserAnimationsModule,
        NgChartsModule
      ]
    });
    fixture = TestBed.createComponent(ReportsDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
