import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as d3 from 'd3';
import { WorkflowApiService, WorkflowDefinition, WorkflowState, WorkflowTransition } from '../services/workflow-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'initial' | 'intermediate' | 'final';
  color: string;
  state: WorkflowState;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  label: string;
  transition: WorkflowTransition;
}

@Component({
  selector: 'app-workflow-builder',
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.css']
})
export class WorkflowBuilderComponent implements OnInit, AfterViewInit {
  @ViewChild('svgCanvas', { static: false }) svgCanvas!: ElementRef<SVGElement>;

  workflowForm: FormGroup;
  stateForm: FormGroup;
  transitionForm: FormGroup;

  workflow: WorkflowDefinition | null = null;
  states: WorkflowState[] = [];
  transitions: WorkflowTransition[] = [];

  selectedState: WorkflowState | null = null;
  selectedTransition: WorkflowTransition | null = null;

  isAddingState = false;
  isAddingTransition = false;
  transitionSourceState: string | null = null;

  private svg: any;
  private simulation: any;
  private nodes: D3Node[] = [];
  private links: D3Link[] = [];

  caseTypes = ['SALE', 'RENTAL', 'MANDATE', 'CONSTRUCTION'];
  stateTypes = ['initial', 'intermediate', 'final'];
  stateColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#DC2626', '#06B6D4'];

