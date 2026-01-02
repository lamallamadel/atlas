import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {
  private datePipe: DatePipe;

  constructor() {
    this.datePipe = new DatePipe('fr-FR');
  }

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm') || '';
  }
}
