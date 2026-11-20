import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
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
    <div #list class="ds-tabs" [class]="'ds-tabs--' + variant" role="tablist" [attr.aria-label]="label"
         [class.ds-tabs--more-left]="moreLeft" [class.ds-tabs--more-right]="moreRight"
         (scroll)="updateOverflow()">
      @for (tab of tabs; track tab.value) {
        <button
          class="ds-tabs__tab"
          role="tab"
          [class.ds-tabs__tab--active]="tab.value === activeTab"
          [class.ds-tabs__tab--disabled]="tab.disabled"
          [attr.aria-selected]="tab.value === activeTab"
          [attr.data-tab]="tab.value"
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
export class DsTabsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() tabs: DsTab[] = [];
  @Input() activeTab = '';
  @Input() variant: DsTabsVariant = 'underline';
  @Input() label = 'Navigation par onglets';
  @Output() tabChange = new EventEmitter<string>();

  @ViewChild('list') private list?: ElementRef<HTMLElement>;

  /** D'autres onglets sont cachés à gauche / à droite (fondu sur le bord concerné). */
  moreLeft = false;
  moreRight = false;
  private resizeObserver?: ResizeObserver;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  select(tab: DsTab): void {
    if (tab.disabled) return;
    this.activeTab = tab.value;
    this.tabChange.emit(tab.value);
    this.revealActive();
  }

  ngAfterViewInit(): void {
    this.revealActive();
    const list = this.list?.nativeElement;
    if (list && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateOverflow());
      this.resizeObserver.observe(list);
    }
    this.updateOverflow();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  updateOverflow(): void {
    const list = this.list?.nativeElement;
    if (!list) return;
    const left = list.scrollLeft > 2;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 2;
    if (left !== this.moreLeft || right !== this.moreRight) {
      this.moreLeft = left;
      this.moreRight = right;
      this.cdr.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeTab'] && !changes['activeTab'].firstChange) this.revealActive();
  }

  /** Onglets qui défilent : l'onglet actif est ramené dans la zone visible. */
  private revealActive(): void {
    const list = this.list?.nativeElement;
    if (!list) return;
    const el = Array.from(list.querySelectorAll<HTMLElement>('[data-tab]')).find(
      (t) => t.dataset['tab'] === this.activeTab,
    );
    if (!el || typeof el.offsetLeft !== 'number') return;
    const left = el.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + el.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = Math.max(0, left - 24);
    }
  }
}
