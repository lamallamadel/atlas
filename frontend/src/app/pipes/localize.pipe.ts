import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe for localizing strings in templates
 * Note: This is a pass-through pipe since Angular's i18n handles translation at compile-time
 * It's provided for template consistency and potential runtime fallback
 */
@Pipe({
  name: 'localize'
})
export class LocalizePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}
