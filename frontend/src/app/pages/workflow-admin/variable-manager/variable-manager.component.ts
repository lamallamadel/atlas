import { Component, input, output } from '@angular/core';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TemplateVariable, ComponentType } from '../models/template.model';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

@Component({
    selector: 'app-variable-manager',
    templateUrl: './variable-manager.component.html',
    styleUrls: ['./variable-manager.component.css'],
    imports: [MatIconButton, MatTooltip, MatIcon, CdkDropList, CdkDrag, CdkDragHandle, MatChip, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle]
})
export class VariableManagerComponent {
  readonly variables = input<TemplateVariable[]>([]);
  readonly variablesChange = output<TemplateVariable[]>();
  readonly addVariable = output<void>();
  readonly removeVariable = output<number>();

  ComponentType = ComponentType;

  drop(event: CdkDragDrop<TemplateVariable[]>): void {
    const variables = this.variables();
    moveItemInArray(variables, event.previousIndex, event.currentIndex);
    this.updatePositions();
    this.variablesChange.emit(variables);
  }

  onAddVariable(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.addVariable.emit();
  }

  onRemoveVariable(index: number): void {
    this.removeVariable.emit(index);
  }

  onVariableChange(): void {
    this.variablesChange.emit(this.variables());
  }

  private updatePositions(): void {
    this.variables().forEach((variable, index) => {
      variable.position = index + 1;
    });
  }

  getComponentTypeIcon(type: ComponentType): string {
    switch (type) {
      case ComponentType.HEADER:
        return 'title';
      case ComponentType.BODY:
        return 'subject';
      case ComponentType.FOOTER:
        return 'notes';
      case ComponentType.BUTTONS:
        return 'smart_button';
      default:
        return 'code';
    }
  }
}
