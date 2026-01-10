import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light theme', () => {
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should toggle theme from light to dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    service.setTheme('dark');
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('app-theme')).toBe('dark');
  });

  it('should apply dark-theme class to body', () => {
    service.setTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });

  it('should remove dark-theme class from body', () => {
    service.setTheme('dark');
    service.setTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });
});
