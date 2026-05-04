import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-filter-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="classes"
      [attr.aria-pressed]="active"
      (click)="toggle()">
      <ng-content></ng-content>
      @if (count !== null) {
        <span class="ds-filter-chip__count">{{ count }}</span>
      }
    </button>
  `,
  styleUrls: ['./ds-filter-chip.component.scss'],
})
export class DsFilterChipComponent {
  @Input() active = false;
  @Input() count: number | null = null;
  @Input() disabled = false;
  @Output() toggled = new EventEmitter<boolean>();

  get classes(): string {
    return [
      'ds-filter-chip',
      this.active   ? 'ds-filter-chip--active'   : '',
      this.disabled ? 'ds-filter-chip--disabled' : '',
    ].filter(Boolean).join(' ');
  }

  toggle(): void {
    if (!this.disabled) {
      this.active = !this.active;
      this.toggled.emit(this.active);
    }
  }
}
