import { Component, input, output } from '@angular/core';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TemplateVariable, ComponentType } from '../models/template.model';
import { DsBadgeComponent, DsButtonComponent, DsIconComponent } from '../../../design-system';

@Component({
    selector: 'app-variable-manager',
    templateUrl: './variable-manager.component.html',
    styleUrls: ['./variable-manager.component.css'],
    imports: [CdkDropList, CdkDrag, CdkDragHandle, DsButtonComponent, DsIconComponent, DsBadgeComponent]
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
        return 'info';
      case ComponentType.BODY:
        return 'mail';
      case ComponentType.FOOTER:
        return 'table';
      case ComponentType.BUTTONS:
        return 'tasks';
      default:
        return 'info';
    }
  }
}
