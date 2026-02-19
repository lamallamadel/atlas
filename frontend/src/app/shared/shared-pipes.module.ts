import { NgModule } from '@angular/core';
import { DateFormatPipe } from '../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../pipes/phone-format.pipe';
import { PriceFormatPipe } from '../pipes/price-format.pipe';
import { HighlightPipe } from '../pipes/highlight.pipe';

@NgModule({
  declarations: [
    DateFormatPipe,
    PhoneFormatPipe,
    PriceFormatPipe,
    HighlightPipe
  ],
  exports: [
    DateFormatPipe,
    PhoneFormatPipe,
    PriceFormatPipe,
    HighlightPipe
  ]
})
export class SharedPipesModule {}
