import { Component } from '@angular/core';

/**
 * Component demonstrating various button animations and states
 * Showcases appAnimatedButton directive, loading buttons, and feedback animations
 */
@Component({
  selector: 'app-button-examples',
  template: `
    <div class="button-examples">
      <h2>Button Animation Examples</h2>
      
      <section class="example-section">
        <h3>Animated Buttons (Hover: Scale 1.02 + Shadow)</h3>
        <div class="button-group">
          <button mat-raised-button color="primary" appAnimatedButton>
            <mat-icon>save</mat-icon>
            Primary Button
          </button>
          
          <button mat-raised-button color="accent" appAnimatedButton>
            <mat-icon>favorite</mat-icon>
            Accent Button
          </button>
          
          <button mat-raised-button color="warn" appAnimatedButton>
            <mat-icon>delete</mat-icon>
            Warn Button
          </button>
          
          <button mat-raised-button appAnimatedButton>
            <mat-icon>info</mat-icon>
            Default Button
          </button>
          
          <button mat-stroked-button color="primary" appAnimatedButton>
            <mat-icon>edit</mat-icon>
            Stroked Button
          </button>
          
          <button mat-flat-button color="primary" appAnimatedButton>
            <mat-icon>send</mat-icon>
            Flat Button
          </button>
        </div>
      </section>
      
      <section class="example-section">
        <h3>Loading Buttons (Inline Spinner)</h3>
        <div class="button-group">
          <app-loading-button
            [loading]="loading1"
            buttonClass="mat-raised-button mat-primary"
            (clicked)="simulateLoad(1)">
            <mat-icon>cloud_upload</mat-icon>
            {{ loading1 ? 'Uploading...' : 'Upload File' }}
          </app-loading-button>
          
          <app-loading-button
            [loading]="loading2"
            buttonClass="mat-raised-button mat-accent"
            (clicked)="simulateLoad(2)">
            <mat-icon>send</mat-icon>
            {{ loading2 ? 'Sending...' : 'Send Message' }}
          </app-loading-button>
          
          <app-loading-button
            [loading]="loading3"
            buttonClass="mat-raised-button mat-warn"
            (clicked)="simulateLoad(3)">
            <mat-icon>delete_forever</mat-icon>
            {{ loading3 ? 'Deleting...' : 'Delete All' }}
          </app-loading-button>
          
          <app-loading-button
            [loading]="loading4"
            buttonClass="mat-flat-button mat-primary"
            [spinnerSize]="18"
            (clicked)="simulateLoad(4)">
            <mat-icon>save</mat-icon>
            {{ loading4 ? 'Saving...' : 'Save Changes' }}
          </app-loading-button>
        </div>
      </section>
      
      <section class="example-section">
        <h3>Icon Buttons with Animation</h3>
        <div class="button-group">
          <button mat-icon-button color="primary" appAnimatedButton>
            <mat-icon>favorite</mat-icon>
          </button>
          
          <button mat-icon-button color="accent" appAnimatedButton>
            <mat-icon>share</mat-icon>
          </button>
          
          <button mat-icon-button color="warn" appAnimatedButton>
            <mat-icon>delete</mat-icon>
          </button>
          
          <button mat-icon-button appAnimatedButton>
            <mat-icon>more_vert</mat-icon>
          </button>
          
          <button mat-icon-button appAnimatedButton>
            <mat-icon>edit</mat-icon>
          </button>
          
          <button mat-icon-button appAnimatedButton>
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </section>
      
      <section class="example-section">
        <h3>FAB Buttons with Animation</h3>
        <div class="button-group">
          <button mat-fab color="primary" appAnimatedButton>
            <mat-icon>add</mat-icon>
          </button>
          
          <button mat-fab color="accent" appAnimatedButton>
            <mat-icon>edit</mat-icon>
          </button>
          
          <button mat-fab color="warn" appAnimatedButton>
            <mat-icon>delete</mat-icon>
          </button>
          
          <button mat-mini-fab color="primary" appAnimatedButton>
            <mat-icon>add</mat-icon>
          </button>
          
          <button mat-mini-fab color="accent" appAnimatedButton>
            <mat-icon>favorite</mat-icon>
          </button>
        </div>
      </section>
      
      <section class="example-section">
        <h3>Button States</h3>
        <div class="button-group">
          <button mat-raised-button color="primary" appAnimatedButton>
            <mat-icon>check_circle</mat-icon>
            Active
          </button>
          
          <button mat-raised-button color="primary" appAnimatedButton disabled>
            <mat-icon>block</mat-icon>
            Disabled
          </button>
          
          <app-loading-button
            [loading]="true"
            buttonClass="mat-raised-button mat-primary">
            <mat-icon>hourglass_empty</mat-icon>
            Loading
          </app-loading-button>
        </div>
      </section>
      
      <section class="example-section">
        <h3>Combined with Focus Animation</h3>
        <p class="hint">Tab through these buttons to see focus states</p>
        <div class="button-group">
          <button mat-raised-button color="primary" appAnimatedButton>
            Button 1
          </button>
          <button mat-raised-button color="accent" appAnimatedButton>
            Button 2
          </button>
          <button mat-raised-button color="warn" appAnimatedButton>
            Button 3
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .button-examples {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      color: #1e293b;
      margin-bottom: 32px;
    }
    
    .example-section {
      margin-bottom: 48px;
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .example-section h3 {
      color: #475569;
      margin-bottom: 16px;
      font-size: 18px;
    }
    
    .button-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .hint {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 12px;
      font-style: italic;
    }
  `]
})
export class ButtonExamplesComponent {
  loading1 = false;
  loading2 = false;
  loading3 = false;
  loading4 = false;
  
  simulateLoad(buttonNumber: number): void {
    switch (buttonNumber) {
      case 1:
        this.loading1 = true;
        setTimeout(() => this.loading1 = false, 2000);
        break;
      case 2:
        this.loading2 = true;
        setTimeout(() => this.loading2 = false, 2000);
        break;
      case 3:
        this.loading3 = true;
        setTimeout(() => this.loading3 = false, 2000);
        break;
      case 4:
        this.loading4 = true;
        setTimeout(() => this.loading4 = false, 2000);
        break;
    }
  }
}
