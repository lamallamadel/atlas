import { Directive, OnInit, OnDestroy, ElementRef, HostListener, input } from '@angular/core';
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
    providers: [MatTooltip],
    standalone: true
})
export class ContextualHintDirective implements OnInit, OnDestroy {
  readonly appContextualHint = input.required<ContextualHint | string>();
  readonly hintControl = input<AbstractControl>();
  readonly hintPosition = input<'above' | 'below' | 'left' | 'right'>('above');
  
  private destroy$ = new Subject<void>();
  private isFocused = false;

  constructor(
    private tooltip: MatTooltip,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.tooltip.position = this.hintPosition();
    this.updateTooltip();

    const hintControl = this.hintControl();
    if (hintControl) {
      hintControl.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateTooltip());

      hintControl.valueChanges
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
    const appContextualHint = this.appContextualHint();
    if (typeof appContextualHint === 'string') {
      return appContextualHint;
    }

    const hints = appContextualHint;
    
    const hintControl = this.hintControl();
    if (!hintControl) {
      return hints.default;
    }

    // Priority order for contextual hints
    if (this.isFocused && hints.focused) {
      return hints.focused;
    }

    if (hintControl.invalid && hintControl.touched && hints.invalid) {
      return hints.invalid;
    }

    if (hintControl.valid && hintControl.dirty && hints.valid) {
      return hints.valid;
    }

    if (hintControl.value && hints.hasValue) {
      return hints.hasValue;
    }

    if (hintControl.dirty && hints.dirty) {
      return hints.dirty;
    }

    if (hintControl.touched && hints.touched) {
      return hints.touched;
    }

    if (hintControl.pristine && hints.pristine) {
      return hints.pristine;
    }

    return hints.default;
  }
}
