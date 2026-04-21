import { Component, input, output } from '@angular/core';
import { CdkDragStart, CdkDragEnd, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { WorkflowNode } from '../models/workflow.model';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-workflow-node',
    templateUrl: './workflow-node.component.html',
    styleUrls: ['./workflow-node.component.css'],
    imports: [CdkDrag, MatIcon, MatIconButton, MatTooltip, CdkDragHandle]
})
export class WorkflowNodeComponent {
  readonly node = input.required<WorkflowNode>();
  readonly selected = input(false);
  readonly isTransitionMode = input(false);
  readonly isTransitionStart = input(false);

  readonly nodeClicked = output<WorkflowNode>();
  readonly addTransitionClicked = output<WorkflowNode>();
  readonly transitionTargetClicked = output<WorkflowNode>();
  readonly nodeDragStarted = output<{
    node: WorkflowNode;
    dragEvent: CdkDragStart;
}>();
  readonly nodeDragEnded = output<{
    node: WorkflowNode;
    dragEvent: CdkDragEnd;
}>();

  onNodeClick(): void {
    const isTransitionMode = this.isTransitionMode();
    if (isTransitionMode && !this.isTransitionStart()) {
      this.transitionTargetClicked.emit(this.node());
    } else if (!isTransitionMode) {
      this.nodeClicked.emit(this.node());
    }
  }

  onAddTransition(event: Event): void {
    event.stopPropagation();
    this.addTransitionClicked.emit(this.node());
  }

  onDragStarted(event: CdkDragStart): void {
    this.nodeDragStarted.emit({ node: this.node(), dragEvent: event });
  }

  onDragEnded(event: CdkDragEnd): void {
    this.nodeDragEnded.emit({ node: this.node(), dragEvent: event });
  }
}
