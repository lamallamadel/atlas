# Onboarding Tours - Guide Utilisateur

## Vue d'ensemble

Le système de tours guidés interactifs utilise **Shepherd.js** pour offrir une expérience d'onboarding contextualisée aux utilisateurs de l'application. Les tours sont déclenchés automatiquement lors de la première visite d'une page, ou peuvent être lancés manuellement via le menu d'aide.

## Tours disponibles

### 1. Création de dossier (`dossier-creation`)
**Déclenchement automatique :** Première visite sur `/dossiers/create`

**Étapes :**
1. Introduction à la création de dossier
2. Champ "Nom du prospect"
3. Champ "Téléphone du prospect" (avec info sur détection des doublons)
4. Champ "Source du lead"
5. Association avec une annonce
6. Bouton de soumission

**Durée estimée :** 2-3 minutes

### 2. Détail du dossier (`dossier-detail`)
**Déclenchement automatique :** Première visite sur `/dossiers/:id`

**Étapes :**
1. Vue d'ensemble de la page de détail
2. Gestion du workflow de statut
3. Section des parties prenantes
4. Onglet de messagerie
5. Section des rendez-vous
6. Gestion des consentements RGPD

**Durée estimée :** 3-4 minutes

### 3. Envoi de message (`message-creation`)
**Déclenchement :** Manuel uniquement (via menu d'aide)

**Étapes :**
1. Introduction aux canaux de communication
2. Sélection du canal
3. Rédaction du contenu
4. Envoi du message

**Durée estimée :** 1-2 minutes

### 4. Changement de statut workflow (`workflow-status`)
**Déclenchement :** Manuel uniquement (via menu d'aide)

**Étapes :**
1. Introduction au workflow
2. Sélection du statut avec explication du workflow linéaire
3. Avertissement sur les états terminaux
4. Enregistrement du changement

**Durée estimée :** 1-2 minutes

## Accès aux tours

### Menu d'aide (icône "?")
Dans la barre de navigation supérieure, cliquez sur l'icône **help_outline** (?) pour accéder au menu d'aide qui propose :

- **Créer un dossier** : Lance le tour de création de dossier
- **Explorer un dossier** : Lance le tour du détail de dossier (uniquement si vous êtes sur une page de détail)
- **Envoyer un message** : Lance le tour d'envoi de message
- **Changer le statut** : Lance le tour de workflow
- **Réinitialiser tous les guides** : Efface la progression et permet de revoir tous les tours

## Stockage et progression

### localStorage
La progression des tours est stockée dans `localStorage` avec la clé `onboarding_tour_progress` :

```json
{
  "dossier-creation": {
    "completed": true,
    "completedAt": "2024-01-15T10:30:00Z"
  },
  "dossier-detail": {
    "completed": false,
    "skipped": true
  }
}
```

### Analytics
Les événements suivants sont trackés dans `localStorage` sous la clé `onboarding_tour_analytics` :

- `started` : Tour démarré
- `completed` : Tour complété avec succès
- `skipped` : Tour abandonné/passé
- `step_completed` : Étape individuelle complétée

**Format :**
```json
[
  {
    "tourId": "dossier-creation",
    "action": "started",
    "timestamp": "2024-01-15T10:25:00Z"
  },
  {
    "tourId": "dossier-creation",
    "action": "step_completed",
    "step": 1,
    "timestamp": "2024-01-15T10:25:30Z"
  }
]
```

**Limite :** Les 100 derniers événements sont conservés.

## Comportement

### Déclenchement automatique
- Les tours sont automatiquement lancés lors de la **première visite** d'une page
- Un délai de 500ms est appliqué pour laisser le temps au DOM de se charger
- Si un tour est déjà complété, il ne se déclenche plus automatiquement

### Navigation durant le tour
- L'utilisateur peut quitter un tour à tout moment via le bouton "X" ou "Passer"
- Si abandonné, le tour peut être relancé manuellement
- Les tours peuvent être réinitialisés via le menu d'aide

### Interactivité
- **Overlay modal** : Assombrit le reste de la page pour mettre en valeur l'élément ciblé
- **Spotlight** : Met en évidence l'élément concerné par l'étape
- **Scroll automatique** : La page défile pour centrer l'élément ciblé
- **Navigation** : Boutons "Précédent", "Suivant", "Terminer"

## Personnalisation

### Thème
Le thème personnalisé est défini dans `frontend/src/styles/shepherd-theme.css` :
- Support du mode clair et sombre
- Animations d'apparition
- Style Material Design cohérent avec l'application

### Sélecteurs CSS
Les tours ciblent des éléments via des sélecteurs CSS spécifiques :

| Élément | Sélecteur | Tour |
|---------|-----------|------|
| Champ nom prospect | `[formControlName="leadName"]` | dossier-creation |
| Champ téléphone | `[formControlName="leadPhone"]` | dossier-creation |
| Champ source | `[formControlName="leadSource"]` | dossier-creation |
| Autocomplete annonce | `.annonce-autocomplete` | dossier-creation |
| Bouton submit | `button[type="submit"]` | dossier-creation |
| Bouton changement statut | `.status-change-button` | dossier-detail |
| Select statut | `[formControlName="status"]` | workflow-status |
| Bouton update statut | `.update-status-button` | workflow-status |
| Bouton ajouter partie | `.add-partie-button` | dossier-detail |
| Onglet messages | `.messages-tab` | dossier-detail |
| Section rendez-vous | `.appointments-section` | dossier-detail |
| Section consentements | `.consentements-section` | dossier-detail |

## API du service

### `OnboardingTourService`

#### Méthodes publiques

```typescript
// Vérifier si un tour est complété
isTourCompleted(tourId: string): boolean

// Réinitialiser un tour spécifique
resetTour(tourId: string): void

// Réinitialiser tous les tours
resetAllTours(): void

// Obtenir les analytics
getAnalytics(): TourAnalytics[]

// Démarrer un tour manuellement
startManualTour(tourId: 'dossier-creation' | 'dossier-detail' | 'message-creation' | 'workflow-status'): void

// Annuler le tour en cours
cancelCurrentTour(): void
```

#### Démarrage automatique

Le service écoute les événements de navigation et déclenche automatiquement les tours selon l'URL :

- `/dossiers/create` → `dossier-creation`
- `/dossiers/:id` → `dossier-detail`

## Maintenance

### Ajouter un nouveau tour

1. **Définir les étapes** dans `OnboardingTourService` :
```typescript
startMyNewTour(): void {
  const tourId = 'my-new-tour';
  
  if (this.isTourCompleted(tourId)) {
    return;
  }

  const tour = this.createTour(tourId);

  tour.addStep({
    id: 'step-1',
    title: 'Mon titre',
    text: '<p>Description de l\'étape</p>',
    attachTo: {
      element: '.my-selector',
      on: 'bottom'
    },
    buttons: [
      { text: 'Passer', action: tour.cancel, secondary: true },
      { text: 'Suivant', action: tour.next }
    ]
  });

  tour.start();
}
```

2. **Ajouter les sélecteurs CSS** aux templates concernés
3. **Configurer le déclenchement automatique** dans `checkAutoStartTour()` si nécessaire
4. **Ajouter l'option** dans le menu d'aide (`app-layout.component.html`)

### Modifier un tour existant

1. Localiser la méthode dans `onboarding-tour.service.ts`
2. Modifier les étapes existantes ou en ajouter de nouvelles
3. Tester le tour en réinitialisant sa progression

### Dépannage

**Le tour ne se déclenche pas :**
- Vérifier que le tour n'est pas marqué comme complété dans localStorage
- Vérifier que les sélecteurs CSS existent dans le DOM
- Vérifier la console pour les erreurs JavaScript

**Élément non trouvé :**
- S'assurer que le délai de 500ms est suffisant pour le chargement du DOM
- Utiliser des sélecteurs plus spécifiques
- Vérifier que l'élément est visible (pas masqué par un `*ngIf`)

**Style incorrect :**
- Vérifier que `shepherd-theme.css` est bien importé dans `angular.json`
- Vérifier la classe `shepherd-theme-custom` sur les steps
- Inspecter les styles avec les DevTools

## Ressources

- [Documentation Shepherd.js](https://shepherdjs.dev/)
- [GitHub Shepherd.js](https://github.com/shepherd-pro/shepherd)
- Service : `frontend/src/app/services/onboarding-tour.service.ts`
- Styles : `frontend/src/styles/shepherd-theme.css`
- Menu d'aide : `frontend/src/app/layout/app-layout/app-layout.component.html`
