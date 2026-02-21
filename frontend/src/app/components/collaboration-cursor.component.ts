import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CollaborationService, CollaborationCursor } from '../services/collaboration.service';
import { Subscription } from 'rxjs';

interface CursorInfo {
  userId: string;
  username: string;
  fieldName: string;
  cursorPosition: number;
  color: string;
  timestamp: Date;
}

@Component({
  selector: 'app-collaboration-cursor',
  template: `
    <div class="cursor-indicators">
      <div *ngFor="let cursor of activeCursors" 
           class="cursor-indicator"
           [style.border-color]="cursor.color">
        <span class="cursor-label" [style.background-color]="cursor.color">
          {{ cursor.username }} is typing...
        </span>
      </div>
    </div>
  `,
  styles: [`
    .cursor-indicators {
      position: relative;
      margin-top: 4px;
    }

    .cursor-indicator {
      display: inline-block;
      padding: 4px 8px;
      border-left: 3px solid;
      margin-right: 8px;
      margin-bottom: 4px;
      animation: fadeIn 0.3s;
    }

    .cursor-label {
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      white-space: nowrap;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }
  `]
})
export class CollaborationCursorComponent implements OnInit, OnDestroy {
  @Input() fieldName!: string;

  activeCursors: CursorInfo[] = [];
  private subscriptions: Subscription[] = [];
  private cursorTimeout: Map<string, any> = new Map();

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.collaborationService.getCursorUpdates().subscribe(cursor => {
        if (cursor.fieldName === this.fieldName) {
          this.updateCursor(cursor);
        }
      })
    );
  }

  private updateCursor(cursor: CollaborationCursor): void {
    const existingIndex = this.activeCursors.findIndex(c => c.userId === cursor.userId);
    
    if (existingIndex >= 0) {
      this.activeCursors[existingIndex] = {
        ...cursor,
        timestamp: new Date()
      };
    } else {
      this.activeCursors.push({
        ...cursor,
        timestamp: new Date()
      });
    }

    if (this.cursorTimeout.has(cursor.userId)) {
      clearTimeout(this.cursorTimeout.get(cursor.userId));
    }

    const timeout = setTimeout(() => {
      this.removeCursor(cursor.userId);
    }, 3000);

    this.cursorTimeout.set(cursor.userId, timeout);
  }

  private removeCursor(userId: string): void {
    this.activeCursors = this.activeCursors.filter(c => c.userId !== userId);
    this.cursorTimeout.delete(userId);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cursorTimeout.forEach(timeout => clearTimeout(timeout));
  }
}
