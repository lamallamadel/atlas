import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DsFilterChipComponent } from '../../primitives/ds-filter-chip/ds-filter-chip.component';
import { DsButtonComponent } from '../../primitives/ds-button/ds-button.component';

export interface DsFilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'ds-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, DsFilterChipComponent, DsButtonComponent],
  template: `
    <div class="ds-filter-bar" role="search">
      @if (showSearch) {
        <div class="ds-filter-bar__search">
          <svg class="ds-filter-bar__search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 14l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            class="ds-filter-bar__search-input"
            type="search"
            [placeholder]="searchPlaceholder"
            [(ngModel)]="searchValue"
            (ngModelChange)="searchChange.emit($event)"
            [attr.aria-label]="searchPlaceholder" />
        </div>
      }

      @if (filters.length) {
        <div class="ds-filter-bar__chips" role="group" [attr.aria-label]="'Filtres ' + label">
          @for (f of filters; track f.value) {
            <ds-filter-chip
              [active]="activeFilter === f.value"
              [count]="f.count ?? null"
              (toggled)="selectFilter(f.value)">
              {{ f.label }}
            </ds-filter-chip>
          }
        </div>
      }

      @if (showAdvanced) {
        <ds-button variant="ghost" size="sm" (dsClick)="advancedClick.emit()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Filtres
        </ds-button>
      }

      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./filter-bar.component.scss'],
})
export class FilterBarComponent {
  @Input() label = '';
  @Input() filters: DsFilterOption[] = [];
  @Input() activeFilter = '';
  @Input() showSearch = true;
  @Input() showAdvanced = false;
  @Input() searchPlaceholder = 'Rechercher…';
  @Input() searchValue = '';
  @Output() filterChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() advancedClick = new EventEmitter<void>();

  selectFilter(value: string): void {
    this.activeFilter = this.activeFilter === value ? '' : value;
    this.filterChange.emit(this.activeFilter);
  }
}
