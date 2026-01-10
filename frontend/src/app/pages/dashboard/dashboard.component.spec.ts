import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { PingService } from '../../services/ping.service';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockPingService: jasmine.SpyObj<PingService>;
  let mockDashboardKpiService: jasmine.SpyObj<DashboardKpiService>;

  beforeEach(async () => {
    mockPingService = jasmine.createSpyObj('PingService', ['ping']);
    mockDashboardKpiService = jasmine.createSpyObj('DashboardKpiService', [
      'getActiveAnnoncesCount',
      'getDossiersATraiterCount',
      'getRecentDossiers'
    ]);

    mockPingService.ping.and.returnValue(of({ status: 'ok' }));
    mockDashboardKpiService.getActiveAnnoncesCount.and.returnValue(of(10));
    mockDashboardKpiService.getDossiersATraiterCount.and.returnValue(of(5));
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
        { provide: PingService, useValue: mockPingService },
        { provide: DashboardKpiService, useValue: mockDashboardKpiService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
    expect(mockDashboardKpiService.getActiveAnnoncesCount).toHaveBeenCalled();
    expect(mockDashboardKpiService.getDossiersATraiterCount).toHaveBeenCalled();
    expect(mockDashboardKpiService.getRecentDossiers).toHaveBeenCalled();
  });

  it('should check API connection on init', () => {
    fixture.detectChanges();
    expect(mockPingService.ping).toHaveBeenCalled();
  });

  it('should return KPI card keys', () => {
    const keys = component.getKpiCardKeys();
    expect(keys).toContain('annoncesActives');
    expect(keys).toContain('dossiersATraiter');
  });
});
