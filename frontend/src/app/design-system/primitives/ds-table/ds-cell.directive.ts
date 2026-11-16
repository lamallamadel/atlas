import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[dsCell]',
  standalone: true
})
export class DsCellDirective {
  @Input('dsCell') key!: string;

  constructor(public template: TemplateRef<any>) {}
}
