import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from "rxjs";

import { AnnonceCreateComponent } from './annonce-create.component';
import { AnnonceApiService } from '../../services/annonce-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
    imports: [RouterTestingModule,
        FormsModule, // required because template uses [(ngModel)] for photo URL input
        ReactiveFormsModule,
        MatStepperModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        NoopAnimationsModule, AnnonceCreateComponent],
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
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
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
