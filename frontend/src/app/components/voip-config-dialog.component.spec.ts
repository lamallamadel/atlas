import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VoipConfigDialogComponent } from './voip-config-dialog.component';
import { VoipService } from '../services/voip.service';

describe('VoipConfigDialogComponent', () => {
  let component: VoipConfigDialogComponent;
  let fixture: ComponentFixture<VoipConfigDialogComponent>;
  let mockDialogRef: AngularVitestPartialMock<DialogRef<VoipConfigDialogComponent>>;
  let mockVoipService: AngularVitestPartialMock<VoipService>;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn().mockName('DialogRef.close')};
    mockVoipService = {
      getConfiguration: vi.fn().mockName('VoipService.getConfiguration'),
      setConfiguration: vi.fn().mockName('VoipService.setConfiguration')};
    mockVoipService.getConfiguration.mockReturnValue({
      enabled: false,
      provider: null});

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        VoipConfigDialogComponent],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: VoipService, useValue: mockVoipService },
        { provide: DIALOG_DATA, useValue: null }]}).compileComponents();

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
      clickToCallUrl: 'tel:{phone}'};

    component.onSave();
    expect(mockVoipService.setConfiguration).toHaveBeenCalledWith(
      component.config
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(component.config);
  });

  it('should cancel dialog', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
