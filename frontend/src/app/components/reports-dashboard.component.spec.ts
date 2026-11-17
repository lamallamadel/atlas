import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgChartsModule } from 'ng2-charts';

import { ReportsDashboardComponent } from './reports-dashboard.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ReportsDashboardComponent', () => {
  let component: ReportsDashboardComponent;
  let fixture: ComponentFixture<ReportsDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        BrowserAnimationsModule,
        NgChartsModule,
        ReportsDashboardComponent],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]});
    fixture = TestBed.createComponent(ReportsDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
