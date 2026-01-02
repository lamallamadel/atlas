import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnonceCreateComponent } from './annonce-create.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';

describe('AnnonceCreateComponent', () => {
  let component: AnnonceCreateComponent;
  let fixture: ComponentFixture<AnnonceCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnnonceCreateComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AnnonceCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
