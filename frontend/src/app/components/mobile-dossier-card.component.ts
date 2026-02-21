import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DossierResponse } from '../services/dossier-api.service';

export interface DossierAction {
  type: 'call' | 'message' | 'view' | 'delete' | 'archive';
  dossier: DossierResponse;
}

@Component({
  selector: 'app-mobile-dossier-card',
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
        <mat-icon>archive</mat-icon>
        <span>Archiver</span>
      </div>
      
      <div class="swipe-action-right" [class.visible]="swipeDirection === 'right' && swipeProgress > 0.3">
        <mat-icon>phone</mat-icon>
        <span>Appeler</span>
      </div>

      <!-- Card content -->
      <div class="card-content">
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="card-title">{{ dossier.leadName || 'Sans nom' }}</h3>
            <app-badge-status [status]="dossier.status" entityType="dossier"></app-badge-status>
          </div>
          <p class="card-subtitle">{{ dossier.leadPhone | phoneFormat }}</p>
        </div>

        <div class="card-meta">
          <div class="meta-item" *ngIf="dossier.leadSource || dossier.source">
            <mat-icon class="meta-icon">source</mat-icon>
            <span class="meta-text">{{ dossier.leadSource || dossier.source }}</span>
          </div>
          <div class="meta-item">
            <mat-icon class="meta-icon">schedule</mat-icon>
            <span class="meta-text">{{ dossier.updatedAt | dateFormat:'relative' }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="action-btn action-call"
            (click)="onCall($event)"
            [attr.aria-label]="'Appeler ' + (dossier.leadName || 'le prospect')"
            [disabled]="!dossier.leadPhone">
            <mat-icon>phone</mat-icon>
          </button>
          <button
            class="action-btn action-message"
            (click)="onMessage($event)"
            [attr.aria-label]="'Envoyer un message à ' + (dossier.leadName || 'le prospect')"
            [disabled]="!dossier.leadPhone">
            <mat-icon>message</mat-icon>
          </button>
          <button
            class="action-btn action-more"
            (click)="onMore($event)"
            [attr.aria-label]="'Plus d\\'actions pour ' + (dossier.leadName || 'le dossier')">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mobile-dossier-card {
      position: relative;
      background: var(--color-neutral-0);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-3);
      overflow: visible;
      transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
      cursor: pointer;
      touch-action: pan-y;
    }

    .mobile-dossier-card:active {
      box-shadow: var(--shadow-md);
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
      gap: var(--spacing-1);
      width: 80px;
      opacity: 0;
      transition: opacity var(--duration-fast) var(--ease-out);
      pointer-events: none;
      z-index: 0;
    }

    .swipe-action-left {
      right: 100%;
      background: var(--color-error-500);
      color: var(--color-neutral-0);
      border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    }

    .swipe-action-right {
      left: 100%;
      background: var(--color-success-500);
      color: var(--color-neutral-0);
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
    }

    .swipe-action-left.visible,
    .swipe-action-right.visible {
      opacity: 1;
    }

    .swipe-action-left mat-icon,
    .swipe-action-right mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .swipe-action-left span,
    .swipe-action-right span {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }

    .card-content {
      position: relative;
      z-index: 1;
      padding: var(--spacing-4);
      background: var(--color-neutral-0);
      border-radius: var(--radius-lg);
    }

    .card-header {
      margin-bottom: var(--spacing-3);
      padding-bottom: var(--spacing-3);
      border-bottom: var(--border-width-1) solid var(--color-neutral-200);
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3);
      margin-bottom: var(--spacing-2);
    }

    .card-title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .card-subtitle {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
      font-weight: var(--font-weight-medium);
    }

    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-3);
      margin-bottom: var(--spacing-3);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
      font-size: var(--font-size-xs);
      color: var(--color-neutral-600);
    }

    .meta-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      color: var(--color-neutral-500);
    }

    .meta-text {
      line-height: 1;
    }

    .card-actions {
      display: flex;
      gap: var(--spacing-2);
      justify-content: flex-end;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      padding: 0;
      border: none;
      border-radius: var(--radius-full);
      background: var(--color-neutral-100);
      color: var(--color-neutral-700);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .action-btn:hover:not(:disabled) {
      background: var(--color-neutral-200);
      transform: scale(1.05);
    }

    .action-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .action-btn mat-icon {
      width: 24px;
      height: 24px;
      font-size: 24px;
    }

    .action-call {
      background: var(--color-success-100);
      color: var(--color-success-700);
    }

    .action-call:hover:not(:disabled) {
      background: var(--color-success-200);
    }

    .action-message {
      background: var(--color-info-100);
      color: var(--color-info-700);
    }

    .action-message:hover:not(:disabled) {
      background: var(--color-info-200);
    }

    .action-more {
      background: var(--color-neutral-200);
      color: var(--color-neutral-700);
    }

    .action-more:hover:not(:disabled) {
      background: var(--color-neutral-300);
    }
  `]
})
export class MobileDossierCardComponent {
  @Input() dossier!: DossierResponse;
  @Output() action = new EventEmitter<DossierAction>();

  swipeProgress = 0;
  swipeDirection: 'left' | 'right' | null = null;

  onCardClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-btn')) {
      this.action.emit({ type: 'view', dossier: this.dossier });
    }
  }

  onCall(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'call', dossier: this.dossier });
  }

  onMessage(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'message', dossier: this.dossier });
  }

  onMore(event: Event): void {
    event.stopPropagation();
    this.action.emit({ type: 'view', dossier: this.dossier });
  }

  onSwipeLeft(event: { deltaX: number; deltaY: number }): void {
    if (Math.abs(event.deltaX) > 100) {
      // Swipe left = Archive / "Pas intéressé" (marks as LOST)
      this.action.emit({ type: 'archive', dossier: this.dossier });
    }
    this.resetSwipe();
  }

  onSwipeRight(event: { deltaX: number; deltaY: number }): void {
    if (Math.abs(event.deltaX) > 100) {
      this.action.emit({ type: 'call', dossier: this.dossier });
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
    
    if (this.swipeDirection === 'left') {
      return `translateX(-${translate}px)`;
    } else if (this.swipeDirection === 'right') {
      return `translateX(${translate}px)`;
    }
    
    return 'translateX(0)';
  }

  private resetSwipe(): void {
    setTimeout(() => {
      this.swipeProgress = 0;
      this.swipeDirection = null;
    }, 200);
  }
}