  constructor(
    private fb: FormBuilder,
    private workflowApi: WorkflowApiService,
    private snackBar: MatSnackBar
  ) {
    this.workflowForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      caseType: ['', Validators.required],
      initialState: [''],
      finalStates: ['']
    });

    this.stateForm = this.fb.group({
      stateCode: ['', Validators.required],
      stateName: ['', Validators.required],
      stateType: ['intermediate', Validators.required],
      color: ['#3B82F6', Validators.required],
      description: ['']
    });

    this.transitionForm = this.fb.group({
      fromState: ['', Validators.required],
      toState: ['', Validators.required],
      label: ['', Validators.required],
      requiredFields: [''],
      allowedRoles: ['ADMIN,AGENT,MANAGER']
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeSvg();
  }

  private initializeSvg(): void {
    const element = this.svgCanvas.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;

    this.svg = d3.select(element);
    this.svg.selectAll('*').remove();

    const defs = this.svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999');

    this.simulation = d3.forceSimulation<D3Node>(this.nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(this.links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    this.renderGraph();
  }

  private renderGraph(): void {
    if (!this.svg) return;

    this.svg.selectAll('.link').remove();
    this.svg.selectAll('.node').remove();
    this.svg.selectAll('.label').remove();

    const link = this.svg.selectAll('.link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const linkLabel = this.svg.selectAll('.link-label')
      .data(this.links)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text((d: D3Link) => d.label);

    const node = this.svg.selectAll('.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(this.drag() as any);

    node.append('circle')
      .attr('r', 30)
      .attr('fill', (d: D3Node) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .on('click', (event: any, d: D3Node) => this.onStateClick(d));

    node.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .text((d: D3Node) => d.label);

    this.simulation.nodes(this.nodes);
    (this.simulation.force('link') as any).links(this.links);

    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    this.simulation.alpha(1).restart();
  }

  private drag(): any {
    return d3.drag<SVGGElement, D3Node>()
      .on('start', (event: any, d: D3Node) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: D3Node) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: D3Node) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  addState(): void {
    if (this.stateForm.valid) {
      const formValue = this.stateForm.value;
      const newState: WorkflowState = {
        stateCode: formValue.stateCode,
        stateName: formValue.stateName,
        stateType: formValue.stateType,
        color: formValue.color,
        positionX: 0,
        positionY: 0,
        isInitial: formValue.stateType === 'initial',
        isFinal: formValue.stateType === 'final',
        description: formValue.description
      };

      this.states.push(newState);
      this.updateGraph();
      this.stateForm.reset({ stateType: 'intermediate', color: '#3B82F6' });
      this.isAddingState = false;
      this.snackBar.open('State added successfully', 'Close', { duration: 3000 });
    }
  }

  addTransition(): void {
    if (this.transitionForm.valid) {
      const formValue = this.transitionForm.value;
      const newTransition: WorkflowTransition = {
        fromState: formValue.fromState,
        toState: formValue.toState,
        label: formValue.label,
        requiredFields: formValue.requiredFields ? formValue.requiredFields.split(',').map((f: string) => f.trim()) : [],
        allowedRoles: formValue.allowedRoles ? formValue.allowedRoles.split(',').map((r: string) => r.trim()) : [],
        isActive: true
      };

      this.transitions.push(newTransition);
      this.updateGraph();
      this.transitionForm.reset({ allowedRoles: 'ADMIN,AGENT,MANAGER' });
      this.isAddingTransition = false;
      this.transitionSourceState = null;
      this.snackBar.open('Transition added successfully', 'Close', { duration: 3000 });
    }
  }

  private updateGraph(): void {
    this.nodes = this.states.map(state => ({
      id: state.stateCode,
      label: state.stateName,
      type: state.stateType,
      color: state.color,
      state: state
    }));

    this.links = this.transitions.map((transition, idx) => ({
      id: `${transition.fromState}-${transition.toState}`,
      source: transition.fromState,
      target: transition.toState,
      label: transition.label,
      transition: transition
    }));

    this.renderGraph();
  }

  onStateClick(node: D3Node): void {
    this.selectedState = node.state;
    this.selectedTransition = null;
  }

  deleteState(stateCode: string): void {
    this.states = this.states.filter(s => s.stateCode !== stateCode);
    this.transitions = this.transitions.filter(t => t.fromState !== stateCode && t.toState !== stateCode);
    this.selectedState = null;
    this.updateGraph();
    this.snackBar.open('State deleted', 'Close', { duration: 3000 });
  }

  deleteTransition(fromState: string, toState: string): void {
    this.transitions = this.transitions.filter(t => !(t.fromState === fromState && t.toState === toState));
    this.selectedTransition = null;
    this.updateGraph();
    this.snackBar.open('Transition deleted', 'Close', { duration: 3000 });
  }

  saveWorkflow(): void {
    if (this.workflowForm.valid && this.states.length > 0) {
      const formValue = this.workflowForm.value;
      const workflow: WorkflowDefinition = {
        name: formValue.name,
        description: formValue.description,
        caseType: formValue.caseType,
        isActive: false,
        isPublished: false,
        statesJson: this.states,
        transitionsJson: this.transitions,
        initialState: formValue.initialState || this.states.find(s => s.isInitial)?.stateCode || '',
        finalStates: formValue.finalStates || this.states.filter(s => s.isFinal).map(s => s.stateCode).join(',')
      };

      this.workflowApi.createWorkflow(workflow).subscribe({
        next: (response) => {
          this.workflow = response;
          this.snackBar.open('Workflow saved successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error saving workflow: ' + error.message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  publishWorkflow(): void {
    if (this.workflow?.id) {
      this.workflowApi.publishWorkflow(this.workflow.id).subscribe({
        next: (response) => {
          this.workflow = response;
          this.snackBar.open('Workflow published successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error publishing workflow: ' + error.message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  activateWorkflow(): void {
    if (this.workflow?.id) {
      this.workflowApi.activateWorkflow(this.workflow.id).subscribe({
        next: (response) => {
          this.workflow = response;
          this.snackBar.open('Workflow activated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error activating workflow: ' + error.message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  startAddingTransition(stateCode: string): void {
    this.transitionSourceState = stateCode;
    this.transitionForm.patchValue({ fromState: stateCode });
    this.isAddingTransition = true;
  }

  loadTemplate(templateId: number): void {
    this.workflowApi.instantiateTemplate(templateId).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        this.states = workflow.statesJson;
        this.transitions = workflow.transitionsJson;
        this.workflowForm.patchValue({
          name: workflow.name,
          description: workflow.description,
          caseType: workflow.caseType,
          initialState: workflow.initialState,
          finalStates: workflow.finalStates
        });
        this.updateGraph();
        this.snackBar.open('Template loaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Error loading template: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }
}
