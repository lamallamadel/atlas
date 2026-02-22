import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TourDefinitionService, TourDefinition } from '../services/tour-definition.service';
import { OnboardingTourService } from '../services/onboarding-tour.service';
import { UserPreferencesService } from '../services/user-preferences.service';

@Component({
  selector: 'app-tour-progress',
  templateUrl: './tour-progress.component.html',
  styleUrls: ['./tour-progress.component.css']
})
export class TourProgressComponent implements OnInit, OnDestroy {
  tours: TourDefinition[] = [];
  completionPercentage = 0;
  completedCount = 0;
  totalCount = 0;
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private tourDefinitionService: TourDefinitionService,
    private onboardingTourService: OnboardingTourService,
    private userPreferencesService: UserPreferencesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTours();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTours(): void {
    this.isLoading = true;
    this.tours = this.tourDefinitionService.getCoreTours();
    this.totalCount = this.tours.length;
    
    this.updateProgress();
    this.isLoading = false;
  }

  updateProgress(): void {
    this.completedCount = this.tours.filter(tour => 
      this.onboardingTourService.isTourCompleted(tour.id)
    ).length;
    
    this.completionPercentage = this.totalCount > 0 
      ? Math.round((this.completedCount / this.totalCount) * 100)
      : 0;
  }

  isTourCompleted(tourId: string): boolean {
    return this.onboardingTourService.isTourCompleted(tourId);
  }

  startTour(tour: TourDefinition): void {
    if (tour.requiredRoute && !this.router.url.includes(tour.requiredRoute)) {
      this.router.navigate([tour.requiredRoute]).then(() => {
        setTimeout(() => {
          this.onboardingTourService.startManualTour(tour.id as any);
        }, 500);
      });
    } else {
      this.onboardingTourService.startManualTour(tour.id as any);
    }
  }

  resetTour(tour: TourDefinition, event: Event): void {
    event.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le guide "${tour.name}" ?`)) {
      this.onboardingTourService.resetTour(tour.id);
      this.updateProgress();
    }
  }

  resetAllTours(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les guides interactifs ?')) {
      this.onboardingTourService.resetAllTours();
      this.updateProgress();
    }
  }

  getStatusIcon(tour: TourDefinition): string {
    return this.isTourCompleted(tour.id) ? 'check_circle' : 'radio_button_unchecked';
  }

  getStatusColor(tour: TourDefinition): string {
    return this.isTourCompleted(tour.id) ? 'primary' : 'accent';
  }
}
