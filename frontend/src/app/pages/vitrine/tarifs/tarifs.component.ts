import { Component } from '@angular/core';

@Component({
  selector: 'app-tarifs',
  templateUrl: './tarifs.component.html',
  styleUrls: ['./tarifs.component.scss']
})
export class TarifsComponent {
  annual = false;

  readonly plans = [
    {
      name: 'Starter',
      monthly: 490,
      annual: 390,
      note: 'par mois, 1 utilisateur',
      desc: 'Idéal pour démarrer',
      featured: false,
      features: ['5 annonces actives', 'Portail Atlasia', 'CRM basique (leads)', 'Agenda', 'Support email'],
      cta: 'Commencer'
    },
    {
      name: 'Pro',
      monthly: 990,
      annual: 790,
      note: 'par mois, jusqu\'à 5 utilisateurs',
      desc: 'Le plus choisi par les agences',
      featured: true,
      features: ['Annonces illimitées', 'Portail + Badge Pro Vérifié', 'CRM complet + pipeline', 'WhatsApp Business intégré', 'Analytiques avancées', 'Agenda multi-agents', 'Support prioritaire'],
      cta: 'Démarrer avec Pro'
    },
    {
      name: 'Enterprise',
      monthly: null,
      annual: null,
      note: 'Sur devis personnalisé',
      desc: 'Pour réseaux et promoteurs',
      featured: false,
      features: ['Tout Pro +', 'Accès API & intégrations', 'Multi-succursales', 'Rapports personnalisés', 'Account manager dédié', 'Formation & onboarding', 'SLA garanti'],
      cta: 'Demander un devis'
    },
  ];

  readonly addons = [
    { label: 'WhatsApp Business (API officielle)', price: '150 MAD/mois' },
    { label: 'Diffusion multi-portails (+Mubawab, +Avito)', price: '200 MAD/mois' },
    { label: 'Module Promoteurs (lots + réservations)', price: '500 MAD/mois' },
    { label: 'Intégration CRM externe (Salesforce, HubSpot)', price: 'Sur devis' },
  ];

  readonly faqs = [
    { q: 'Comment fonctionne la période d\'essai ?', a: 'Vous bénéficiez de 14 jours d\'essai gratuit sur le plan Pro. Aucune carte de crédit requise. À la fin de la période, vous pouvez choisir votre plan ou arrêter sans frais.' },
    { q: 'Puis-je changer de plan en cours d\'abonnement ?', a: 'Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement et la facturation est ajustée au prorata.' },
    { q: 'Proposez-vous des tarifs pour les groupes et réseaux ?', a: 'Oui. Pour les réseaux multi-agences et les promoteurs avec plusieurs programmes, nous proposons des tarifs personnalisés. Contactez notre équipe commerciale.' },
    { q: 'Les données sont-elles sécurisées au Maroc ?', a: 'Oui. Toutes vos données sont hébergées au Maroc, conformes à la loi 09-08. Nous appliquons le chiffrement de bout en bout et des sauvegardes quotidiennes.' },
    { q: 'Quel est le délai de mise en service ?', a: 'Votre espace est opérationnel en moins de 24h après validation de votre abonnement. Notre équipe vous accompagne lors de l\'onboarding initial.' },
  ];

  openFaqs = new Set<number>();

  toggleFaq(i: number): void {
    if (this.openFaqs.has(i)) this.openFaqs.delete(i);
    else this.openFaqs.add(i);
  }

  get price() { return (p: typeof this.plans[0]) => this.annual ? p.annual : p.monthly; }
}
