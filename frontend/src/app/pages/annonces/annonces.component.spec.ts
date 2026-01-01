import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { AnnoncesComponent } from './annonces.component';
import { AnnonceApiService } from '../../services/annonce-api.service';

describe('AnnoncesComponent', () => {
  let component: AnnoncesComponent;
  let fixture: ComponentFixture<AnnoncesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnoncesComponent ],
      imports: [ 
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [ AnnonceApiService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnoncesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
