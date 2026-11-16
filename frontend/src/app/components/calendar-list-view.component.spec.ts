import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { of } from 'rxjs';

import { CalendarListViewComponent } from './calendar-list-view.component';
import {
  AppointmentApiService,
  Page,
  AppointmentResponse} from '../services/appointment-api.service';
import { NotificationService } from '../services/notification.service';

describe('CalendarListViewComponent', () => {
  let component: CalendarListViewComponent;
  let fixture: ComponentFixture<CalendarListViewComponent>;
  let listSpy: ReturnType<typeof vi.fn>;

  const emptyPage: Page<AppointmentResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 1000,
    number: 0,
    last: true,
    first: true,
    empty: true,
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 1000,
      paged: true,
      unpaged: false},
    sort: { empty: true, sorted: false, unsorted: true },
    numberOfElements: 0};

  beforeEach(async () => {
    listSpy = vi.fn().mockReturnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        LayoutModule,
        CalendarListViewComponent],
      providers: [
        {
          provide: AppointmentApiService,
          useValue: {
            list: listSpy}},
        {
          provide: NotificationService,
          useValue: {
            error: vi.fn(),
            success: vi.fn()}},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();

    fixture = TestBed.createComponent(CalendarListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', () => {
    expect(listSpy).toHaveBeenCalled();
    expect(component.appointments).toEqual([]);
  });
});
