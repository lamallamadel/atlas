import { Component, OnInit, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { WorkflowApiService, WorkflowSimulationRequest, WorkflowSimulationResponse, WorkflowDefinition } from '../services/workflow-api.service';
import { 
  DsCardComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsInputComponent,
  DsSkeletonComponent,
  DsBadgeComponent,
  DsToastService
} from '../design-system';

@Component({
  selector: 'app-workflow-simulation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsSelectComponent,
    DsInputComponent,
    DsSkeletonComponent,
    DsBadgeComponent,
  ],
  templateUrl: './workflow-simulation.component.html',
  styleUrls: ['./workflow-simulation.component.css']
})
export class WorkflowSimulationComponent implements OnInit {
  readonly workflowDefinitionId = input.required<number>();
  readonly workflow = input.required<WorkflowDefinition>();

  private fb = inject(FormBuilder);
  private workflowApi = inject(WorkflowApiService);
  private toastService = inject(DsToastService);

  simulationForm!: FormGroup;
  simulationResult: WorkflowSimulationResponse | null = null;
  simulationHistory: WorkflowSimulationResponse[] = [];
  isRunning = false;
  testDataJson: any = {};

  get stateOptions(): DsSelectOption[] {
    return this.workflow()?.statesJson.map(s => ({ value: s.stateCode, label: s.stateName })) || [];
  }

  ngOnInit(): void {
    this.initForm();
    if (this.workflow()) {
      this.simulationForm.patchValue({
        currentState: this.workflow().initialState
      });
      this.initializeTestData();
    }
    this.loadSimulationHistory();
  }

  private initForm(): void {
    this.simulationForm = this.fb.group({
      simulationName: ['Test Simulation', Validators.required],
      currentState: ['', Validators.required],
      testData: ['{}', Validators.required]
    });
  }

  initializeTestData(): void {
    const sampleData: any = {
      leadName: 'John Doe',
      leadPhone: '+1234567890',
      leadEmail: 'john.doe@example.com',
      notes: 'Données de test exemple'
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
      } catch {
        this.toastService.error('JSON invalide dans les données de test');
        this.isRunning = false;
        return;
      }

      const request: WorkflowSimulationRequest = {
        workflowDefinitionId: this.workflowDefinitionId(),
        simulationName: this.simulationForm.value.simulationName,
        currentState: this.simulationForm.value.currentState,
        testDataJson: testData
      };

      this.workflowApi.runSimulation(request).subscribe({
        next: (result) => {
          this.simulationResult = result;
          this.isRunning = false;
          this.toastService.success('Simulation terminée avec succès');
          this.loadSimulationHistory();
        },
        error: (error) => {
          this.isRunning = false;
          this.toastService.error('Échec de la simulation: ' + error.message);
        }
      });
    }
  }

  loadSimulationHistory(): void {
    if (this.workflowDefinitionId()) {
      this.workflowApi.getSimulationHistory(this.workflowDefinitionId()).subscribe({
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

  getBadgeStatus(status: string): any {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'RUNNING': return 'warning';
      default: return 'neutral';
    }
  }
}
