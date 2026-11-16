import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import {
  DashboardKpiService,
  TrendsResponse} from '../../services/dashboard-kpi.service';
import { DossierResponse } from '../../services/dossier-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let getTrendsCallCount = 0;
  let getRecentDossiersCallCount = 0;

  beforeEach(async () => {
    getTrendsCallCount = 0;
    getRecentDossiersCallCount = 0;

    const mockDashboardKpiService: Pick<
      DashboardKpiService,
      'getTrends' | 'getRecentDossiers'
    > = {
      getTrends: (_period?: string): Observable<TrendsResponse> => {
        getTrendsCallCount++;
        return of({
          annoncesActives: {
            currentValue: 10,
            previousValue: 8,
            percentageChange: 25},
          dossiersATraiter: {
            currentValue: 5,
            previousValue: 5,
            percentageChange: 0}});
      },
      getRecentDossiers: (_filter?: string): Observable<DossierResponse[]> => {
        getRecentDossiersCallCount++;
        return of([]);
      }};

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        DashboardComponent],
      providers: [
        { provide: DashboardKpiService, useValue: mockDashboardKpiService },
        { provide: MatDialog, useValue: { open: (): void => {} } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();

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
    expect(getTrendsCallCount).toBeGreaterThanOrEqual(1);
    expect(getRecentDossiersCallCount).toBeGreaterThanOrEqual(1);
  });

  it('should return KPI card keys', () => {
    const keys = component.getKpiCardKeys();
    expect(keys).toContain('annoncesActives');
    expect(keys).toContain('dossiersATraiter');
  });
});
