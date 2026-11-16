import { Component, input, output } from '@angular/core';
import { DossierResponse } from '../services/dossier-api.service';
import { SwipeGestureDirective } from '../directives/swipe-gesture.directive';
import { BadgeStatusComponent } from './badge-status.component';
import { DateFormatPipe } from '../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../pipes/phone-format.pipe';
import { CommonModule } from '@angular/common';
import { DsIconComponent, DsButtonComponent } from '../design-system';

export interface DossierAction {
  type: 'call' | 'message' | 'view' | 'delete' | 'archive';
  dossier: DossierResponse;
}

@Component({
    selector: 'app-mobile-dossier-card',
    standalone: true,
    template: `
    <div
      class="mobile-dossier-card"
      [class.swipe-active]="swipeProgress > 0"
      [class.swipe-left]="swipeDirection === 'left'"
      [class.swipe-right]="swipeDirection === 'right'"
      [style.transform]="getTransform()"
      appSwipeGesture
      [enableSwipeUp]="false"
      [enableSwipeDown]="false"
      (swipeLeft)="onSwipeLeft($event)"
      (swipeRight)="onSwipeRight($event)"
      (swipeMove)="onSwipeMove($event)"
      (swipeCancel)="onSwipeCancel()"
      (click)="onCardClick($event)"
      (keydown.enter)="onCardClick($event)"
      (keydown.space)="$event.preventDefault(); onCardClick($event)"
      tabindex="0"
      role="button">
    
      <!-- Background action indicators -->
      <div class="swipe-action-left" [class.visible]="swipeDirection === 'left' && swipeProgress > 0.3">
        <ds-icon name="info" [size]="24"></ds-icon>
        <span>Archiver</span>
      </div>
    
      <div class="swipe-action-right" [class.visible]="swipeDirection === 'right' && swipeProgress > 0.3">
        <ds-icon name="phone" [size]="24"></ds-icon>
        <span>Appeler</span>
      </div>
    
      <!-- Card content -->
      <div class="card-content">
        <div class="card-header">
          <div class="card-title-row" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
            <h3 class="card-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ds-marine); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">{{ dossier().leadName || 'Sans nom' }}</h3>
            <app-badge-status [status]="dossier().status" entityType="dossier"></app-badge-status>
          </div>
          <p class="card-subtitle" style="margin: 0; font-size: 13px; color: var(--ds-text-muted);">{{ dossier().leadPhone | phoneFormat }}</p>
        </div>
    
        <div class="card-meta" style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          @if (dossier().leadSource || dossier().source) {
            <div class="meta-item" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ds-text-faint);">
              <ds-icon name="refresh" [size]="16"></ds-icon>
              <span class="meta-text">{{ dossier().leadSource || dossier().source }}</span>
            </div>
          }
          <div class="meta-item" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ds-text-faint);">
            <ds-icon name="clock" [size]="16"></ds-icon>
            <span class="meta-text">{{ dossier().updatedAt | dateFormat:'relative' }}</span>
          </div>
        </div>
    
        <div class="card-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
          <ds-button
            variant="ghost"
            size="sm"
            (dsClick)="onCall($event)"
            [ariaLabel]="'Appeler ' + (dossier().leadName || 'le prospect')"
            [disabled]="!dossier().leadPhone"
            style="color: var(--ds-success); background: var(--ds-success-hl);">
            <ds-icon name="phone" [size]="20"></ds-icon>
          </ds-button>
          <ds-button
            variant="ghost"
            size="sm"
            (dsClick)="onMessage($event)"
            [ariaLabel]="'Envoyer un message à ' + (dossier().leadName || 'le prospect')"
            [disabled]="!dossier().leadPhone"
            style="color: var(--ds-primary); background: var(--ds-marine-hl);">
            <ds-icon name="upload" [size]="20"></ds-icon>
          </ds-button>
          <ds-button
            variant="icon"
            size="sm"
            (dsClick)="onMore($event)"
            [ariaLabel]="'Actions supplémentaires'">
            <ds-icon name="plus" [size]="20" style="transform: rotate(45deg);"></ds-icon>
          </ds-button>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .mobile-dossier-card {
      position: relative;
      background: var(--ds-surface);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-sm);
      margin-bottom: 12px;
      overflow: visible;
      transition: all 0.2s ease;
      cursor: pointer;
      touch-action: pan-y;
    }

    .swipe-action-left,
    .swipe-action-right {
      position: absolute;
      top: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 80px;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      z-index: 0;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .swipe-action-left {
      right: 100%;
      background: var(--ds-error);
      color: white;
      border-radius: var(--ds-radius-lg) 0 0 var(--ds-radius-lg);
    }

    .swipe-action-right {
      left: 100%;
      background: var(--ds-success);
      color: white;
      border-radius: 0 var(--ds-radius-lg) var(--ds-radius-lg) 0;
    }

    .swipe-action-left.visible,
    .swipe-action-right.visible {
      opacity: 1;
    }

    .card-content {
      position: relative;
      z-index: 1;
      padding: 16px;
      background: var(--ds-surface);
      border-radius: var(--ds-radius-lg);
      border: 1px solid var(--ds-border);
    }

    .card-header {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ds-divider);
    }
  `],
    imports: [CommonModule, SwipeGestureDirective, BadgeStatusComponent, DateFormatPipe, PhoneFormatPipe, DsIconComponent, DsButtonComponent]
})
export class MobileDossierCardComponent {
  readonly dossier = input.required<DossierResponse>();
  readonly action = output<DossierAction>();

  swipeProgress = 0;
  swipeDirection: 'left' | 'right' | null = null;

  onCardClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('ds-button')) {
      this.action.emit({ type: 'view', dossier: this.dossier() });
    }
  }

  onCall(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'call', dossier: this.dossier() });
  }

  onMessage(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'message', dossier: this.dossier() });
  }

  onMore(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'view', dossier: this.dossier() });
  }

  onSwipeLeft(event: { deltaX: number; deltaY: number }): void {
    if (Math.abs(event.deltaX) > 100) {
      this.action.emit({ type: 'archive', dossier: this.dossier() });
    }
    this.resetSwipe();
  }

  onSwipeRight(event: { deltaX: number; deltaY: number }): void {
    if (Math.abs(event.deltaX) > 100) {
      this.action.emit({ type: 'call', dossier: this.dossier() });
    }
    this.resetSwipe();
  }

  onSwipeMove(event: { progress: number; direction: string }): void {
    this.swipeProgress = event.progress;
    this.swipeDirection = event.direction as 'left' | 'right';
  }

  onSwipeCancel(): void {
    this.resetSwipe();
  }

  getTransform(): string {
    if (this.swipeProgress === 0) return 'translateX(0)';
    const maxTranslate = 100;
    const translate = Math.min(this.swipeProgress * maxTranslate, maxTranslate);
    return this.swipeDirection === 'left' ? `translateX(-${translate}px)` : `translateX(${translate}px)`;
  }

  private resetSwipe(): void {
    setTimeout(() => {
      this.swipeProgress = 0;
      this.swipeDirection = null;
    }, 200);
  }
}
