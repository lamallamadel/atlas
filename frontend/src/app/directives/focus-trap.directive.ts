import { Directive, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FocusManagementService } from '../services/focus-management.service';

@Directive({
  selector: '[appFocusTrap]'
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private releaseFocusTrap: (() => void) | null = null;

  constructor(
    private elementRef: ElementRef,
    private focusManagementService: FocusManagementService
  ) {}

  ngAfterViewInit(): void {
    this.focusManagementService.saveFocus();
    
    setTimeout(() => {
      this.releaseFocusTrap = this.focusManagementService.trapFocus(
        this.elementRef.nativeElement
      );
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.releaseFocusTrap) {
      this.releaseFocusTrap();
    }
    this.focusManagementService.restoreFocus();
  }
}
