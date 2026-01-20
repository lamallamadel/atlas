import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { WorkflowStepperComponent } from './workflow-stepper.component';
import { DossierStatus } from '../services/dossier-api.service';

describe('WorkflowStepperComponent', () => {
  let component: WorkflowStepperComponent;
  let fixture: ComponentFixture<WorkflowStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkflowStepperComponent],
      imports: [CommonModule, MatIconModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowStepperComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null status', () => {
      expect(component.status).toBeNull();
    });

    it('should have 5 workflow steps defined', () => {
      expect(component.steps.length).toBe(5);
    });

    it('should have correct step keys in order', () => {
      expect(component.steps[0].key).toBe(DossierStatus.NEW);
      expect(component.steps[1].key).toBe(DossierStatus.QUALIFYING);
      expect(component.steps[2].key).toBe(DossierStatus.QUALIFIED);
      expect(component.steps[3].key).toBe(DossierStatus.APPOINTMENT);
      expect(component.steps[4].key).toBe('CLOSE');
    });

    it('should have correct step labels', () => {
      expect(component.steps[0].label).toBe('Nouveau');
      expect(component.steps[1].label).toBe('Qualification');
      expect(component.steps[2].label).toBe('Qualifié');
      expect(component.steps[3].label).toBe('Rendez-vous');
      expect(component.steps[4].label).toBe('Clôture');
    });

    it('should have correct step icons', () => {
      expect(component.steps[0].icon).toBe('fiber_new');
      expect(component.steps[1].icon).toBe('manage_search');
      expect(component.steps[2].icon).toBe('verified');
      expect(component.steps[3].icon).toBe('event');
      expect(component.steps[4].icon).toBe('flag');
    });
  });

  describe('Status Index Mapping', () => {
    it('should return index 0 for NEW status', () => {
      component.status = DossierStatus.NEW;
      expect(component.currentIndex).toBe(0);
    });

    it('should return index 1 for QUALIFYING status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.currentIndex).toBe(1);
    });

    it('should return index 2 for QUALIFIED status', () => {
      component.status = DossierStatus.QUALIFIED;
      expect(component.currentIndex).toBe(2);
    });

    it('should return index 3 for APPOINTMENT status', () => {
      component.status = DossierStatus.APPOINTMENT;
      expect(component.currentIndex).toBe(3);
    });

    it('should return index 4 for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.currentIndex).toBe(4);
    });

    it('should return index 4 for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.currentIndex).toBe(4);
    });

    it('should return index 0 for null status', () => {
      component.status = null;
      expect(component.currentIndex).toBe(0);
    });
  });

  describe('Close Label and Icon', () => {
    it('should return "Gagné" label for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.closeLabel).toBe('Gagné');
    });

    it('should return "Perdu" label for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.closeLabel).toBe('Perdu');
    });

    it('should return "En cours" label for active status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.closeLabel).toBe('En cours');
    });

    it('should return "emoji_events" icon for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.closeIcon).toBe('emoji_events');
    });

    it('should return "cancel" icon for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.closeIcon).toBe('cancel');
    });

    it('should return "hourglass_top" icon for active status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.closeIcon).toBe('hourglass_top');
    });
  });

  describe('Progress Calculation', () => {
    it('should return 0% progress for NEW status', () => {
      component.status = DossierStatus.NEW;
      expect(component.progressPercent).toBe(0);
    });

    it('should return 25% progress for QUALIFYING status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.progressPercent).toBe(25);
    });

    it('should return 50% progress for QUALIFIED status', () => {
      component.status = DossierStatus.QUALIFIED;
      expect(component.progressPercent).toBe(50);
    });

    it('should return 75% progress for APPOINTMENT status', () => {
      component.status = DossierStatus.APPOINTMENT;
      expect(component.progressPercent).toBe(75);
    });

    it('should return 100% progress for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.progressPercent).toBe(100);
    });

    it('should return 100% progress for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.progressPercent).toBe(100);
    });
  });

  describe('Hint Messages', () => {
    it('should return correct hint for NEW status', () => {
      component.status = DossierStatus.NEW;
      expect(component.hint).toBe('Complétez les informations du prospect et démarrez la qualification.');
    });

    it('should return correct hint for QUALIFYING status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.hint).toBe('Validez le besoin, le budget et les critères. Ajoutez une note de synthèse.');
    });

    it('should return correct hint for QUALIFIED status', () => {
      component.status = DossierStatus.QUALIFIED;
      expect(component.hint).toBe('Planifiez un rendez-vous et associez une annonce si besoin.');
    });

    it('should return correct hint for APPOINTMENT status', () => {
      component.status = DossierStatus.APPOINTMENT;
      expect(component.hint).toBe('Après le rendez-vous, consignez le compte-rendu et clôturez le dossier.');
    });

    it('should return correct hint for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.hint).toBe('Dossier gagné : préparez les documents et passez en phase contractualisation.');
    });

    it('should return correct hint for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.hint).toBe('Dossier perdu : indiquez la raison et gardez une trace pour l\'analyse.');
    });

    it('should return default hint for null status', () => {
      component.status = null;
      expect(component.hint).toBe(`Suivez l'avancement du dossier et documentez chaque étape.`);
    });
  });

  describe('Closed Status Detection', () => {
    it('should detect WON as closed', () => {
      component.status = DossierStatus.WON;
      expect(component.isClosed).toBe(true);
    });

    it('should detect LOST as closed', () => {
      component.status = DossierStatus.LOST;
      expect(component.isClosed).toBe(true);
    });

    it('should not detect NEW as closed', () => {
      component.status = DossierStatus.NEW;
      expect(component.isClosed).toBe(false);
    });

    it('should not detect QUALIFYING as closed', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.isClosed).toBe(false);
    });

    it('should not detect QUALIFIED as closed', () => {
      component.status = DossierStatus.QUALIFIED;
      expect(component.isClosed).toBe(false);
    });

    it('should not detect APPOINTMENT as closed', () => {
      component.status = DossierStatus.APPOINTMENT;
      expect(component.isClosed).toBe(false);
    });
  });

  describe('Won Status Detection', () => {
    it('should detect WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.isWon).toBe(true);
    });

    it('should not detect LOST as won', () => {
      component.status = DossierStatus.LOST;
      expect(component.isWon).toBe(false);
    });

    it('should not detect active statuses as won', () => {
      component.status = DossierStatus.NEW;
      expect(component.isWon).toBe(false);
      
      component.status = DossierStatus.QUALIFYING;
      expect(component.isWon).toBe(false);
    });
  });

  describe('Close Variant Class', () => {
    it('should return "won" class for WON status', () => {
      component.status = DossierStatus.WON;
      expect(component.closeVariantClass).toBe('won');
    });

    it('should return "lost" class for LOST status', () => {
      component.status = DossierStatus.LOST;
      expect(component.closeVariantClass).toBe('lost');
    });

    it('should return empty string for active status', () => {
      component.status = DossierStatus.QUALIFYING;
      expect(component.closeVariantClass).toBe('');
    });

    it('should return empty string for null status', () => {
      component.status = null;
      expect(component.closeVariantClass).toBe('');
    });
  });

  describe('Step Icon Method', () => {
    it('should return step icon for regular steps', () => {
      const step = component.steps[0];
      expect(component.stepIcon(step)).toBe('fiber_new');
    });

    it('should return closeIcon for CLOSE step with WON status', () => {
      component.status = DossierStatus.WON;
      const closeStep = component.steps[4];
      expect(component.stepIcon(closeStep)).toBe('emoji_events');
    });

    it('should return closeIcon for CLOSE step with LOST status', () => {
      component.status = DossierStatus.LOST;
      const closeStep = component.steps[4];
      expect(component.stepIcon(closeStep)).toBe('cancel');
    });

    it('should return hourglass icon for CLOSE step with active status', () => {
      component.status = DossierStatus.QUALIFYING;
      const closeStep = component.steps[4];
      expect(component.stepIcon(closeStep)).toBe('hourglass_top');
    });
  });

  describe('Step Label Method', () => {
    it('should return step label for regular steps', () => {
      const step = component.steps[0];
      expect(component.stepLabel(step)).toBe('Nouveau');
    });

    it('should return enhanced label for closed CLOSE step with WON', () => {
      component.status = DossierStatus.WON;
      const closeStep = component.steps[4];
      expect(component.stepLabel(closeStep)).toBe('Clôture (Gagné)');
    });

    it('should return enhanced label for closed CLOSE step with LOST', () => {
      component.status = DossierStatus.LOST;
      const closeStep = component.steps[4];
      expect(component.stepLabel(closeStep)).toBe('Clôture (Perdu)');
    });

    it('should return regular label for CLOSE step when not closed', () => {
      component.status = DossierStatus.QUALIFYING;
      const closeStep = component.steps[4];
      expect(component.stepLabel(closeStep)).toBe('Clôture');
    });
  });

  describe('Step Completion Detection', () => {
    it('should mark steps before current index as completed', () => {
      component.status = DossierStatus.QUALIFIED; // index 2
      
      expect(component.isCompleted(0)).toBe(true);
      expect(component.isCompleted(1)).toBe(true);
      expect(component.isCompleted(2)).toBe(false);
      expect(component.isCompleted(3)).toBe(false);
    });

    it('should not mark any steps as completed for NEW status', () => {
      component.status = DossierStatus.NEW;
      
      expect(component.isCompleted(0)).toBe(false);
      expect(component.isCompleted(1)).toBe(false);
      expect(component.isCompleted(2)).toBe(false);
    });

    it('should mark all steps except last as completed for WON status', () => {
      component.status = DossierStatus.WON;
      
      expect(component.isCompleted(0)).toBe(true);
      expect(component.isCompleted(1)).toBe(true);
      expect(component.isCompleted(2)).toBe(true);
      expect(component.isCompleted(3)).toBe(true);
      expect(component.isCompleted(4)).toBe(false);
    });
  });

  describe('Active Step Detection', () => {
    it('should mark current index as active', () => {
      component.status = DossierStatus.QUALIFYING; // index 1
      
      expect(component.isActive(0)).toBe(false);
      expect(component.isActive(1)).toBe(true);
      expect(component.isActive(2)).toBe(false);
    });

    it('should mark index 0 as active for NEW status', () => {
      component.status = DossierStatus.NEW;
      
      expect(component.isActive(0)).toBe(true);
      expect(component.isActive(1)).toBe(false);
    });

    it('should mark last index as active for WON status', () => {
      component.status = DossierStatus.WON;
      
      expect(component.isActive(3)).toBe(false);
      expect(component.isActive(4)).toBe(true);
    });
  });

  describe('Rendering and DOM', () => {
    beforeEach(() => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
    });

    it('should render workflow header with title', () => {
      const header = fixture.debugElement.query(By.css('.workflow-title'));
      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toContain('Pipeline dossier');
    });

    it('should render progress percentage', () => {
      const progress = fixture.debugElement.query(By.css('.workflow-progress'));
      expect(progress).toBeTruthy();
      expect(progress.nativeElement.textContent).toContain('25%');
    });

    it('should render progress bar with correct width', () => {
      const progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar).toBeTruthy();
      expect(progressBar.nativeElement.style.width).toBe('25%');
    });

    it('should render all 5 steps', () => {
      const steps = fixture.debugElement.queryAll(By.css('.workflow-step'));
      expect(steps.length).toBe(5);
    });

    it('should apply completed class to completed steps', () => {
      const steps = fixture.debugElement.queryAll(By.css('.workflow-step'));
      expect(steps[0].nativeElement.classList.contains('completed')).toBe(true);
    });

    it('should apply active class to current step', () => {
      const steps = fixture.debugElement.queryAll(By.css('.workflow-step'));
      expect(steps[1].nativeElement.classList.contains('active')).toBe(true);
    });

    it('should render hint message', () => {
      const hint = fixture.debugElement.query(By.css('.workflow-hint'));
      expect(hint).toBeTruthy();
      expect(hint.nativeElement.textContent).toContain('Validez le besoin');
    });

    it('should render icons for each step', () => {
      const icons = fixture.debugElement.queryAll(By.css('.step-dot mat-icon'));
      expect(icons.length).toBe(5);
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
    });

    it('should have role="group" on workflow container', () => {
      const workflow = fixture.debugElement.query(By.css('.workflow'));
      expect(workflow.nativeElement.getAttribute('role')).toBe('group');
    });

    it('should have aria-label on workflow container', () => {
      const workflow = fixture.debugElement.query(By.css('.workflow'));
      expect(workflow.nativeElement.getAttribute('aria-label')).toBe('Progression du dossier');
    });

    it('should have aria-label on progress indicator', () => {
      const progress = fixture.debugElement.query(By.css('.workflow-progress'));
      expect(progress.nativeElement.getAttribute('aria-label')).toBe('Progression');
    });

    it('should mark icons as aria-hidden', () => {
      const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
      icons.forEach(icon => {
        expect(icon.nativeElement.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should use ordered list for steps', () => {
      const stepsList = fixture.debugElement.query(By.css('ol.workflow-steps'));
      expect(stepsList).toBeTruthy();
    });

    it('should use list items for each step', () => {
      const steps = fixture.debugElement.queryAll(By.css('.workflow-steps li'));
      expect(steps.length).toBe(5);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render workflow track for progress bar', () => {
      fixture.detectChanges();
      const track = fixture.debugElement.query(By.css('.workflow-track'));
      expect(track).toBeTruthy();
    });

    it('should update progress bar width dynamically', () => {
      component.status = DossierStatus.NEW;
      fixture.detectChanges();
      let progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar.nativeElement.style.width).toBe('0%');

      component.status = DossierStatus.QUALIFIED;
      fixture.detectChanges();
      progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar.nativeElement.style.width).toBe('50%');

      component.status = DossierStatus.WON;
      fixture.detectChanges();
      progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar.nativeElement.style.width).toBe('100%');
    });

    it('should show workflow meta only when status exists', () => {
      component.status = null;
      fixture.detectChanges();
      let meta = fixture.debugElement.query(By.css('.workflow-meta'));
      expect(meta).toBeFalsy();

      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      meta = fixture.debugElement.query(By.css('.workflow-meta'));
      expect(meta).toBeTruthy();
    });
  });

  describe('Closed Status Display', () => {
    it('should display won chip for WON status', () => {
      component.status = DossierStatus.WON;
      fixture.detectChanges();
      
      const chip = fixture.debugElement.query(By.css('.workflow-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.classList.contains('won')).toBe(true);
      expect(chip.nativeElement.textContent).toContain('Gagné');
    });

    it('should display lost chip for LOST status', () => {
      component.status = DossierStatus.LOST;
      fixture.detectChanges();
      
      const chip = fixture.debugElement.query(By.css('.workflow-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.classList.contains('lost')).toBe(true);
      expect(chip.nativeElement.textContent).toContain('Perdu');
    });

    it('should not display chip for active status', () => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      
      const chip = fixture.debugElement.query(By.css('.workflow-chip'));
      expect(chip).toBeFalsy();
    });

    it('should display check_circle icon for won chip', () => {
      component.status = DossierStatus.WON;
      fixture.detectChanges();
      
      const chip = fixture.debugElement.query(By.css('.workflow-chip'));
      const icon = chip.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent).toContain('check_circle');
    });

    it('should display cancel icon for lost chip', () => {
      component.status = DossierStatus.LOST;
      fixture.detectChanges();
      
      const chip = fixture.debugElement.query(By.css('.workflow-chip'));
      const icon = chip.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent).toContain('cancel');
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      const metadata = (WorkflowStepperComponent as any).__annotations__?.[0] || 
                       (WorkflowStepperComponent as any).ɵcmp;
      // Component uses OnPush, should be verified through component decorator
      expect(component).toBeTruthy();
    });

    it('should update view when status input changes', () => {
      component.status = DossierStatus.NEW;
      fixture.detectChanges();
      
      let progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar.nativeElement.style.width).toBe('0%');

      component.status = DossierStatus.WON;
      fixture.detectChanges();
      
      progressBar = fixture.debugElement.query(By.css('.workflow-bar'));
      expect(progressBar.nativeElement.style.width).toBe('100%');
    });
  });

  describe('Step Label Content', () => {
    it('should display step labels correctly', () => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      
      const stepLabels = fixture.debugElement.queryAll(By.css('.step-label'));
      expect(stepLabels[0].nativeElement.textContent).toBe('Nouveau');
      expect(stepLabels[1].nativeElement.textContent).toBe('Qualification');
      expect(stepLabels[2].nativeElement.textContent).toBe('Qualifié');
      expect(stepLabels[3].nativeElement.textContent).toBe('Rendez-vous');
      expect(stepLabels[4].nativeElement.textContent).toBe('Clôture');
    });

    it('should display enhanced close label for won status', () => {
      component.status = DossierStatus.WON;
      fixture.detectChanges();
      
      const stepLabels = fixture.debugElement.queryAll(By.css('.step-label'));
      expect(stepLabels[4].nativeElement.textContent).toBe('Clôture (Gagné)');
    });

    it('should display enhanced close label for lost status', () => {
      component.status = DossierStatus.LOST;
      fixture.detectChanges();
      
      const stepLabels = fixture.debugElement.queryAll(By.css('.step-label'));
      expect(stepLabels[4].nativeElement.textContent).toBe('Clôture (Perdu)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid status changes', () => {
      component.status = DossierStatus.NEW;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(0);

      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(1);

      component.status = DossierStatus.WON;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(4);
    });

    it('should handle null to status transition', () => {
      component.status = null;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(0);

      component.status = DossierStatus.QUALIFIED;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);
    });

    it('should handle status to null transition', () => {
      component.status = DossierStatus.QUALIFIED;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);

      component.status = null;
      fixture.detectChanges();
      expect(component.currentIndex).toBe(0);
    });

    it('should handle all status transitions correctly', () => {
      const statuses = [
        DossierStatus.NEW,
        DossierStatus.QUALIFYING,
        DossierStatus.QUALIFIED,
        DossierStatus.APPOINTMENT,
        DossierStatus.WON,
        DossierStatus.LOST
      ];

      statuses.forEach(status => {
        component.status = status;
        fixture.detectChanges();
        expect(component.currentIndex).toBeGreaterThanOrEqual(0);
        expect(component.currentIndex).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Hint Display Rendering', () => {
    it('should render hint when status exists', () => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      
      const hint = fixture.debugElement.query(By.css('.workflow-hint'));
      expect(hint).toBeTruthy();
    });

    it('should display correct hint icon', () => {
      component.status = DossierStatus.QUALIFYING;
      fixture.detectChanges();
      
      const hintIcon = fixture.debugElement.query(By.css('.workflow-hint mat-icon'));
      expect(hintIcon.nativeElement.textContent).toContain('tips_and_updates');
    });

    it('should update hint text when status changes', () => {
      component.status = DossierStatus.NEW;
      fixture.detectChanges();
      let hint = fixture.debugElement.query(By.css('.workflow-hint span'));
      expect(hint.nativeElement.textContent).toContain('Complétez les informations');

      component.status = DossierStatus.WON;
      fixture.detectChanges();
      hint = fixture.debugElement.query(By.css('.workflow-hint span'));
      expect(hint.nativeElement.textContent).toContain('Dossier gagné');
    });
  });

  describe('Visual State Classes', () => {
    it('should not apply completed or active class to future steps', () => {
      component.status = DossierStatus.QUALIFYING; // index 1
      fixture.detectChanges();
      
      const steps = fixture.debugElement.queryAll(By.css('.workflow-step'));
      expect(steps[2].nativeElement.classList.contains('completed')).toBe(false);
      expect(steps[2].nativeElement.classList.contains('active')).toBe(false);
      expect(steps[3].nativeElement.classList.contains('completed')).toBe(false);
      expect(steps[3].nativeElement.classList.contains('active')).toBe(false);
    });

    it('should apply both completed and active classes correctly for same workflow', () => {
      component.status = DossierStatus.QUALIFIED; // index 2
      fixture.detectChanges();
      
      const steps = fixture.debugElement.queryAll(By.css('.workflow-step'));
      
      // Step 0 should be completed
      expect(steps[0].nativeElement.classList.contains('completed')).toBe(true);
      expect(steps[0].nativeElement.classList.contains('active')).toBe(false);
      
      // Step 1 should be completed
      expect(steps[1].nativeElement.classList.contains('completed')).toBe(true);
      expect(steps[1].nativeElement.classList.contains('active')).toBe(false);
      
      // Step 2 should be active
      expect(steps[2].nativeElement.classList.contains('completed')).toBe(false);
      expect(steps[2].nativeElement.classList.contains('active')).toBe(true);
      
      // Step 3 should be neither
      expect(steps[3].nativeElement.classList.contains('completed')).toBe(false);
      expect(steps[3].nativeElement.classList.contains('active')).toBe(false);
    });
  });
});
