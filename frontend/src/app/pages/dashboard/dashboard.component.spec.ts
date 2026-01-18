import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDashboardKpiService: jasmine.SpyObj<DashboardKpiService>;

  beforeEach(async () => {
    mockDashboardKpiService = jasmine.createSpyObj('DashboardKpiService', [
      'getTrends',
      'getRecentDossiers'
    ]);

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
        MatButtonModule
      ],
      declarations: [DashboardComponent],
      providers: [
        { provide: DashboardKpiService, useValue: mockDashboardKpiService },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) }
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
