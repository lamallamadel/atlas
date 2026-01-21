import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ObservabilityDashboardComponent } from './observability-dashboard.component';
import { ReportingApiService } from '../services/reporting-api.service';
import { of } from 'rxjs';

describe('ObservabilityDashboardComponent', () => {
  let component: ObservabilityDashboardComponent;
  let fixture: ComponentFixture<ObservabilityDashboardComponent>;
  let reportingService: jasmine.SpyObj<ReportingApiService>;

  beforeEach(async () => {
    const reportingServiceSpy = jasmine.createSpyObj('ReportingApiService', [
      'getObservabilityMetrics',
      'exportObservabilityMetrics'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ ObservabilityDashboardComponent ],
      imports: [ HttpClientTestingModule, FormsModule ],
      providers: [
        { provide: ReportingApiService, useValue: reportingServiceSpy }
      ]
    })
    .compileComponents();

    reportingService = TestBed.inject(ReportingApiService) as jasmine.SpyObj<ReportingApiService>;
    fixture = TestBed.createComponent(ObservabilityDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load metrics on init', () => {
    const mockMetrics = {
      queueMetrics: { queueDepthByChannel: {}, totalQueued: 0 },
      latencyMetrics: { latencyByChannel: {} },
      failureMetrics: { failuresByChannel: {}, failuresByErrorCode: {}, failureTrend: [], overallFailureRate: 0 },
      dlqMetrics: { dlqSize: 0, dlqSizeByChannel: {}, recentDlqMessages: [], alertThresholdExceeded: false, alertThreshold: 100 },
      quotaMetrics: { quotaByChannel: {} },
      timestamp: new Date().toISOString()
    };

    reportingService.getObservabilityMetrics.and.returnValue(of(mockMetrics));
    
    component.ngOnInit();

    expect(reportingService.getObservabilityMetrics).toHaveBeenCalled();
  });
});
