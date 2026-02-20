import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OfflineIndicatorComponent } from './offline-indicator.component';
import { OfflineService } from '../services/offline.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NotificationService } from '../services/notification.service';

describe('OfflineIndicatorComponent', () => {
  let component: OfflineIndicatorComponent;
  let fixture: ComponentFixture<OfflineIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfflineIndicatorComponent],
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule,
        HttpClientTestingModule,
        MatSnackBarModule
      ],
      providers: [
        OfflineService,
        OfflineQueueService,
        OfflineStorageService,
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error', 'info', 'warning', 'critical']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
