import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReIconComponent } from './re-icon.component';
import { IconRegistryService } from '../../services/icon-registry.service';
import { of } from 'rxjs';

describe('ReIconComponent', () => {
  let component: ReIconComponent;
  let fixture: ComponentFixture<ReIconComponent>;
  let iconRegistryService: jasmine.SpyObj<IconRegistryService>;

  beforeEach(async () => {
    const iconRegistrySpy = jasmine.createSpyObj('IconRegistryService', [
      'isLoaded',
      'getIconSync',
      'getIcon'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ReIconComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: IconRegistryService, useValue: iconRegistrySpy }
      ]
    }).compileComponents();

    iconRegistryService = TestBed.inject(IconRegistryService) as jasmine.SpyObj<IconRegistryService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReIconComponent);
    component = fixture.componentInstance;
    component.icon = 're-house';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load icon on init when icons are already loaded', () => {
    const mockSvg = '<svg>test</svg>';
    iconRegistryService.isLoaded.and.returnValue(true);
    iconRegistryService.getIconSync.and.returnValue(mockSvg as any);

    component.ngOnInit();

    expect(iconRegistryService.isLoaded).toHaveBeenCalled();
    expect(iconRegistryService.getIconSync).toHaveBeenCalledWith('re-house');
    expect(component.iconSvg).toBe(mockSvg as any);
  });

  it('should load icon asynchronously when icons are not loaded', () => {
    const mockSvg = '<svg>test</svg>';
    iconRegistryService.isLoaded.and.returnValue(false);
    iconRegistryService.getIcon.and.returnValue(of(mockSvg as any));

    component.ngOnInit();

    expect(iconRegistryService.isLoaded).toHaveBeenCalled();
    expect(iconRegistryService.getIcon).toHaveBeenCalledWith('re-house');
    expect(component.iconSvg).toBe(mockSvg as any);
  });

  it('should return correct size class', () => {
    component.size = 'small';
    expect(component.sizeClass).toBe('re-icon-small');

    component.size = 'medium';
    expect(component.sizeClass).toBe('re-icon-medium');

    component.size = 'large';
    expect(component.sizeClass).toBe('re-icon-large');

    component.size = 'xlarge';
    expect(component.sizeClass).toBe('re-icon-xlarge');
  });

  it('should apply custom color style', () => {
    component.color = '#1976d2';
    const styles = component.styles;
    expect(styles['color']).toBe('#1976d2');
  });

  it('should not apply color style when color is undefined', () => {
    component.color = undefined;
    const styles = component.styles;
    expect(styles['color']).toBeUndefined();
  });

  it('should use default size when not specified', () => {
    expect(component.size).toBe('medium');
  });

  it('should render with correct aria-label', () => {
    component.ariaLabel = 'Test House Icon';
    iconRegistryService.isLoaded.and.returnValue(true);
    iconRegistryService.getIconSync.and.returnValue('<svg>test</svg>' as any);
    
    fixture.detectChanges();
    
    const spanElement = fixture.nativeElement.querySelector('span');
    expect(spanElement.getAttribute('aria-label')).toBe('Test House Icon');
  });

  it('should use icon id as aria-label when not provided', () => {
    component.icon = 're-house';
    component.ariaLabel = undefined;
    iconRegistryService.isLoaded.and.returnValue(true);
    iconRegistryService.getIconSync.and.returnValue('<svg>test</svg>' as any);
    
    fixture.detectChanges();
    
    const spanElement = fixture.nativeElement.querySelector('span');
    expect(spanElement.getAttribute('aria-label')).toBe('re-house');
  });
});
