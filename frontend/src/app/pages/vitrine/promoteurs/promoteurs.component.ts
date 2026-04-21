import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-promoteurs',
    templateUrl: './promoteurs.component.html',
    styleUrls: ['./promoteurs.component.scss'],
    imports: [RouterLink]
})
export class PromoTeursComponent {
  readonly features = [
    { icon: '🏗️', title: 'Gestion de programmes', desc: 'Créez et gérez vos programmes avec lots, plans, disponibilités et prix.' },
    { icon: '📑', title: 'Réservations en ligne', desc: 'Collectez les réservations et acomptes directement depuis le portail.' },
    { icon: '🗺️', title: 'Visite virtuelle 3D', desc: 'Intégrez des visites virtuelles ou maquettes 3D directement dans vos annonces.' },
    { icon: '📧', title: 'Communication automatisée', desc: 'Envoyez automatiquement les mises à jour de disponibilités à vos prospects.' },
    { icon: '💰', title: 'Simulateur de financement', desc: 'Intégrez un simulateur de crédit immobilier sur vos fiches produits.' },
    { icon: '📈', title: 'Analytics programmes', desc: "Suivez les performances de chaque programme : vues, leads, taux d'intérêt." },
  ];
}
