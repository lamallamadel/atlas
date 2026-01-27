import { Directive, Input, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ContextualHint {
  default: string;
  pristine?: string;
  touched?: string;
  dirty?: string;
  valid?: string;
  invalid?: string;
  focused?: string;
  hasValue?: string;
}

@Directive({
  selector: '[appContextualHint]',
  providers: [MatTooltip]
})
export class ContextualHintDirective implements OnInit, OnDestroy {
  @Input() appContextualHint!: ContextualHint | string;
  @Input() hintControl?: AbstractControl;
  @Input() hintPosition: 'above' | 'below' | 'left' | 'right' = 'above';
  
  private destroy$ = new Subject<void>();
  private isFocused = false;

  constructor(
    private tooltip: MatTooltip,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.tooltip.position = this.hintPosition;
    this.updateTooltip();

    if (this.hintControl) {
      this.hintControl.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateTooltip());

      this.hintControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateTooltip());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('focus')
  onFocus(): void {
    this.isFocused = true;
    this.updateTooltip();
    this.tooltip.show();
  }

  @HostListener('blur')
  onBlur(): void {
    this.isFocused = false;
    this.updateTooltip();
    this.tooltip.hide();
  }

  private updateTooltip(): void {
    const message = this.getContextualMessage();
    this.tooltip.message = message;
  }

  private getContextualMessage(): string {
    if (typeof this.appContextualHint === 'string') {
      return this.appContextualHint;
    }

    const hints = this.appContextualHint;
    
    if (!this.hintControl) {
      return hints.default;
    }

    // Priority order for contextual hints
    if (this.isFocused && hints.focused) {
      return hints.focused;
    }

    if (this.hintControl.invalid && this.hintControl.touched && hints.invalid) {
      return hints.invalid;
    }

    if (this.hintControl.valid && this.hintControl.dirty && hints.valid) {
      return hints.valid;
    }

    if (this.hintControl.value && hints.hasValue) {
      return hints.hasValue;
    }

    if (this.hintControl.dirty && hints.dirty) {
      return hints.dirty;
    }

    if (this.hintControl.touched && hints.touched) {
      return hints.touched;
    }

    if (this.hintControl.pristine && hints.pristine) {
      return hints.pristine;
    }

    return hints.default;
  }
}
