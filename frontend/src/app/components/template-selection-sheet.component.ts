import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { WhatsAppTemplate } from './whatsapp-message-input.component';

export interface TemplateSelectionData {
  templates: WhatsAppTemplate[];
  currentTemplate: WhatsAppTemplate | null;
}

@Component({
  selector: 'app-template-selection-sheet',
  templateUrl: './template-selection-sheet.component.html',
  styleUrls: ['./template-selection-sheet.component.css']
})
export class TemplateSelectionSheetComponent {
  searchQuery = '';
  selectedTemplate: WhatsAppTemplate | null = null;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<TemplateSelectionSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: TemplateSelectionData
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
    this.bottomSheetRef.dismiss({ template: this.selectedTemplate });
  }

  clear(): void {
    this.bottomSheetRef.dismiss({ template: null });
  }

  cancel(): void {
    this.bottomSheetRef.dismiss();
  }

  getVariablesText(variables: string[]): string {
    if (variables.length === 0) {
      return 'Aucune variable';
    }
    return variables.map(v => `{{${v}}}`).join(', ');
  }
}
