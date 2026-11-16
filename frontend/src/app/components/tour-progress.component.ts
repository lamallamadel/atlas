import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { TourDefinitionService, TourDefinition } from '../services/tour-definition.service';
import { OnboardingTourService } from '../services/onboarding-tour.service';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  DsCardComponent,
  DsButtonComponent,
  DsIconComponent,
  DsProgressBarComponent,
  DsSkeletonComponent,
  DsBadgeComponent,
  DsToastService
} from '../design-system';

@Component({
  selector: 'app-tour-progress',
  standalone: true,
  templateUrl: './tour-progress.component.html',
  styleUrls: ['./tour-progress.component.css'],
  imports: [
    CommonModule, 
    DsCardComponent, 
    DsButtonComponent, 
    DsIconComponent, 
    DsProgressBarComponent,
    DsSkeletonComponent,
    DsBadgeComponent
  ]
})
export class TourProgressComponent implements OnInit, OnDestroy {
  private tourDefinitionService = inject(TourDefinitionService);
  private onboardingTourService = inject(OnboardingTourService);
  private toastService = inject(DsToastService);

  tours: TourDefinition[] = [];
  completedTours: string[] = [];
  isLoading = false;
  totalCount = 0;
  completedCount = 0;
  completionPercentage = 0;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadTours();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTours(): void {
    this.isLoading = true;
    this.tours = this.tourDefinitionService.getAllTours();
    this.completedTours = this.tours
      .filter(t => this.onboardingTourService.isTourCompleted(t.id))
      .map(t => t.id);

    this.totalCount = this.tours.length;
    this.completedCount = this.completedTours.length;
    this.completionPercentage = this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0;

    this.isLoading = false;
  }

  isTourCompleted(tourId: string): boolean {
    return this.completedTours.includes(tourId);
  }

  startTour(tour: TourDefinition): void {
    this.onboardingTourService.startManualTour('dossier-creation');
  }

  resetTour(tour: TourDefinition, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Voulez-vous vraiment réinitialiser le guide "${tour.name}" ?`)) {
      this.onboardingTourService.resetTour(tour.id);
      this.loadTours();
      this.toastService.success('Guide réinitialisé');
    }
  }

  resetAllTours(): void {
    if (confirm('Voulez-vous vraiment réinitialiser TOUS les guides ?')) {
      this.onboardingTourService.resetAllTours();
      this.loadTours();
      this.toastService.success('Tous les guides ont été réinitialisés');
    }
  }

  getStatusIcon(tour: TourDefinition): string {
    return this.isTourCompleted(tour.id) ? 'check' : 'plus';
  }

  getStatusBadgeStatus(tour: TourDefinition): string {
    return this.isTourCompleted(tour.id) ? 'success' : 'neutral';
  }
}
