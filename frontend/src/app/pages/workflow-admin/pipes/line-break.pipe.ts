import { escapeHtml } from '../../../utils/escape-html';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'lineBreak' })
export class LineBreakPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    // Le texte est échappé avant d'y insérer les <br> : seul ce balisage est rendu.
    const withBreaks = escapeHtml(value).replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(withBreaks);
  }
}
