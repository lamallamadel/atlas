import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { WhatsAppTemplate } from './whatsapp-message-input.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent,
  DsCardComponent,
  DsBadgeComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface TemplateSelectionData {
  templates: WhatsAppTemplate[];
  currentTemplate: WhatsAppTemplate | null;
}

@Component({
    selector: 'app-template-selection-sheet',
    standalone: true,
    templateUrl: './template-selection-sheet.component.html',
    styleUrls: ['./template-selection-sheet.component.css'],
    imports: [
      CommonModule, 
      FormsModule,
      DsButtonComponent,
      DsIconComponent,
      DsInputComponent,
      DsCardComponent,
      DsBadgeComponent
    ]
})
export class TemplateSelectionSheetComponent {
  searchQuery = '';
  selectedTemplate: WhatsAppTemplate | null = null;

  constructor(
    private dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: TemplateSelectionData
  ) {
    this.selectedTemplate = data.currentTemplate;
  }

  get filteredTemplates(): WhatsAppTemplate[] {
    if (!this.searchQuery) {
      return this.data.templates;
    }

    const query = this.searchQuery.toLowerCase();
    return this.data.templates.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.content.toLowerCase().includes(query)
    );
  }

  selectTemplate(template: WhatsAppTemplate): void {
    this.selectedTemplate = template;
  }

  apply(): void {
    this.dialogRef.close({ template: this.selectedTemplate });
  }

  clear(): void {
    this.dialogRef.close({ template: null });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getVariablesText(variables: string[]): string {
    if (variables.length === 0) {
      return 'Aucune variable';
    }
    return variables.map(v => `{{${v}}}`).join(', ');
  }
}
