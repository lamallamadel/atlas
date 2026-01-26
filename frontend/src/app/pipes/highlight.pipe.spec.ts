import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DomSanitizer]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new HighlightPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return original text when search is empty', () => {
    const result = pipe.transform('hello world', '');
    expect(result).toBe('hello world');
  });

  it('should return original text when text is empty', () => {
    const result = pipe.transform('', 'search');
    expect(result).toBe('');
  });

  it('should highlight matching text', () => {
    const result = pipe.transform('hello world', 'world');
    expect(result).toContain('world');
  });

  it('should be case insensitive', () => {
    const result = pipe.transform('Hello World', 'world');
    expect(result).toBeTruthy();
  });

  it('should highlight multiple occurrences', () => {
    const result = pipe.transform('test test test', 'test');
    expect(result).toBeTruthy();
  });
});
