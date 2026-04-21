import { Component } from '@angular/core';
import { LottieAnimationType } from './lottie-animation.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AnimatedEmptyStateComponent } from './animated-empty-state.component';
import { MatIcon } from '@angular/material/icon';

interface AnimationDemo {
  type: LottieAnimationType;
  title: string;
  message: string;
  primaryAction: { label: string; icon: string };
  secondaryAction?: { label: string; icon: string };
}

@Component({
    selector: 'app-lottie-animations-demo',
    templateUrl: './lottie-animations-demo.component.html',
    styleUrls: ['./lottie-animations-demo.component.css'],
    imports: [MatCard, MatCardContent, MatCheckbox, FormsModule, MatFormField, MatLabel, MatInput, MatCardHeader, MatCardTitle, AnimatedEmptyStateComponent, MatIcon]
})
export class LottieAnimationsDemoComponent {
  animations: AnimationDemo[] = [
    {
      type: 'search-empty',
      title: 'Aucun résultat trouvé',
      message: 'Essayez de modifier vos critères de recherche ou d\'explorer nos suggestions.',
      primaryAction: { label: 'Nouvelle recherche', icon: 'search' },
      secondaryAction: { label: 'Réinitialiser filtres', icon: 'filter_alt_off' }
    },
    {
      type: 'success',
      title: 'Opération réussie !',
      message: 'Votre action a été effectuée avec succès.',
      primaryAction: { label: 'Continuer', icon: 'arrow_forward' }
    },
    {
      type: 'error',
      title: 'Une erreur est survenue',
      message: 'Nous n\'avons pas pu traiter votre demande. Veuillez réessayer.',
      primaryAction: { label: 'Réessayer', icon: 'refresh' },
      secondaryAction: { label: 'Contacter le support', icon: 'support_agent' }
    },
    {
      type: 'upload',
      title: 'Aucun document',
      message: 'Glissez-déposez vos fichiers ici ou cliquez pour parcourir.',
      primaryAction: { label: 'Parcourir', icon: 'folder_open' }
    },
    {
      type: 'maintenance',
      title: 'Maintenance en cours',
      message: 'Notre service est temporairement indisponible. Nous reviendrons bientôt !',
      primaryAction: { label: 'Vérifier le statut', icon: 'info' }
    }
  ];

  showControls = false;
  loop = true;
  animationWidth = 200;
  animationHeight = 200;

  handlePrimaryAction(type: LottieAnimationType): void {
    console.log(`Primary action clicked for: ${type}`);
  }

  handleSecondaryAction(type: LottieAnimationType): void {
    console.log(`Secondary action clicked for: ${type}`);
  }

  getActionConfig(animation: AnimationDemo, isPrimary: boolean) {
    const action = isPrimary ? animation.primaryAction : animation.secondaryAction;
    if (!action) return undefined;
    
    return {
      label: action.label,
      icon: action.icon,
      handler: () => isPrimary ? 
        this.handlePrimaryAction(animation.type) : 
        this.handleSecondaryAction(animation.type)
    };
  }
}
