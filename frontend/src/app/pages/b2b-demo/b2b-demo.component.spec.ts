import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { B2bDemoComponent } from './b2b-demo.component';

const LIST = (r: HttpRequest<unknown>) => r.url === '/api/v1/dossiers' && r.params.get('caseType') === 'CRM_LEAD_B2B_DEMO';

describe('B2bDemoComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [B2bDemoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('groups demo requests by pipeline status, with the agency profile', () => {
    const fixture = TestBed.createComponent(B2bDemoComponent);
    fixture.detectChanges();
    httpMock.expectOne(LIST).flush({
      content: [
        { id: 1, leadName: 'Agence du Détroit', statusCode: 'B2B_NEW', createdAt: '2026-11-20T10:00:00',
          leadDetails: { city: 'Tanger', actorType: 'agence', needs: ['CRM', 'WhatsApp'] } },
        { id: 2, leadName: 'Promo Atlas', statusCode: 'B2B_SCHEDULED', assignedTo: 'u1', assignedToName: 'Sara', createdAt: '2026-11-21T10:00:00' },
        { id: 3, leadName: 'Réseau Sud', statusCode: 'B2B_LOST', createdAt: '2026-11-22T10:00:00' },
      ],
      totalElements: 3,
    });
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    expect(cmp.byStatus()['B2B_NEW'].length).toBe(1);
    expect(cmp.byStatus()['B2B_SCHEDULED'][0].assignedToName).toBe('Sara');
    const text = el.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Tanger · Agence');
    expect(text).toContain('WhatsApp');
    expect(text).toContain('À attribuer');
    expect(el.querySelectorAll('.b2b-col').length).toBe(6);
    expect(el.querySelector('a.b2b-card')!.getAttribute('href')).toBe('/pro/dossiers/1');
  });

  it('shows an empty state when there is no demo request', () => {
    const fixture = TestBed.createComponent(B2bDemoComponent);
    fixture.detectChanges();
    httpMock.expectOne(LIST).flush({ content: [], totalElements: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucune demande de démo');
  });
});
