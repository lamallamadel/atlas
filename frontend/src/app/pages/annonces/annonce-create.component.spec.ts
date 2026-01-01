import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnonceCreateComponent } from './annonce-create.component';

describe('AnnonceCreateComponent', () => {
  let component: AnnonceCreateComponent;
  let fixture: ComponentFixture<AnnonceCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnonceCreateComponent ]
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
