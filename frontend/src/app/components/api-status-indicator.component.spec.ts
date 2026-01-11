import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiStatusIndicatorComponent } from './api-status-indicator.component';
import { PingService } from '../services/ping.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('ApiStatusIndicatorComponent', () => {
  let component: ApiStatusIndicatorComponent;
  let fixture: ComponentFixture<ApiStatusIndicatorComponent>;
  let mockPingService: jasmine.SpyObj<PingService>;

  beforeEach(async () => {
    mockPingService = jasmine.createSpyObj('PingService', ['ping']);

    await TestBed.configureTestingModule({
      declarations: [ ApiStatusIndicatorComponent ],
      imports: [
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDividerModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: PingService, useValue: mockPingService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiStatusIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check API connection on init', () => {
    mockPingService.ping.and.returnValue(of({ message: 'pong' }));
    fixture.detectChanges();
    expect(mockPingService.ping).toHaveBeenCalled();
  });

  it('should set status to connected on successful ping', () => {
    mockPingService.ping.and.returnValue(of({ message: 'pong' }));
    component.checkApiConnection();
    expect(component.apiStatus).toBe('connected');
    expect(component.lastChecked).toBeTruthy();
  });

  it('should set status to disconnected on failed ping', () => {
    mockPingService.ping.and.returnValue(throwError(() => new Error('Connection failed')));
    component.checkApiConnection();
    expect(component.apiStatus).toBe('disconnected');
    expect(component.lastChecked).toBeTruthy();
  });

  it('should return correct status text', () => {
    component.apiStatus = 'connected';
    expect(component.getStatusText()).toBe('API connectée');

    component.apiStatus = 'disconnected';
    expect(component.getStatusText()).toBe('API déconnectée');

    component.apiStatus = 'checking';
    expect(component.getStatusText()).toBe('Vérification...');
  });

  it('should return correct tooltip text', () => {
    component.lastChecked = new Date('2024-01-15T10:30:00');
    const tooltipText = component.getTooltipText();
    expect(tooltipText).toContain('Dernière vérification:');

    component.lastChecked = null;
    expect(component.getTooltipText()).toBe('Vérification de la connexion API');
  });

  it('should return correct status class', () => {
    component.apiStatus = 'connected';
    expect(component.getStatusClass()).toBe('status-connected');

    component.apiStatus = 'disconnected';
    expect(component.getStatusClass()).toBe('status-disconnected');

    component.apiStatus = 'checking';
    expect(component.getStatusClass()).toBe('status-checking');
  });
});
