import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AnnonceCreateComponent } from './annonce-create.component';
import { AnnonceApiService } from '../../services/annonce-api.service';

describe('AnnonceCreateComponent', () => {
  let component: AnnonceCreateComponent;
  let fixture: ComponentFixture<AnnonceCreateComponent>;
  let annonceApiService: jasmine.SpyObj<AnnonceApiService>;

  beforeEach(async () => {
    const annonceApiServiceSpy = jasmine.createSpyObj('AnnonceApiService', ['getById', 'create', 'update']);
    annonceApiServiceSpy.getById.and.returnValue(of(undefined as any));
    annonceApiServiceSpy.create.and.returnValue(of(undefined as any));
    annonceApiServiceSpy.update.and.returnValue(of(undefined as any));

    await TestBed.configureTestingModule({
      declarations: [AnnonceCreateComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule, // required because template uses [(ngModel)] for photo URL input
        ReactiveFormsModule,
        MatStepperModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    annonceApiService = TestBed.inject(AnnonceApiService) as jasmine.SpyObj<AnnonceApiService>;
    fixture = TestBed.createComponent(AnnonceCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call getById when no id is present in route', () => {
    expect(annonceApiService.getById).not.toHaveBeenCalled();
    expect(component.isEditMode).toBe(false);
  });
});
