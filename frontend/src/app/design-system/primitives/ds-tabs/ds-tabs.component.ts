import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DsTab {
  value: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export type DsTabsVariant = 'underline' | 'pills' | 'segment';

@Component({
  selector: 'ds-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ds-tabs" [class]="'ds-tabs--' + variant" role="tablist" [attr.aria-label]="label">
      @for (tab of tabs; track tab.value) {
        <button
          class="ds-tabs__tab"
          role="tab"
          [class.ds-tabs__tab--active]="tab.value === activeTab"
          [class.ds-tabs__tab--disabled]="tab.disabled"
          [attr.aria-selected]="tab.value === activeTab"
          [attr.aria-disabled]="tab.disabled || null"
          [disabled]="tab.disabled"
          (click)="select(tab)">
          {{ tab.label }}
          @if (tab.badge !== undefined) {
            <span class="ds-tabs__badge">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrls: ['./ds-tabs.component.scss'],
})
export class DsTabsComponent {
  @Input() tabs: DsTab[] = [];
  @Input() activeTab = '';
  @Input() variant: DsTabsVariant = 'underline';
  @Input() label = 'Navigation par onglets';
  @Output() tabChange = new EventEmitter<string>();

  select(tab: DsTab): void {
    if (tab.disabled) return;
    this.activeTab = tab.value;
    this.tabChange.emit(tab.value);
  }
}
