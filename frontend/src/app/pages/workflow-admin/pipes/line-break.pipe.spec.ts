import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { LineBreakPipe } from './line-break.pipe';

describe('LineBreakPipe', () => {
  it('keeps line breaks but renders no other markup from the text', () => {
    const pipe = new LineBreakPipe(TestBed.inject(DomSanitizer));
    const out = pipe.transform('Bonjour <b>Karim</b>\nÀ bientôt') as { changingThisBreaksApplicationSecurity: string };
    expect(out.changingThisBreaksApplicationSecurity).toBe('Bonjour &lt;b&gt;Karim&lt;/b&gt;<br>À bientôt');
  });
});
