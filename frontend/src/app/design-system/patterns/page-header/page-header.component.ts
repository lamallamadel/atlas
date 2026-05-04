import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="ds-page-header" [class.ds-page-header--compact]="compact">
      <div class="ds-page-header__main">
        @if (eyebrow) {
          <div class="ds-page-header__eyebrow">{{ eyebrow }}</div>
        }
        <h1 class="ds-page-header__title">
          {{ titleBefore }}
          @if (titleAccent) {
            <em class="ds-page-header__accent">{{ titleAccent }}</em>
          }
          {{ titleAfter }}
        </h1>
        @if (description) {
          <p class="ds-page-header__desc">{{ description }}</p>
        }
      </div>
      <div class="ds-page-header__actions">
        <ng-content select="[slot=actions]"></ng-content>
      </div>
    </header>
  `,
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  @Input() eyebrow: string | null = null;
  @Input() titleBefore = '';
  @Input() titleAccent: string | null = null;
  @Input() titleAfter: string | null = null;
  @Input() description: string | null = null;
  @Input() compact = false;
}
