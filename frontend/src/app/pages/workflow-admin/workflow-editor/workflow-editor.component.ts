import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { WorkflowConfigService } from '../services/workflow-config.service';
import { WorkflowConfiguration, WorkflowNode, TransitionRule } from '../models/workflow.model';

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.css']
})
export class WorkflowEditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas?: ElementRef<HTMLCanvasElement>;
  
  workflow: WorkflowConfiguration | null = null;
  selectedNode: WorkflowNode | null = null;
  selectedTransition: TransitionRule | null = null;
  isAddingTransition = false;
  transitionStartNode: WorkflowNode | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private workflowService: WorkflowConfigService) {}

  ngOnInit(): void {
    this.workflowService.workflow$
      .pipe(takeUntil(this.destroy$))
      .subscribe(workflow => {
        this.workflow = workflow;
        setTimeout(() => this.drawConnections(), 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNodeDragStarted(event: CdkDragStart, node: WorkflowNode): void {
    this.selectedNode = node;
  }

  onNodeDragEnded(event: CdkDragEnd, node: WorkflowNode): void {
    const element = event.source.element.nativeElement;
    const rect = element.getBoundingClientRect();
    const container = element.offsetParent as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const newX = rect.left - containerRect.left;
    const newY = rect.top - containerRect.top;
    
    this.workflowService.updateNode(node.id, { x: newX, y: newY });
    
    setTimeout(() => this.drawConnections(), 0);
  }

  selectNode(node: WorkflowNode): void {
    this.selectedNode = node;
    this.selectedTransition = null;
  }

  startAddingTransition(node: WorkflowNode): void {
    this.isAddingTransition = true;
    this.transitionStartNode = node;
  }

  completeAddingTransition(targetNode: WorkflowNode): void {
    if (!this.isAddingTransition || !this.transitionStartNode || 
        this.transitionStartNode.id === targetNode.id) {
      this.cancelAddingTransition();
      return;
    }

    const existingTransition = this.workflow?.transitions.find(
      t => t.fromStatus === this.transitionStartNode!.status && 
           t.toStatus === targetNode.status
    );

    if (existingTransition) {
      this.selectedTransition = existingTransition;
    } else {
      const newTransition: TransitionRule = {
        id: `t${Date.now()}`,
        fromStatus: this.transitionStartNode.status,
        toStatus: targetNode.status,
        label: `${this.transitionStartNode.label} → ${targetNode.label}`,
        requiredFields: [],
        allowedRoles: []
      };
      
      this.workflowService.addTransition(newTransition);
      this.selectedTransition = newTransition;
    }

    this.cancelAddingTransition();
    setTimeout(() => this.drawConnections(), 0);
  }

  cancelAddingTransition(): void {
    this.isAddingTransition = false;
    this.transitionStartNode = null;
  }

  deleteTransition(transition: TransitionRule, event: Event): void {
    event.stopPropagation();
    this.workflowService.deleteTransition(transition.id);
    if (this.selectedTransition?.id === transition.id) {
      this.selectedTransition = null;
    }
    setTimeout(() => this.drawConnections(), 0);
  }

  getTransitionsForNode(node: WorkflowNode): TransitionRule[] {
    return this.workflowService.getTransitionsFromStatus(node.status);
  }

  drawConnections(): void {
    if (!this.canvas || !this.workflow) return;

    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.workflow.transitions.forEach(transition => {
      const fromNode = this.workflow!.nodes.find(n => n.status === transition.fromStatus);
      const toNode = this.workflow!.nodes.find(n => n.status === transition.toStatus);

      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + 75;
      const fromY = fromNode.y + 50;
      const toX = toNode.x + 75;
      const toY = toNode.y + 50;

      const isSelected = this.selectedTransition?.id === transition.id;

      ctx.strokeStyle = isSelected ? '#2196F3' : '#999';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(transition.requiresApproval ? [5, 5] : []);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      const controlPointX = (fromX + toX) / 2;
      const controlPointY = (fromY + toY) / 2;
      const offset = Math.abs(fromX - toX) * 0.2;

      ctx.quadraticCurveTo(
        controlPointX,
        controlPointY - offset,
        toX,
        toY
      );

      ctx.stroke();

      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowSize = 10;
      
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });
  }
}
