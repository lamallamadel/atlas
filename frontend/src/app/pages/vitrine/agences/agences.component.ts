import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-agences',
    templateUrl: './agences.component.html',
    styleUrls: ['./agences.component.scss'],
    imports: [RouterLink]
})
export class AgencesComponent {
  readonly features = [
    { icon: '📋', title: 'Tableau de bord agence', desc: 'Gérez vos agents, annonces et performances depuis un espace centralisé.' },
    { icon: '🏷️', title: 'Badge Pro Vérifié', desc: 'Obtenez le badge de confiance visible par tous les acheteurs sur le portail.' },
    { icon: '👥', title: 'Multi-agents', desc: '2 à 50 agents avec accès et droits personnalisés par profil.' },
    { icon: '📱', title: 'Application mobile dédiée', desc: "Continuez à gérer votre activité depuis l'application mobile Atlasia Pro." },
    { icon: '📊', title: 'Rapports automatiques', desc: 'Rapports hebdomadaires de performance envoyés automatiquement par email.' },
    { icon: '🔗', title: 'Intégration multi-portails', desc: 'Diffusez sur Mubawab, Avito et Atlasia en un clic.' },
  ];
}
