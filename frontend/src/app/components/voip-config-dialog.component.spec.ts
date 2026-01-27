import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VoipConfigDialogComponent } from './voip-config-dialog.component';
import { VoipService } from '../services/voip.service';

describe('VoipConfigDialogComponent', () => {
  let component: VoipConfigDialogComponent;
  let fixture: ComponentFixture<VoipConfigDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<VoipConfigDialogComponent>>;
  let mockVoipService: jasmine.SpyObj<VoipService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockVoipService = jasmine.createSpyObj('VoipService', [
      'getConfiguration',
      'setConfiguration'
    ]);
    mockVoipService.getConfiguration.and.returnValue({
      enabled: false,
      provider: null
    });

    await TestBed.configureTestingModule({
      declarations: [VoipConfigDialogComponent],
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: VoipService, useValue: mockVoipService },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VoipConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save configuration', () => {
    component.config = {
      enabled: true,
      provider: 'twilio',
      apiKey: 'test-key',
      clickToCallUrl: 'tel:{phone}'
    };

    component.onSave();
    expect(mockVoipService.setConfiguration).toHaveBeenCalledWith(component.config);
    expect(mockDialogRef.close).toHaveBeenCalledWith(component.config);
  });

  it('should cancel dialog', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
