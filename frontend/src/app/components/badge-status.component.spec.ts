import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BadgeStatusComponent } from './badge-status.component';

describe('BadgeStatusComponent', () => {
  let component: BadgeStatusComponent;
  let fixture: ComponentFixture<BadgeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatIconModule, MatTooltipModule, BadgeStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeStatusComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.componentRef.setInput('entityType', 'annonce');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return correct status label for annonce ACTIVE', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.getStatusLabel()).toBe('Actif');
  });

  it('should return correct status icon for annonce ACTIVE', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.getStatusIcon()).toBe('check_circle');
  });

  it('should return correct status description for annonce ACTIVE', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.getStatusDescription()).toBe('Annonce active et visible');
  });

  it('should pulse for ACTIVE annonce status', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.shouldPulse()).toBe(true);
  });

  it('should not pulse for DRAFT annonce status', () => {
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.shouldPulse()).toBe(false);
  });

  it('should return correct status label for dossier NEW', () => {
    fixture.componentRef.setInput('status', 'NEW');
    fixture.componentRef.setInput('entityType', 'dossier');
    expect(component.getStatusLabel()).toBe('Nouveau');
  });

  it('should return correct status icon for dossier NEW', () => {
    fixture.componentRef.setInput('status', 'NEW');
    fixture.componentRef.setInput('entityType', 'dossier');
    expect(component.getStatusIcon()).toBe('fiber_new');
  });

  it('should pulse for NEW dossier status', () => {
    fixture.componentRef.setInput('status', 'NEW');
    fixture.componentRef.setInput('entityType', 'dossier');
    expect(component.shouldPulse()).toBe(true);
  });

  it('should map annonce DRAFT to ds-badge draft', () => {
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.componentRef.setInput('entityType', 'annonce');
    expect(component.getDsBadgeStatus()).toBe('draft');
  });

  it('should map dossier WON to ds-badge won', () => {
    fixture.componentRef.setInput('status', 'WON');
    fixture.componentRef.setInput('entityType', 'dossier');
    expect(component.getDsBadgeStatus()).toBe('won');
  });

  it('should map property SOLD to ds-badge success', () => {
    fixture.componentRef.setInput('status', 'SOLD');
    fixture.componentRef.setInput('entityType', 'property');
    expect(component.getDsBadgeStatus()).toBe('success');
  });
});
