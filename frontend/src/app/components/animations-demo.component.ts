import { Component } from '@angular/core';
import {
  fadeIn,
  slideUp,
  scaleIn,
  staggerList,
  bounceIn,
  shakeX,
  buttonHover,
  focusPulse,
  cardStagger,
  dialogSlideUp,
  successState,
  errorState
} from '../animations';

interface DemoCard {
  id: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-animations-demo',
  template: `
    <div class="animations-demo">
      <h1 @fadeIn>Angular Micro-Animations Demo</h1>
      
      <section class="demo-section">
        <h2>Button Animations</h2>
        <div class="button-group">
          <button mat-raised-button color="primary" appAnimatedButton>
            <mat-icon>save</mat-icon>
            Hover Me (Scale 1.02 + Shadow)
          </button>
          
          <app-loading-button 
            [loading]="isLoading"
            buttonClass="mat-raised-button mat-primary"
            (clicked)="handleLoadingButton()">
            <mat-icon>send</mat-icon>
            {{ isLoading ? 'Loading...' : 'Click to Load' }}
          </app-loading-button>
          
          <button mat-raised-button color="accent" appAnimatedButton (click)="showSuccess()">
            <mat-icon>check_circle</mat-icon>
            Success Feedback
          </button>
          
          <button mat-raised-button color="warn" appAnimatedButton (click)="showError()">
            <mat-icon>error</mat-icon>
            Error Feedback
          </button>
        </div>
        
        <div class="feedback-area">
          <div *ngIf="successVisible" @bounceIn class="success-message">
            <mat-icon>check_circle</mat-icon>
            Success! Action completed.
          </div>
          
          <div *ngIf="errorVisible" [@shakeX]="errorState" class="error-message">
            <mat-icon>error</mat-icon>
            Error! Please try again.
          </div>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Focus States</h2>
        <div class="focus-demo">
          <mat-form-field appearance="outline">
            <mat-label>Input with Pulse Focus</mat-label>
            <input matInput appAnimatedFocus placeholder="Click to focus">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Textarea with Pulse Focus</mat-label>
            <textarea matInput appAnimatedFocus placeholder="Click to focus" rows="3"></textarea>
          </mat-form-field>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Card Animations with Stagger (50ms delay)</h2>
        <div class="controls">
          <button mat-raised-button color="primary" appAnimatedButton (click)="addCard()">
            <mat-icon>add</mat-icon>
            Add Card
          </button>
          <button mat-raised-button color="accent" appAnimatedButton (click)="removeCard()">
            <mat-icon>remove</mat-icon>
            Remove Card
          </button>
          <button mat-raised-button appAnimatedButton (click)="resetCards()">
            <mat-icon>refresh</mat-icon>
            Reset
          </button>
        </div>
        
        <div class="cards-container" [@cardStagger]="cards.length">
          <mat-card *ngFor="let card of cards" class="demo-card" @scaleIn>
            <mat-card-header>
              <mat-card-title>{{ card.title }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>{{ card.description }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button appAnimatedButton>ACTION</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Dialog Animations (SlideUp 300ms ease-out)</h2>
        <button mat-raised-button color="primary" appAnimatedButton (click)="openDemoDialog()">
          <mat-icon>open_in_new</mat-icon>
          Open Dialog with SlideUp
        </button>
      </section>
      
      <section class="demo-section">
        <h2>List Animations</h2>
        <div class="controls">
          <button mat-raised-button color="primary" appAnimatedButton (click)="addListItem()">
            <mat-icon>add</mat-icon>
            Add Item
          </button>
          <button mat-raised-button color="accent" appAnimatedButton (click)="removeListItem()">
            <mat-icon>remove</mat-icon>
            Remove Item
          </button>
        </div>
        
        <mat-list [@staggerList]="listItems.length">
          <mat-list-item *ngFor="let item of listItems" @fadeIn>
            <mat-icon matListItemIcon>star</mat-icon>
            <div matListItemTitle>{{ item }}</div>
          </mat-list-item>
        </mat-list>
      </section>
      
      <section class="demo-section">
        <h2>Custom Spinner</h2>
        <div class="spinner-showcase">
          <div class="spinner-item">
            <app-custom-spinner [size]="24" color="#3b82f6"></app-custom-spinner>
            <span>Small (24px)</span>
          </div>
          <div class="spinner-item">
            <app-custom-spinner [size]="48" color="#10b981"></app-custom-spinner>
            <span>Medium (48px)</span>
          </div>
          <div class="spinner-item">
            <app-custom-spinner [size]="72" color="#f59e0b"></app-custom-spinner>
            <span>Large (72px)</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .animations-demo {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: #1e293b;
      margin-bottom: 32px;
    }
    
    .demo-section {
      margin-bottom: 48px;
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .demo-section h2 {
      color: #475569;
      margin-bottom: 24px;
      font-size: 20px;
    }
    
    .button-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    
    .feedback-area {
      min-height: 60px;
    }
    
    .success-message,
    .error-message {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .success-message {
      background: #dcfce7;
      color: #166534;
    }
    
    .error-message {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .focus-demo {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .focus-demo mat-form-field {
      flex: 1;
      min-width: 250px;
    }
    
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    
    .demo-card {
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .demo-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    
    mat-list {
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px;
    }
    
    .spinner-showcase {
      display: flex;
      gap: 48px;
      flex-wrap: wrap;
    }
    
    .spinner-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    
    .spinner-item span {
      color: #64748b;
      font-size: 14px;
    }
  `],
  animations: [
    fadeIn,
    slideUp,
    scaleIn,
    staggerList,
    bounceIn,
    shakeX,
    buttonHover,
    focusPulse,
    cardStagger,
    dialogSlideUp,
    successState,
    errorState
  ]
})
export class AnimationsDemoComponent {
  isLoading = false;
  successVisible = false;
  errorVisible = false;
  errorState = 'idle';
  
