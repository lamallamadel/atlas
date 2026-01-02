import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'priceFormat'
})
export class PriceFormatPipe implements PipeTransform {
  private currencyPipe: CurrencyPipe;

  constructor() {
    this.currencyPipe = new CurrencyPipe('fr-FR');
  }

  transform(value: number | null | undefined, currency = 'EUR'): string {
    if (value === null || value === undefined) {
      return '';
    }
    return this.currencyPipe.transform(value, currency, 'symbol', '1.2-2', 'fr-FR') || '';
  }
}
