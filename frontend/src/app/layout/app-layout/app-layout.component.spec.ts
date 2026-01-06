import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AppLayoutComponent } from './app-layout.component';
import { MaterialTestingModule } from '../../testing/material-testing.module';

@Component({ selector: 'app-global-search-bar', template: '' })
class GlobalSearchBarStubComponent { }

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppLayoutComponent, GlobalSearchBarStubComponent],
      imports: [RouterTestingModule, MaterialTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu', () => {
    expect(component.menuOpen).toBe(false);
    component.toggleMenu();
    expect(component.menuOpen).toBe(true);
    component.toggleMenu();
    expect(component.menuOpen).toBe(false);
  });
});
