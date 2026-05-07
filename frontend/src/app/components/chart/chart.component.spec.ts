import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartComponent } from './chart.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChartComponent', () => {
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ChartComponent, NoopAnimationsModule]
})
    .compileComponents();

    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.type()).toBe('bar');
    expect(component.animation()).toBe(true);
    expect(component.showLegend()).toBe(true);
    expect(component.showGrid()).toBe(true);
  });

  it('should handle empty datasets', () => {
    fixture.componentRef.setInput('datasets', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
