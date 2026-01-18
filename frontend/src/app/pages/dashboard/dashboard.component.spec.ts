import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';

@Component({
  selector: 'app-loading-skeleton',
  template: ''
})
class MockLoadingSkeletonComponent {
  @Input() variant?: string;
  @Input() rows?: number;
}

@Component({
  selector: 'app-empty-state',
  template: ''
})
class MockEmptyStateComponent {
  @Input() message?: string;
  @Input() primaryAction?: any;
  @Input() secondaryAction?: any;
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDashboardKpiService: jasmine.SpyObj<DashboardKpiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockDashboardKpiService = jasmine.createSpyObj('DashboardKpiService', [
      'getTrends',
      'getRecentDossiers'
    ]);

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    mockDashboardKpiService.getTrends.and.returnValue(of({
      annoncesActives: { currentValue: 10, previousValue: 8, percentageChange: 25 },
      dossiersATraiter: { currentValue: 5, previousValue: 5, percentageChange: 0 }
    }));
    mockDashboardKpiService.getRecentDossiers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatButtonToggleModule,
        NoopAnimationsModule
      ],
      declarations: [
        DashboardComponent,
        MockLoadingSkeletonComponent,
        MockEmptyStateComponent
      ],
      providers: [
        { provide: DashboardKpiService, useValue: mockDashboardKpiService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    })
      .compileComponents();

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
