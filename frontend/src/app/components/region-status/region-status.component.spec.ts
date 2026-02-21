import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegionStatusComponent } from './region-status.component';
import { RegionRoutingService } from '../../services/region-routing.service';
import { of } from 'rxjs';

describe('RegionStatusComponent', () => {
  let component: RegionStatusComponent;
  let fixture: ComponentFixture<RegionStatusComponent>;

  beforeEach(async () => {
    const mockService = jasmine.createSpyObj('RegionRoutingService', ['getAllRegions'], {
      selectedRegion$: of(null),
      regionHealth$: of(new Map()),
      failoverInProgress$: of(false)
    });

    await TestBed.configureTestingModule({
      declarations: [ RegionStatusComponent ],
      providers: [{ provide: RegionRoutingService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
