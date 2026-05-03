import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-vitrine-home',
    templateUrl: './vitrine-home.component.html',
    styleUrls: ['./vitrine-home.component.scss'],
    imports: [RouterLink]
})
export class VitrineHomeComponent implements OnInit, AfterViewInit {
  billingAnnual = false;

  readonly stats = [
    { value: '150+', label: 'Professionnels actifs' },
    { value: '1 200+', label: 'Annonces publiées' },
    { value: '98%', label: 'Taux de satisfaction' },
    { value: '40%', label: 'Gain de temps moyen' },
  ];

  readonly features = [
    { icon: 'target', title: 'Portail partenaire', desc: 'Publiez vos annonces sur le portail Atlasia avec diffusion multi-canale intégrée.' },
    { icon: 'users', title: 'CRM immobilier', desc: "Gérez vos prospects, dossiers et rendez-vous depuis un espace centralisé. Suivi complet du cycle de vente." },
    { icon: 'calendar', title: 'Agenda intelligent', desc: 'Planifiez visites et rappels. Synchronisation avec vos calendriers existants.' },
    { icon: 'chart', title: 'Analytiques', desc: "Tableaux de bord de performance : vues d'annonces, leads, conversions, tendances marché." },
    { icon: 'shield', title: 'Badge Pro Vérifié', desc: 'Obtenez le badge de confiance Atlasia. Vos annonces sont mises en avant auprès des acheteurs.' },
    { icon: 'zap', title: 'Diffusion WhatsApp', desc: 'Envoyez des annonces et relances directement par WhatsApp Business depuis la plateforme.' },
  ];

  readonly testimonials = [
    { quote: `Depuis que nous utilisons Atlasia, notre productivité a augmenté de 40%. La gestion des dossiers est enfin centralisée.`, name: 'Karim A.', role: 'DG, Prestige Immo Casablanca', initials: 'KA' },
    { quote: `Le portail partenaire nous a apporté 3x plus de leads qualifiés que notre ancienne solution. Le ROI est là.`, name: 'Sara F.', role: 'Responsable Marketing, ImmoPlus Rabat', initials: 'SF' },
    { quote: `L'agenda et la gestion des visites nous a fait économiser 2h par jour. C'est le bon outil pour les pros du secteur.`, name: 'Ahmed B.', role: 'Directeur, Maroc Luxury Properties', initials: 'AB' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    void 0;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initReveals(), 100);
  }

  private initReveals(): void {
    const els = document.querySelectorAll('.at-reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
  }

  goToDemo(): void { this.router.navigate(['/biz/demo']); }
}
