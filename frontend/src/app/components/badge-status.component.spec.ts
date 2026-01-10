import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BadgeStatusComponent } from './badge-status.component';

describe('BadgeStatusComponent', () => {
  let component: BadgeStatusComponent;
  let fixture: ComponentFixture<BadgeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BadgeStatusComponent ],
      imports: [
        MatChipsModule,
        MatIconModule,
        MatTooltipModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeStatusComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.status = 'ACTIVE';
    component.entityType = 'annonce';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return correct status label for annonce ACTIVE', () => {
    component.status = 'ACTIVE';
    component.entityType = 'annonce';
    expect(component.getStatusLabel()).toBe('Actif');
  });

  it('should return correct status icon for annonce ACTIVE', () => {
    component.status = 'ACTIVE';
    component.entityType = 'annonce';
    expect(component.getStatusIcon()).toBe('check_circle');
  });

  it('should return correct status description for annonce ACTIVE', () => {
    component.status = 'ACTIVE';
    component.entityType = 'annonce';
    expect(component.getStatusDescription()).toBe('Annonce active et visible');
  });

  it('should pulse for ACTIVE annonce status', () => {
    component.status = 'ACTIVE';
    component.entityType = 'annonce';
    expect(component.shouldPulse()).toBe(true);
  });

  it('should not pulse for DRAFT annonce status', () => {
    component.status = 'DRAFT';
    component.entityType = 'annonce';
    expect(component.shouldPulse()).toBe(false);
  });

  it('should return correct status label for dossier NEW', () => {
    component.status = 'NEW';
    component.entityType = 'dossier';
    expect(component.getStatusLabel()).toBe('Nouveau');
  });

  it('should return correct status icon for dossier NEW', () => {
    component.status = 'NEW';
    component.entityType = 'dossier';
    expect(component.getStatusIcon()).toBe('fiber_new');
  });

  it('should pulse for NEW dossier status', () => {
    component.status = 'NEW';
    component.entityType = 'dossier';
    expect(component.shouldPulse()).toBe(true);
  });

  it('should return correct status class for annonce', () => {
    component.status = 'DRAFT';
    component.entityType = 'annonce';
    expect(component.getStatusClass()).toContain('badge-draft');
  });

  it('should return correct status class for dossier', () => {
    component.status = 'WON';
    component.entityType = 'dossier';
    expect(component.getStatusClass()).toContain('badge-won');
  });
});
