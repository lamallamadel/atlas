import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TourProgressComponent } from './tour-progress.component';
import { TourDefinitionService } from '../services/tour-definition.service';
import { OnboardingTourService } from '../services/onboarding-tour.service';
import { UserPreferencesService } from '../services/user-preferences.service';

describe('TourProgressComponent', () => {
  let component: TourProgressComponent;
  let fixture: ComponentFixture<TourProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TourProgressComponent ],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule,
        MatButtonModule,
        MatChipsModule,
        MatProgressSpinnerModule
      ],
      providers: [
        TourDefinitionService,
        OnboardingTourService,
        UserPreferencesService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tours on init', () => {
    expect(component.tours.length).toBeGreaterThan(0);
  });

  it('should calculate completion percentage', () => {
    expect(component.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(component.completionPercentage).toBeLessThanOrEqual(100);
  });
});
