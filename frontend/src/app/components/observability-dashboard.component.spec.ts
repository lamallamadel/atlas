import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ObservabilityDashboardComponent } from './observability-dashboard.component';
import { ReportingApiService } from '../services/reporting-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('ObservabilityDashboardComponent', () => {
  let component: ObservabilityDashboardComponent;
  let fixture: ComponentFixture<ObservabilityDashboardComponent>;
  let reportingService: jasmine.SpyObj<ReportingApiService>;

  const baseMockMetrics = {
    queueMetrics: {
      queueDepthByChannel: {
        'SMS': 10,
        'EMAIL': 5,
        'WHATSAPP': 3
      },
      totalQueued: 18
    },
    latencyMetrics: {
      latencyByChannel: {
        'SMS': { p50: 100, p95: 200, p99: 300, average: 120 },
        'EMAIL': { p50: 150, p95: 250, p99: 350, average: 170 },
        'WHATSAPP': { p50: 80, p95: 180, p99: 280, average: 100 }
      }
    },
    failureMetrics: {
      failuresByChannel: {
        'SMS': 2,
        'EMAIL': 1,
        'WHATSAPP': 0
      },
      failuresByErrorCode: {
        'INVALID_NUMBER': 1,
        'TIMEOUT': 1,
        'REJECTED': 1
      },
      failureTrend: [
        { date: '2024-01-01', value: 1 },
        { date: '2024-01-02', value: 2 }
      ],
      overallFailureRate: 5.5
    },
    dlqMetrics: {
      dlqSize: 5,
      dlqSizeByChannel: {
        'SMS': 3,
        'EMAIL': 2,
        'WHATSAPP': 0
      },
      recentDlqMessages: [
        {
          messageId: 1,
          channel: 'SMS',
          errorCode: 'INVALID_NUMBER',
          errorMessage: 'Invalid phone number',
          attemptCount: 3,
          lastAttemptAt: '2024-01-01T10:00:00Z'
        }
      ],
      alertThresholdExceeded: false,
      alertThreshold: 100
    },
    quotaMetrics: {
      quotaByChannel: {
        'SMS': { used: 500, limit: 1000, usagePercentage: 50, period: 'daily' },
        'EMAIL': { used: 800, limit: 1000, usagePercentage: 80, period: 'daily' },
        'WHATSAPP': { used: 950, limit: 1000, usagePercentage: 95, period: 'daily' }
      }
    },
    timestamp: '2024-01-01T12:00:00Z'
  };

  const createMockMetrics = () => JSON.parse(JSON.stringify(baseMockMetrics));

  beforeEach(async () => {
    const reportingServiceSpy = jasmine.createSpyObj('ReportingApiService', [
      'getObservabilityMetrics',
      'exportObservabilityMetrics'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ObservabilityDashboardComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatMenuModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatListModule,
        MatTableModule,
        MatTooltipModule
      ],
      providers: [
        { provide: ReportingApiService, useValue: reportingServiceSpy }
      ]
    }).compileComponents();

    reportingService = TestBed.inject(ReportingApiService) as jasmine.SpyObj<ReportingApiService>;
    reportingService.getObservabilityMetrics.and.returnValue(of(createMockMetrics()));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservabilityDashboardComponent);
    component = fixture.componentInstance;
    (globalThis as { Chart?: new () => { destroy: () => void; update: () => void } }).Chart = class {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      destroy(): void {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      update(): void {}
    };
    spyOn<any>(component, 'loadChartJs').and.returnValue(Promise.resolve());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default date range', () => {
    expect(component.dateFrom).toBeTruthy();
    expect(component.dateTo).toBeTruthy();
  });

  it('should load metrics on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(reportingService.getObservabilityMetrics).toHaveBeenCalled();
      expect(component.metrics).toEqual(baseMockMetrics);
      expect(component.lastUpdated).toBeTruthy();
      done();
    }, 100);
  });

  it('should toggle auto-refresh', () => {
    component.autoRefresh = true;
    component.toggleAutoRefresh();
    expect(component.autoRefresh).toBeFalse();
    
    component.toggleAutoRefresh();
    expect(component.autoRefresh).toBeTrue();
  });

  it('should handle date change', () => {
    component.dateFrom = '2024-01-01';
    component.dateTo = '2024-01-31';
    component.onDateChange();
    
    expect(reportingService.getObservabilityMetrics).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
  });

  it('should handle metrics loading error', (done) => {
    reportingService.getObservabilityMetrics.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    
    component.loadMetrics();
    
    setTimeout(() => {
      expect(component.error).toContain('Failed to load metrics');
      expect(component.loading).toBeFalse();
      done();
    }, 100);
  });

  it('should export metrics as CSV', (done) => {
    const blob = new Blob(['csv data'], { type: 'text/csv' });
    reportingService.exportObservabilityMetrics.and.returnValue(of(blob));
    
    component.exportMetrics('csv');
    
    setTimeout(() => {
      expect(reportingService.exportObservabilityMetrics).toHaveBeenCalledWith('csv', component.dateFrom, component.dateTo);
      done();
    }, 100);
  });

  it('should export metrics as JSON', (done) => {
    const blob = new Blob(['json data'], { type: 'application/json' });
    reportingService.exportObservabilityMetrics.and.returnValue(of(blob));
    
    component.exportMetrics('json');
    
    setTimeout(() => {
      expect(reportingService.exportObservabilityMetrics).toHaveBeenCalledWith('json', component.dateFrom, component.dateTo);
      done();
    }, 100);
  });

  it('should get channel names from metrics', () => {
    component.metrics = createMockMetrics();
    const channels = component.getChannelNames();
    expect(channels).toEqual(['SMS', 'EMAIL', 'WHATSAPP']);
  });

  it('should get queue depth for channel', () => {
    component.metrics = createMockMetrics();
    expect(component.getQueueDepth('SMS')).toBe(10);
    expect(component.getQueueDepth('EMAIL')).toBe(5);
    expect(component.getQueueDepth('UNKNOWN')).toBe(0);
  });

  it('should get latency for channel', () => {
    component.metrics = createMockMetrics();
    const latency = component.getLatency('SMS');
    expect(latency.p50).toBe(100);
    expect(latency.p95).toBe(200);
    expect(latency.p99).toBe(300);
  });

  it('should get DLQ size for channel', () => {
    component.metrics = createMockMetrics();
    expect(component.getDlqSize('SMS')).toBe(3);
    expect(component.getDlqSize('EMAIL')).toBe(2);
  });

  it('should determine DLQ status', () => {
    component.metrics = createMockMetrics();
    const metrics = component.metrics;
    if (!metrics) {
      fail('Expected metrics to be defined for DLQ status assertions.');
      return;
    }
    
    // Normal status
    expect(component.getDlqStatus('WHATSAPP')).toBe('normal');
    
    // Test with different thresholds
    metrics.dlqMetrics.alertThreshold = 10;
    expect(component.getDlqStatus('SMS')).toBe('normal'); // 3 < 7.5
    
    metrics.dlqMetrics.dlqSizeByChannel['SMS'] = 8;
    expect(component.getDlqStatus('SMS')).toBe('warning'); // 8 >= 7.5
    
    metrics.dlqMetrics.dlqSizeByChannel['SMS'] = 11;
    expect(component.getDlqStatus('SMS')).toBe('critical'); // 11 >= 10
  });

  it('should get quota usage for channel', () => {
    component.metrics = createMockMetrics();
    const quota = component.getQuotaUsage('SMS');
    expect(quota.used).toBe(500);
    expect(quota.limit).toBe(1000);
    expect(quota.usagePercentage).toBe(50);
  });

  it('should get quota status class', () => {
    expect(component.getQuotaStatusClass(50)).toBe('quota-normal');
    expect(component.getQuotaStatusClass(80)).toBe('quota-warning');
    expect(component.getQuotaStatusClass(95)).toBe('quota-critical');
  });

  it('should add metrics to history', () => {
    const metrics = createMockMetrics();
    component.metrics = metrics;
    component['addToHistory'](metrics);
    
    expect(component['queueDepthHistory'].length).toBe(1);
    expect(component['queueDepthHistory'][0].values).toEqual(metrics.queueMetrics.queueDepthByChannel);
  });

  it('should limit history to max points', () => {
    const maxHistoryPoints = component['maxHistoryPoints'];

    for (let i = 0; i < maxHistoryPoints + 1; i++) {
      component['addToHistory'](createMockMetrics());
    }
    
    expect(component['queueDepthHistory'].length).toBe(maxHistoryPoints);
  });

  it('should cleanup on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const date = new Date('2024-03-15');
    const formatted = component['formatDate'](date);
    expect(formatted).toBe('2024-03-15');
  });
});