  cards: DemoCard[] = [
    { id: 1, title: 'Card 1', description: 'This card appears with scale animation' },
    { id: 2, title: 'Card 2', description: 'Cards are staggered with 50ms delay' },
    { id: 3, title: 'Card 3', description: 'Smooth entrance animations' }
  ];
  
  listItems: string[] = ['Item 1', 'Item 2', 'Item 3'];
  
  private cardCounter = 4;
  private itemCounter = 4;
  
  handleLoadingButton(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
  
  showSuccess(): void {
    this.successVisible = true;
    setTimeout(() => {
      this.successVisible = false;
    }, 3000);
  }
  
  showError(): void {
    this.errorVisible = true;
    this.errorState = 'error';
    setTimeout(() => {
      this.errorVisible = false;
      this.errorState = 'idle';
    }, 3000);
  }
  
  addCard(): void {
    this.cards.push({
      id: this.cardCounter,
      title: `Card ${this.cardCounter}`,
      description: `Card added with animation (ID: ${this.cardCounter})`
    });
    this.cardCounter++;
  }
  
  removeCard(): void {
    if (this.cards.length > 0) {
      this.cards.pop();
    }
  }
  
  resetCards(): void {
    this.cards = [
      { id: 1, title: 'Card 1', description: 'This card appears with scale animation' },
      { id: 2, title: 'Card 2', description: 'Cards are staggered with 50ms delay' },
      { id: 3, title: 'Card 3', description: 'Smooth entrance animations' }
    ];
    this.cardCounter = 4;
  }
  
  addListItem(): void {
    this.listItems.push(`Item ${this.itemCounter}`);
    this.itemCounter++;
  }
  
  removeListItem(): void {
    if (this.listItems.length > 0) {
      this.listItems.pop();
    }
  }
  
  openDemoDialog(): void {
    // This would open a Material Dialog with slideUp animation
    // Implementation depends on your dialog setup
    alert('Dialog animation demo - integrate with MatDialog for full effect');
  }
}
