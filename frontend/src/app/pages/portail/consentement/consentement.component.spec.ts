import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ConsentementComponent } from './consentement.component';
import { ConsentLinkApiService, PublicConsentView } from '../../../services/consent-link-api.service';

function view(p: Partial<PublicConsentView> = {}): PublicConsentView {
  return { status: 'PENDING', decision: null, channel: 'WHATSAPP', consentType: 'MARKETING',
    clientFirstName: 'Karim', expiresAt: '2099-01-01T00:00:00', ...p };
}

describe('ConsentementComponent (page publique)', () => {
  let fixture: ComponentFixture<ConsentementComponent>;
  let api: { view: ReturnType<typeof vi.fn>; answer: ReturnType<typeof vi.fn> };

  function create() {
    fixture = TestBed.createComponent(ConsentementComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  const text = () => (fixture.nativeElement as HTMLElement).textContent || '';

  beforeEach(() => {
    api = { view: vi.fn(), answer: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConsentementComponent],
      providers: [
        { provide: ConsentLinkApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'tok-1' }) } } },
      ],
    });
  });

  it('explique au client ce qu’il accepte, puis enregistre sa réponse', () => {
    api.view.mockReturnValue(of(view()));
    api.answer.mockReturnValue(of(view({ status: 'ANSWERED', decision: 'ACCEPT' })));
    const c = create();
    expect(api.view).toHaveBeenCalledWith('tok-1');
    expect(text()).toContain('Bonjour Karim');
    expect(text()).toContain('propositions de biens');
    expect(text()).toContain('WhatsApp');

    c.answer('ACCEPT');
    fixture.detectChanges();
    expect(api.answer).toHaveBeenCalledWith('tok-1', 'ACCEPT');
    expect(text()).toContain("Merci, c'est noté");
  });

  it('lien inconnu : message clair', () => {
    api.view.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: "Ce lien n'existe pas ou n'est plus valable." } })));
    create();
    expect(text()).toContain('Lien indisponible');
    expect(text()).toContain("n'existe pas");
  });

  it('lien expiré', () => {
    api.view.mockReturnValue(of(view({ status: 'EXPIRED' })));
    create();
    expect(text()).toContain('Ce lien a expiré');
  });
});
