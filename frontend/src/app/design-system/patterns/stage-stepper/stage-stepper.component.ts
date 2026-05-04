import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DsStage {
  label: string;
  state: 'done' | 'current' | 'upcoming';
}

@Component({
  selector: 'ds-stage-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ds-stages" role="list" [attr.aria-label]="ariaLabel">
      @for (stage of stages; track stage.label) {
        <div class="ds-stages__step" role="listitem" [attr.aria-current]="stage.state === 'current' ? 'step' : null">
          <div class="ds-stages__pill" [class]="'ds-stages__pill--' + stage.state"></div>
          <span class="ds-stages__label">{{ stage.label }}</span>
        </div>
      }
    </div>
  `,
  styleUrls: ['./stage-stepper.component.scss'],
})
export class StageStepperComponent {
  @Input() stages: DsStage[] = [];
  @Input() ariaLabel = 'Étapes du dossier';
}
