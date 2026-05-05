import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

@Component({
  selector: 'app-loading-skeleton',
  template: '',
  imports: [
    RouterTestingModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
  ],
})
class MockLoadingSkeletonComponent {
  readonly variant = input<string>();
  readonly rows = input<number>();
}

@Component({
  selector: 'app-empty-state',
  template: '',
  imports: [
    RouterTestingModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
  ],
})
class MockEmptyStateComponent {
  readonly message = input<string>();
  readonly primaryAction = input<any>();
  readonly secondaryAction = input<any>();
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDashboardKpiService: AngularVitestPartialMock<DashboardKpiService>;
  let mockDialog: AngularVitestPartialMock<MatDialog>;

  beforeEach(async () => {
    mockDashboardKpiService = {
      getTrends: vi.fn().mockName('DashboardKpiService.getTrends'),
      getRecentDossiers: vi
        .fn()
        .mockName('DashboardKpiService.getRecentDossiers'),
    };

    mockDialog = {
      open: vi.fn().mockName('MatDialog.open'),
    };

    mockDashboardKpiService.getTrends.mockReturnValue(
      of({
        annoncesActives: {
          currentValue: 10,
          previousValue: 8,
          percentageChange: 25,
        },
        dossiersATraiter: {
          currentValue: 5,
          previousValue: 5,
          percentageChange: 0,
        },
      })
    );
    mockDashboardKpiService.getRecentDossiers.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatButtonToggleModule,
        NoopAnimationsModule,
        DashboardComponent,
        MockLoadingSkeletonComponent,
        MockEmptyStateComponent,
      ],
      providers: [
        { provide: DashboardKpiService, useValue: mockDashboardKpiService },
        { provide: MatDialog, useValue: mockDialog },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize KPI cards', () => {
    expect(component.kpiCards['annoncesActives']).toBeDefined();
    expect(component.kpiCards['dossiersATraiter']).toBeDefined();
  });

  it('should load KPIs on init', () => {
    fixture.detectChanges();
    expect(mockDashboardKpiService.getTrends).toHaveBeenCalled();
    expect(mockDashboardKpiService.getRecentDossiers).toHaveBeenCalled();
  });

  it('should return KPI card keys', () => {
    const keys = component.getKpiCardKeys();
    expect(keys).toContain('annoncesActives');
    expect(keys).toContain('dossiersATraiter');
  });
});
