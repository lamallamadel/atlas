import { Component, Input, OnInit } from '@angular/core';
import { WorkflowConfigService } from '../services/workflow-config.service';
import { WorkflowConfiguration, WorkflowNode, TransitionRule, WorkflowPreviewState } from '../models/workflow.model';

@Component({
  selector: 'app-workflow-preview',
  templateUrl: './workflow-preview.component.html',
  styleUrls: ['./workflow-preview.component.css']
})
export class WorkflowPreviewComponent implements OnInit {
  @Input() workflow: WorkflowConfiguration | null = null;
  previewState: WorkflowPreviewState | null = null;

  constructor(private workflowService: WorkflowConfigService) {}

  ngOnInit(): void {
    if (this.workflow && this.workflow.nodes.length > 0) {
      this.initializePreview(this.workflow.nodes[0].status);
    }
  }

  initializePreview(startStatus: string): void {
    this.previewState = {
      currentStatus: startStatus,
      availableTransitions: this.workflowService.getTransitionsFromStatus(startStatus),
      history: []
    };
  }

  executeTransition(transition: TransitionRule): void {
    if (!this.previewState) return;

    this.previewState.history.push({
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      timestamp: new Date(),
      user: 'Utilisateur de démonstration'
    });

    this.previewState = {
      currentStatus: transition.toStatus,
      availableTransitions: this.workflowService.getTransitionsFromStatus(transition.toStatus),
      history: [...this.previewState.history]
    };
  }

  resetPreview(): void {
    if (this.workflow && this.workflow.nodes.length > 0) {
      this.initializePreview(this.workflow.nodes[0].status);
    }
  }

  getCurrentNode(): WorkflowNode | undefined {
    return this.workflow?.nodes.find(n => n.status === this.previewState?.currentStatus);
  }

  getNodeByStatus(status: string): WorkflowNode | undefined {
    return this.workflow?.nodes.find(n => n.status === status);
  }

  canExecuteTransition(): boolean {
    return true;
  }

  getTransitionIcon(transition: TransitionRule): string {
    if (transition.requiresApproval) {
      return 'verified_user';
    }
    return 'arrow_forward';
  }

  getTransitionColor(transition: TransitionRule): string {
    const toNode = this.getNodeByStatus(transition.toStatus);
    return toNode?.color || '#666';
  }
}
