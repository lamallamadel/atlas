import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
import { WorkflowNode } from '../models/workflow.model';

@Component({
  selector: 'app-workflow-node',
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.css']
})
export class WorkflowNodeComponent {
  @Input() node!: WorkflowNode;
  @Input() selected = false;
  @Input() isTransitionMode = false;
  @Input() isTransitionStart = false;

  @Output() nodeClicked = new EventEmitter<WorkflowNode>();
  @Output() addTransitionClicked = new EventEmitter<WorkflowNode>();
  @Output() transitionTargetClicked = new EventEmitter<WorkflowNode>();
  @Output() nodeDragStarted = new EventEmitter<{ node: WorkflowNode; dragEvent: CdkDragStart }>();
  @Output() nodeDragEnded = new EventEmitter<{ node: WorkflowNode; dragEvent: CdkDragEnd }>();

  onNodeClick(): void {
    if (this.isTransitionMode && !this.isTransitionStart) {
      this.transitionTargetClicked.emit(this.node);
    } else if (!this.isTransitionMode) {
      this.nodeClicked.emit(this.node);
    }
  }

  onAddTransition(event: Event): void {
    event.stopPropagation();
    this.addTransitionClicked.emit(this.node);
  }

  onDragStarted(event: CdkDragStart): void {
    this.nodeDragStarted.emit({ node: this.node, dragEvent: event });
  }

  onDragEnded(event: CdkDragEnd): void {
    this.nodeDragEnded.emit({ node: this.node, dragEvent: event });
  }
}
