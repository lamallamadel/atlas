import { Component, OnInit, input } from '@angular/core';
import { WorkflowConfigService } from '../services/workflow-config.service';
import { WorkflowConfiguration, WorkflowNode, TransitionRule, WorkflowPreviewState } from '../models/workflow.model';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-workflow-preview',
    templateUrl: './workflow-preview.component.html',
    styleUrls: ['./workflow-preview.component.css'],
    imports: [MatButton, MatIcon, MatCard, MatCardHeader, MatCardTitle, MatCardContent, DatePipe]
})
export class WorkflowPreviewComponent implements OnInit {
  readonly workflow = input<WorkflowConfiguration | null>(null);
  previewState: WorkflowPreviewState | null = null;

  constructor(private workflowService: WorkflowConfigService) {}

  ngOnInit(): void {
    const workflow = this.workflow();
    if (workflow && workflow.nodes.length > 0) {
      this.initializePreview(workflow.nodes[0].status);
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
    const workflow = this.workflow();
    if (workflow && workflow.nodes.length > 0) {
      this.initializePreview(workflow.nodes[0].status);
    }
  }

  getCurrentNode(): WorkflowNode | undefined {
    return this.workflow()?.nodes.find(n => n.status === this.previewState?.currentStatus);
  }

  getNodeByStatus(status: string): WorkflowNode | undefined {
    return this.workflow()?.nodes.find(n => n.status === status);
  }

  canExecuteTransition(_transition: TransitionRule): boolean {
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
