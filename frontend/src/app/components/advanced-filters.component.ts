import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AdvancedFilter {
  conditions: FilterCondition[];
  logicOperator: 'AND' | 'OR';
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  operators: FilterOperator[];
  options?: { value: string; label: string }[];
}

export interface FilterOperator {
  value: string;
  label: string;
  requiresValue: boolean;
}

@Component({
  selector: 'app-advanced-filters',
  templateUrl: './advanced-filters.component.html',
  styleUrls: ['./advanced-filters.component.css']
})
export class AdvancedFiltersComponent implements OnInit {
  @Input() fields: FilterField[] = [];
  @Input() initialFilter?: AdvancedFilter;
  @Output() filterChange = new EventEmitter<AdvancedFilter>();
  @Output() countRequest = new EventEmitter<AdvancedFilter>();
  @Output() filterApplied = new EventEmitter<AdvancedFilter>();

  filterForm!: FormGroup;
  resultCount: number | null = null;
  countLoading = false;

  operators: { [key: string]: FilterOperator[] } = {
    text: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true },
      { value: 'NOT_EQUALS', label: 'Différent de', requiresValue: true },
      { value: 'CONTAINS', label: 'Contient', requiresValue: true },
      { value: 'NOT_CONTAINS', label: 'Ne contient pas', requiresValue: true },
      { value: 'STARTS_WITH', label: 'Commence par', requiresValue: true },
      { value: 'ENDS_WITH', label: 'Finit par', requiresValue: true },
      { value: 'IS_NULL', label: 'Est vide', requiresValue: false },
      { value: 'IS_NOT_NULL', label: 'N\'est pas vide', requiresValue: false }
    ],
    number: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true },
      { value: 'NOT_EQUALS', label: 'Différent de', requiresValue: true },
      { value: 'GREATER_THAN', label: 'Supérieur à', requiresValue: true },
      { value: 'GREATER_THAN_OR_EQUAL', label: 'Supérieur ou égal à', requiresValue: true },
      { value: 'LESS_THAN', label: 'Inférieur à', requiresValue: true },
      { value: 'LESS_THAN_OR_EQUAL', label: 'Inférieur ou égal à', requiresValue: true },
      { value: 'BETWEEN', label: 'Entre', requiresValue: true },
      { value: 'IS_NULL', label: 'Est vide', requiresValue: false },
      { value: 'IS_NOT_NULL', label: 'N\'est pas vide', requiresValue: false }
    ],
    date: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true },
      { value: 'GREATER_THAN', label: 'Après', requiresValue: true },
      { value: 'LESS_THAN', label: 'Avant', requiresValue: true },
      { value: 'BETWEEN', label: 'Entre', requiresValue: true },
      { value: 'EQUALS_TODAY', label: 'Aujourd\'hui', requiresValue: false },
      { value: 'THIS_WEEK', label: 'Cette semaine', requiresValue: false },
      { value: 'LESS_THAN_DAYS_AGO', label: 'Moins de X jours', requiresValue: true },
      { value: 'IS_NULL', label: 'Est vide', requiresValue: false },
      { value: 'IS_NOT_NULL', label: 'N\'est pas vide', requiresValue: false }
    ],
    select: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true },
      { value: 'NOT_EQUALS', label: 'Différent de', requiresValue: true },
      { value: 'IN', label: 'Parmi', requiresValue: true },
      { value: 'NOT_IN', label: 'Pas parmi', requiresValue: true },
      { value: 'IS_NULL', label: 'Est vide', requiresValue: false },
      { value: 'IS_NOT_NULL', label: 'N\'est pas vide', requiresValue: false }
    ],
    boolean: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupAutoCount();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      logicOperator: ['AND'],
      conditions: this.fb.array([])
    });

    if (this.initialFilter && this.initialFilter.conditions.length > 0) {
      this.initialFilter.conditions.forEach(condition => {
        this.addCondition(condition);
      });
      this.filterForm.patchValue({
        logicOperator: this.initialFilter.logicOperator || 'AND'
      });
    } else {
      this.addCondition();
    }
  }

  private setupAutoCount(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.requestCount();
      });
  }

  get conditions(): FormArray {
    return this.filterForm.get('conditions') as FormArray;
  }

  addCondition(condition?: FilterCondition): void {
    const field = condition?.field || (this.fields.length > 0 ? this.fields[0].key : '');
    const fieldConfig = this.fields.find(f => f.key === field);
    const operator = condition?.operator || (fieldConfig?.operators[0]?.value || 'EQUALS');
    
    const conditionGroup = this.fb.group({
      field: [field, Validators.required],
      operator: [operator, Validators.required],
      value: [condition?.value || '']
    });

    this.conditions.push(conditionGroup);
  }

  removeCondition(index: number): void {
    this.conditions.removeAt(index);
    if (this.conditions.length === 0) {
      this.addCondition();
    }
  }

  onFieldChange(index: number): void {
    const condition = this.conditions.at(index) as FormGroup;
    const field = condition.get('field')?.value;
    const fieldConfig = this.fields.find(f => f.key === field);
    
    if (fieldConfig && fieldConfig.operators.length > 0) {
      condition.patchValue({
        operator: fieldConfig.operators[0].value,
        value: ''
      });
    }
  }

  onOperatorChange(index: number): void {
    const condition = this.conditions.at(index) as FormGroup;
    const operator = condition.get('operator')?.value;
    const operatorConfig = this.getOperatorConfig(index, operator);
    
    if (operatorConfig && !operatorConfig.requiresValue) {
      condition.patchValue({ value: '' });
    }
  }

  getFieldConfig(fieldKey: string): FilterField | undefined {
    return this.fields.find(f => f.key === fieldKey);
  }

  getOperators(index: number): FilterOperator[] {
    const condition = this.conditions.at(index) as FormGroup;
    const field = condition.get('field')?.value;
    const fieldConfig = this.getFieldConfig(field);
    return fieldConfig?.operators || [];
  }

  getOperatorConfig(index: number, operatorValue: string): FilterOperator | undefined {
    const operators = this.getOperators(index);
    return operators.find(op => op.value === operatorValue);
  }

  requiresValue(index: number): boolean {
    const condition = this.conditions.at(index) as FormGroup;
    const operator = condition.get('operator')?.value;
    const operatorConfig = this.getOperatorConfig(index, operator);
    return operatorConfig?.requiresValue !== false;
  }

  getFieldType(index: number): string {
    const condition = this.conditions.at(index) as FormGroup;
    const field = condition.get('field')?.value;
    const fieldConfig = this.getFieldConfig(field);
    return fieldConfig?.type || 'text';
  }

  getFieldOptions(index: number): { value: string; label: string }[] {
    const condition = this.conditions.at(index) as FormGroup;
    const field = condition.get('field')?.value;
    const fieldConfig = this.getFieldConfig(field);
    return fieldConfig?.options || [];
  }

  isMultiSelect(index: number): boolean {
    const condition = this.conditions.at(index) as FormGroup;
    const operator = condition.get('operator')?.value;
    return operator === 'IN' || operator === 'NOT_IN';
  }

  applyFilter(): void {
    if (this.filterForm.valid) {
      const filter = this.getFilterValue();
      this.filterApplied.emit(filter);
    }
  }

  clearFilter(): void {
    this.conditions.clear();
    this.addCondition();
    this.filterForm.patchValue({ logicOperator: 'AND' });
    this.resultCount = null;
  }

  requestCount(): void {
    if (this.filterForm.valid && this.conditions.length > 0) {
      const filter = this.getFilterValue();
      const firstCondition = this.conditions.at(0) as FormGroup;
      if (firstCondition.get('field')?.value) {
        this.countRequest.emit(filter);
      }
    }
  }

  updateCount(count: number): void {
    this.resultCount = count;
    this.countLoading = false;
  }

  setCountLoading(loading: boolean): void {
    this.countLoading = loading;
  }

  private getFilterValue(): AdvancedFilter {
    const formValue = this.filterForm.value;
    return {
      conditions: formValue.conditions.filter((c: FilterCondition) => c.field),
      logicOperator: formValue.logicOperator
    };
  }

  exportToUrl(): string {
    const filter = this.getFilterValue();
    const encoded = btoa(JSON.stringify(filter));
    return `${window.location.origin}${window.location.pathname}?filter=${encoded}`;
  }

  copyUrlToClipboard(): void {
    const url = this.exportToUrl();
    navigator.clipboard.writeText(url).then(() => {
      console.log('URL copied to clipboard');
    });
  }
}
