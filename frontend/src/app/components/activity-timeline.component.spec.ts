import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityTimelineComponent } from './activity-timeline.component';
import { MaterialTestingModule } from '../testing/material-testing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ActivityTimelineComponent', () => {
  let component: ActivityTimelineComponent;
  let fixture: ComponentFixture<ActivityTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MaterialTestingModule, 
        BrowserAnimationsModule,
        ActivityTimelineComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTimelineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 123);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
