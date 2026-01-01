import { Component } from '@angular/core';

@Component({
  selector: 'app-annonce-create',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">Create New Annonce</h2>
      </div>
      <div class="page-content">
        <p>Annonce creation form will be implemented here.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .page-header {
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .page-content {
      color: #555;
      line-height: 1.6;
    }
  `]
})
export class AnnonceCreateComponent {
}
