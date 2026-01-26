# Tours Guidés - Référence Rapide

## 🚀 Démarrage Rapide

### Accès au menu d'aide
Cliquez sur l'icône **?** (help_outline) dans la barre de navigation supérieure.

### Tours disponibles
1. **Créer un dossier** - Guide de création de dossier
2. **Explorer un dossier** - Tour du détail de dossier
3. **Envoyer un message** - Guide d'envoi de message
4. **Changer le statut** - Workflow de statut

## 📍 Déclenchement Automatique

| Page | Tour | Condition |
|------|------|-----------|
| `/dossiers/create` | Création dossier | Première visite |
| `/dossiers/:id` | Détail dossier | Première visite |

**Délai :** 500ms après le chargement de la page

## 💾 Données Stockées (localStorage)

### Clés
- `onboarding_tour_progress` - État de complétion des tours
- `onboarding_tour_analytics` - Événements trackés (100 derniers)

### Réinitialisation
Menu d'aide → **Réinitialiser tous les guides**

## 🎨 Personnalisation

### Thème
Fichier : `frontend/src/styles/shepherd-theme.css`
- Support mode clair/sombre automatique
- Classe : `.shepherd-theme-custom`

### Sélecteurs CSS Principaux

**Création de dossier :**
```css
[formControlName="leadName"]
[formControlName="leadPhone"]
[formControlName="leadSource"]
.annonce-autocomplete
button[type="submit"]
```

**Détail de dossier :**
```css
.status-change-button
.update-status-button
.add-partie-button
.messages-tab
.appointments-section
.consentements-section
```

## 🔧 API Service

### Méthodes

```typescript
// Vérifier complétion
onboardingTourService.isTourCompleted('dossier-creation')

// Démarrer manuellement
onboardingTourService.startManualTour('dossier-creation')

// Réinitialiser
onboardingTourService.resetTour('dossier-creation')
onboardingTourService.resetAllTours()

// Analytics
const events = onboardingTourService.getAnalytics()

// Annuler tour en cours
onboardingTourService.cancelCurrentTour()
```

## 📊 Analytics Trackés

| Event | Description |
|-------|-------------|
| `started` | Tour démarré |
| `completed` | Tour terminé avec succès |
| `skipped` | Tour abandonné (X ou Passer) |
| `step_completed` | Étape franchie |

## 🔍 Dépannage Express

**Tour ne se lance pas :**
1. Vérifier localStorage → Réinitialiser si nécessaire
2. Vérifier console pour erreurs
3. Vérifier que les sélecteurs CSS existent

**Élément non trouvé :**
1. Augmenter le délai (500ms → 1000ms)
2. Vérifier que l'élément n'est pas dans un `*ngIf`
3. Utiliser un sélecteur plus spécifique

**Style incorrect :**
1. Vérifier import dans `angular.json`
2. Inspecter avec DevTools
3. Vérifier classe `.shepherd-theme-custom`

## 📦 Dépendances

```json
{
  "dependencies": {
    "shepherd.js": "^11.2.0"
  },
  "devDependencies": {
    "@types/shepherd.js": "^8.0.0"
  }
}
```

## 📝 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `services/onboarding-tour.service.ts` | Service principal |
| `styles/shepherd-theme.css` | Thème personnalisé |
| `layout/app-layout/app-layout.component.*` | Menu d'aide |
| `ONBOARDING_TOURS.md` | Documentation complète |

## 🎯 Points Clés

✅ Déclenchement automatique au premier accès  
✅ Stockage progression dans localStorage  
✅ Tracking analytics des événements  
✅ 4 tours complets couvrant les fonctionnalités principales  
✅ Support mode clair/sombre  
✅ Responsive mobile  
✅ Accessible (ARIA, clavier)  

## 🚦 Étapes pour Ajouter un Nouveau Tour

1. **Créer la méthode** dans `onboarding-tour.service.ts`
2. **Ajouter les sélecteurs CSS** aux templates
3. **Configurer auto-start** dans `checkAutoStartTour()` (optionnel)
4. **Ajouter au menu** dans `app-layout.component.html`
5. **Tester** en réinitialisant la progression

---

📚 **Documentation complète :** `frontend/ONBOARDING_TOURS.md`  
📋 **Résumé implémentation :** `frontend/ONBOARDING_IMPLEMENTATION_SUMMARY.md`
