import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-entity-detail-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ds-detail" [class.ds-detail--full]="!rightSlot">
      <div class="ds-detail__breadcrumb">
        <ng-content select="[slot=breadcrumb]"></ng-content>
      </div>
      <div class="ds-detail__topbar">
        <ng-content select="[slot=topbar]"></ng-content>
      </div>
      <div class="ds-detail__body">
        <aside class="ds-detail__left">
          <ng-content select="[slot=left]"></ng-content>
        </aside>
        <main class="ds-detail__center" id="main-content">
          <ng-content select="[slot=center]"></ng-content>
        </main>
        @if (rightSlot) {
          <aside class="ds-detail__right">
            <ng-content select="[slot=right]"></ng-content>
          </aside>
        }
      </div>
    </div>
  `,
  styleUrls: ['./entity-detail-layout.component.scss'],
})
export class EntityDetailLayoutComponent {
  @Input() rightSlot = true;
}
