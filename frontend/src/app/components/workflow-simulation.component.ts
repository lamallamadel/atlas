import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkflowApiService, WorkflowSimulationRequest, WorkflowSimulationResponse, WorkflowDefinition } from '../services/workflow-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-workflow-simulation',
  templateUrl: './workflow-simulation.component.html',
  styleUrls: ['./workflow-simulation.component.css']
})
export class WorkflowSimulationComponent implements OnInit {
  @Input() workflowDefinitionId!: number;
  @Input() workflow!: WorkflowDefinition;

  simulationForm: FormGroup;
  simulationResult: WorkflowSimulationResponse | null = null;
  simulationHistory: WorkflowSimulationResponse[] = [];
  isRunning = false;
  testDataJson: any = {};

  constructor(
    private fb: FormBuilder,
    private workflowApi: WorkflowApiService,
    private snackBar: MatSnackBar
  ) {
    this.simulationForm = this.fb.group({
      simulationName: ['Test Simulation', Validators.required],
      currentState: ['', Validators.required],
      testData: ['{}', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.workflow) {
      this.simulationForm.patchValue({
        currentState: this.workflow.initialState
      });
      this.initializeTestData();
    }
    this.loadSimulationHistory();
  }

  initializeTestData(): void {
    const sampleData: any = {
      leadName: 'John Doe',
      leadPhone: '+1234567890',
      leadEmail: 'john.doe@example.com',
      notes: 'Sample test data'
    };

    this.testDataJson = sampleData;
    this.simulationForm.patchValue({
      testData: JSON.stringify(sampleData, null, 2)
    });
  }

  runSimulation(): void {
    if (this.simulationForm.valid) {
      this.isRunning = true;
      
      let testData: any;
      try {
        testData = JSON.parse(this.simulationForm.value.testData);
      } catch (error) {
        this.snackBar.open('Invalid JSON in test data', 'Close', { duration: 3000 });
        this.isRunning = false;
        return;
      }

      const request: WorkflowSimulationRequest = {
        workflowDefinitionId: this.workflowDefinitionId,
        simulationName: this.simulationForm.value.simulationName,
        currentState: this.simulationForm.value.currentState,
        testDataJson: testData
      };

      this.workflowApi.runSimulation(request).subscribe({
        next: (result) => {
          this.simulationResult = result;
          this.isRunning = false;
          this.snackBar.open('Simulation completed successfully', 'Close', { duration: 3000 });
          this.loadSimulationHistory();
        },
        error: (error) => {
          this.isRunning = false;
          this.snackBar.open('Simulation failed: ' + error.message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  loadSimulationHistory(): void {
    if (this.workflowDefinitionId) {
      this.workflowApi.getSimulationHistory(this.workflowDefinitionId).subscribe({
        next: (history) => {
          this.simulationHistory = history;
        },
        error: (error) => {
          console.error('Error loading simulation history:', error);
        }
      });
    }
  }

  loadSimulation(simulation: WorkflowSimulationResponse): void {
    this.simulationResult = simulation;
    this.simulationForm.patchValue({
      simulationName: simulation.simulationName,
      currentState: simulation.currentState,
      testData: JSON.stringify(simulation.testDataJson, null, 2)
    });
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'primary';
      case 'FAILED': return 'warn';
      case 'RUNNING': return 'accent';
      default: return '';
    }
  }

  getLogEventColor(eventType: string): string {
    switch (eventType) {
      case 'START': return 'primary';
      case 'END': return 'primary';
      case 'VALIDATION_SUCCESS': return 'accent';
      case 'VALIDATION_FAILED': return 'warn';
      case 'CONDITION_FAILED': return 'warn';
      case 'ERROR': return 'warn';
      default: return '';
    }
  }
}
