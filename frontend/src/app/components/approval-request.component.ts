import { Component, OnInit } from '@angular/core';
import { DocumentWorkflowService } from '../services/document-workflow.service';
import { WorkflowApproval, WorkflowStepStatus, ApprovalDecisionRequest } from '../models/document-workflow.model';

@Component({
  selector: 'app-approval-request',
  templateUrl: './approval-request.component.html',
  styleUrls: ['./approval-request.component.css']
})
export class ApprovalRequestComponent implements OnInit {
  pendingApprovals: WorkflowApproval[] = [];
  selectedApprovalIds: Set<number> = new Set();
  showDecisionModal = false;
  currentApproval: WorkflowApproval | null = null;
  decision: WorkflowStepStatus = WorkflowStepStatus.APPROVED;
  comments = '';
  reason = '';
  loading = false;
  WorkflowStepStatus = WorkflowStepStatus;

  constructor(private workflowService: DocumentWorkflowService) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.workflowService.getPendingApprovals().subscribe({
      next: (approvals) => {
        this.pendingApprovals = approvals;
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
      }
    });
  }

  toggleSelection(approvalId: number): void {
    if (this.selectedApprovalIds.has(approvalId)) {
      this.selectedApprovalIds.delete(approvalId);
    } else {
      this.selectedApprovalIds.add(approvalId);
    }
  }

  isSelected(approvalId: number): boolean {
    return this.selectedApprovalIds.has(approvalId);
  }

  selectAll(): void {
    this.pendingApprovals.forEach(approval => {
      this.selectedApprovalIds.add(approval.id);
    });
  }

  deselectAll(): void {
    this.selectedApprovalIds.clear();
  }

  openDecisionModal(approval: WorkflowApproval): void {
    this.currentApproval = approval;
    this.showDecisionModal = true;
    this.decision = WorkflowStepStatus.APPROVED;
    this.comments = '';
    this.reason = '';
  }

  closeDecisionModal(): void {
    this.showDecisionModal = false;
    this.currentApproval = null;
  }

  submitDecision(): void {
    if (!this.currentApproval) return;

    this.loading = true;
    const request: ApprovalDecisionRequest = {
      decision: this.decision,
      comments: this.comments || undefined,
      reason: this.reason || undefined
    };

    this.workflowService.submitApproval(this.currentApproval.id, request).subscribe({
      next: () => {
        this.closeDecisionModal();
        this.loadPendingApprovals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error submitting decision:', error);
        this.loading = false;
      }
    });
  }

  bulkApprove(): void {
    if (this.selectedApprovalIds.size === 0) {
      alert('Please select at least one approval');
      return;
    }

    const confirmMsg = `Are you sure you want to approve ${this.selectedApprovalIds.size} document(s)?`;
    if (!confirm(confirmMsg)) return;

    this.loading = true;
    const request = {
      approvalIds: Array.from(this.selectedApprovalIds),
      decision: WorkflowStepStatus.APPROVED,
      comments: 'Bulk approved'
    };

    this.workflowService.bulkApprove(request).subscribe({
      next: () => {
        this.deselectAll();
        this.loadPendingApprovals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error bulk approving:', error);
        this.loading = false;
      }
    });
  }

  bulkReject(): void {
    if (this.selectedApprovalIds.size === 0) {
      alert('Please select at least one approval');
      return;
    }

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    this.loading = true;
    const request = {
      approvalIds: Array.from(this.selectedApprovalIds),
      decision: WorkflowStepStatus.REJECTED,
      reason: reason,
      comments: 'Bulk rejected'
    };

    this.workflowService.bulkApprove(request).subscribe({
      next: () => {
        this.deselectAll();
        this.loadPendingApprovals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error bulk rejecting:', error);
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      case 'PENDING': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }
}
