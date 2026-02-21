# Smart Suggestions System

## Vue d'ensemble

Le système de suggestions intelligentes analyse le comportement utilisateur et le contexte des dossiers pour proposer des actions pertinentes (next-best-action). Il utilise du machine learning basique côté backend pour améliorer continuellement les suggestions basées sur les feedbacks utilisateurs.

## Fonctionnalités principales

### 1. Analyse comportementale
- **Tracking automatique** : Enregistre toutes les actions utilisateur (envoi email, création RDV, changement statut, etc.)
- **Patterns de fréquence** : Identifie les actions répétitives pour les suggérer proactivement
- **Score de confiance** : Calcule un score basé sur la récence et la fréquence d'utilisation

### 2. Suggestions contextuelles (Next-Best-Action)

#### Triggers basés sur le statut
- **Statut NEW** : Suggère de qualifier le prospect
- **Statut QUALIFIED** : Propose de planifier un rendez-vous
- **Statut QUALIFYING** : Recommande d'envoyer un email de suivi

#### Triggers basés sur l'inactivité
- **3 jours sans activité** : Suggestion de relance client (priorité 8)
- **7 jours sans activité** : Relance urgente (priorité 10)

#### Triggers basés sur les événements
- **Rendez-vous complété** : Suggère d'envoyer un message de suivi
- **Nouveau message reçu** : Rappelle de répondre rapidement
- **Date limite approchante** : Alerte pour action requise

### 3. Templates de messages pré-remplis

#### Catégories disponibles
- **FOLLOW_UP** : Messages de relance
- **APPOINTMENT** : Propositions de rendez-vous
- **QUALIFICATION** : Questions de qualification
- **URGENT** : Messages urgents
- **CLOSURE** : Messages de clôture

#### Variables dynamiques
Les templates supportent les variables suivantes :
- `{{leadName}}` : Nom du contact
- `{{leadPhone}}` : Téléphone du contact
- `{{leadEmail}}` : Email du contact
- `{{annonceTitle}}` : Titre de l'annonce
- `{{annonceCity}}` : Ville de l'annonce
- `{{proposedDate}}` : Date proposée

### 4. Machine Learning basique

#### Algorithme de scoring
```typescript
confidenceScore = (baseConfidence * 0.7) + (acceptanceRate * 0.3)

où:
- baseConfidence : Score initial de la suggestion (0.5 à 1.0)
- acceptanceRate : Taux d'acceptation historique de ce type de suggestion
```

#### Comportement adaptatif
```typescript
behaviorScore = (recencyScore * 0.6) + (frequencyScore * 0.4)

où:
- recencyScore : 1.0 si utilisé aujourd'hui, diminue jusqu'à 0 après 30 jours
- frequencyScore : 0 à 1.0 basé sur le nombre d'utilisations (max 20)
```

## Architecture Backend

### Entités

#### UserBehaviorPattern
```java
- userId: String
- actionType: String
- contextType: String
- contextId: Long
- frequencyCount: Integer
- lastPerformedAt: LocalDateTime
```

#### SuggestionTemplate
```java
- triggerCondition: String (ex: "DOSSIER_INACTIVE_3_DAYS")
- suggestionType: String
- title: String
- description: String
- actionType: String
- actionPayload: Map<String, Object>
- priority: Integer
- isActive: Boolean
```

#### MessageTemplate
```java
- name: String
- category: String (FOLLOW_UP, APPOINTMENT, etc.)
- channel: String (EMAIL, SMS, WHATSAPP)
- subject: String
- content: String
- variables: List<String>
- usageCount: Integer
```

#### SuggestionFeedback
```java
- userId: String
- suggestionType: String
- contextType: String
- contextId: Long
- wasAccepted: Boolean
- feedbackText: String
```

### Service Principal

```java
@Service
public class SmartSuggestionsService {
    // Analyse contextuelle
    List<SmartSuggestion> getSuggestionsForDossier(Long dossierId);
    
    // Tracking comportemental
    void trackBehavior(String actionType, String contextType, Long contextId);
    
    // Machine learning
    void submitFeedback(String suggestionType, Boolean wasAccepted, String feedbackText);
    
    // Templates
    List<MessageTemplate> getMessageTemplates(String category, String channel);
    PrefilledMessage getPrefilledMessage(Long templateId, Long dossierId);
}
```

## Architecture Frontend

### Services Angular

#### SmartSuggestionsApiService
Service bas niveau pour les appels HTTP :
```typescript
getSuggestionsForDossier(dossierId: number): Observable<SmartSuggestion[]>
trackBehavior(request: TrackBehaviorRequest): Observable<void>
submitFeedback(feedback: SuggestionFeedback): Observable<void>
getMessageTemplates(category?, channel?): Observable<MessageTemplate[]>
getPrefilledMessage(templateId, dossierId): Observable<PrefilledMessage>
```

#### SmartSuggestionsService
Service haut niveau avec cache et logique métier :
```typescript
// Suggestions avec cache (5 min TTL)
getSuggestionsForDossier(dossierId, forceRefresh?): Observable<SmartSuggestion[]>

// Tracking automatique
trackBehavior(actionType, contextType?, contextId?): void

// Actions sur suggestions
acceptSuggestion(suggestion, dossierId): void
dismissSuggestion(suggestion, dossierId, reason?): void

// Helpers UI
getSuggestionIcon(actionType): string
getSuggestionColor(priority): string
getConfidenceLabel(score): string
```

## API Endpoints

### GET `/api/v1/smart-suggestions/dossier/{dossierId}`
Retourne les suggestions contextuelles pour un dossier.

**Réponse:**
```json
[
  {
    "id": 1,
    "suggestionType": "FOLLOW_UP",
    "title": "Rappeler le client",
    "description": "Ce dossier est inactif depuis 3 jours",
    "actionType": "SEND_MESSAGE",
    "actionPayload": { "channel": "EMAIL" },
    "priority": 8,
    "confidenceScore": 0.85,
    "reason": "Inactif depuis 3 jours"
  }
]
```

### POST `/api/v1/smart-suggestions/track-behavior`
Enregistre une action utilisateur pour améliorer les suggestions futures.

**Corps:**
```json
{
  "actionType": "SEND_EMAIL",
  "contextType": "DOSSIER",
  "contextId": 123
}
```

### POST `/api/v1/smart-suggestions/feedback`
Soumet un feedback sur une suggestion (acceptée/rejetée).

**Corps:**
```json
{
  "suggestionType": "FOLLOW_UP",
  "contextType": "DOSSIER",
  "contextId": 123,
  "wasAccepted": true,
  "feedbackText": "Très pertinent"
}
```

### GET `/api/v1/smart-suggestions/message-templates`
Retourne les templates de messages filtrés par catégorie/canal.

**Paramètres:**
- `category` (optionnel) : FOLLOW_UP, APPOINTMENT, etc.
- `channel` (optionnel) : EMAIL, SMS, WHATSAPP

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "Relance après 3 jours",
    "category": "FOLLOW_UP",
    "channel": "EMAIL",
    "subject": "Suite à votre demande",
    "content": "Bonjour {{leadName}},\n\nJe reviens vers vous...",
    "variables": ["leadName", "annonceTitle"],
    "usageCount": 42
  }
]
```

### GET `/api/v1/smart-suggestions/message-templates/{templateId}/prefill`
Retourne un template avec les variables remplies depuis le contexte du dossier.

**Paramètres:**
- `dossierId` (requis) : ID du dossier pour le contexte

**Réponse:**
```json
{
  "templateId": 1,
  "templateName": "Relance après 3 jours",
  "channel": "EMAIL",
  "subject": "Suite à votre demande",
  "content": "Bonjour Jean Dupont,\n\nJe reviens vers vous concernant votre demande pour l'appartement à Paris..."
}
```

### POST `/api/v1/smart-suggestions/message-templates/{templateId}/use`
Incrémente le compteur d'utilisation d'un template (pour le ML).

## Utilisation dans l'interface

### Exemple d'intégration dans un composant

```typescript
export class DossierDetailComponent {
  suggestions$ = this.smartSuggestionsService.currentSuggestions$;
  
  constructor(
    private smartSuggestionsService: SmartSuggestionsService,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    const dossierId = +this.route.snapshot.paramMap.get('id')!;
    this.loadSuggestions(dossierId);
  }
  
  loadSuggestions(dossierId: number) {
    this.smartSuggestionsService
      .getSuggestionsForDossier(dossierId)
      .subscribe();
  }
  
  onSuggestionClick(suggestion: SmartSuggestion, dossierId: number) {
    this.smartSuggestionsService.acceptSuggestion(suggestion, dossierId);
    
    // Exécuter l'action suggérée
    switch (suggestion.actionType) {
      case 'SEND_MESSAGE':
        this.openMessageDialog(suggestion, dossierId);
        break;
      case 'CREATE_APPOINTMENT':
        this.openAppointmentDialog(dossierId);
        break;
      case 'UPDATE_STATUS':
        this.updateStatus(dossierId, suggestion.actionPayload?.targetStatus);
        break;
    }
  }
  
  onSuggestionDismiss(suggestion: SmartSuggestion, dossierId: number) {
    this.smartSuggestionsService.dismissSuggestion(
      suggestion, 
      dossierId, 
      'Non pertinent pour ce cas'
    );
  }
  
  async openMessageDialog(suggestion: SmartSuggestion, dossierId: number) {
    const templateId = suggestion.actionPayload?.templateId;
    
    if (templateId) {
      const prefilled = await firstValueFrom(
        this.smartSuggestionsService.getPrefilledMessage(templateId, dossierId)
      );
      
      // Ouvrir dialog avec contenu pré-rempli
      this.dialog.open(MessageDialogComponent, {
        data: {
          channel: prefilled.channel,
          subject: prefilled.subject,
          content: prefilled.content
        }
      });
    }
  }
}
```

### Template HTML

```html
<mat-card *ngFor="let suggestion of suggestions$ | async" class="suggestion-card">
  <mat-card-header>
    <mat-icon [color]="getSuggestionColor(suggestion.priority)">
      {{ getSuggestionIcon(suggestion.actionType) }}
    </mat-icon>
    <mat-card-title>{{ suggestion.title }}</mat-card-title>
    <mat-card-subtitle>
      {{ suggestion.description }}
      <span class="confidence-badge" *ngIf="suggestion.confidenceScore">
        {{ getConfidenceLabel(suggestion.confidenceScore) }}
      </span>
    </mat-card-subtitle>
  </mat-card-header>
  
  <mat-card-actions>
    <button mat-raised-button 
            [color]="getSuggestionColor(suggestion.priority)"
            (click)="onSuggestionClick(suggestion, dossierId)">
      Appliquer
    </button>
    <button mat-button (click)="onSuggestionDismiss(suggestion, dossierId)">
      Ignorer
    </button>
  </mat-card-actions>
  
  <mat-card-footer *ngIf="suggestion.reason">
    <small>{{ suggestion.reason }}</small>
  </mat-card-footer>
</mat-card>
```

## Base de données

### Tables créées (Migration V37)

1. **user_behavior_pattern** : Stocke les patterns comportementaux
2. **suggestion_template** : Définit les règles de suggestions
3. **message_template** : Templates de messages pré-remplis
4. **suggestion_feedback** : Feedbacks pour le machine learning

### Index de performance

- `idx_user_behavior_user_id` : Recherche rapide par utilisateur
- `idx_user_behavior_frequency` : Tri par fréquence d'utilisation
- `idx_suggestion_template_trigger` : Recherche par condition de déclenchement
- `idx_message_template_category` : Filtrage par catégorie
- `idx_suggestion_feedback_type` : Calcul des taux d'acceptation

## Configuration

### Templates par défaut

Le système est livré avec 5 templates de suggestions préconfigurés :
1. Relance après 3 jours d'inactivité
2. Planification RDV pour dossiers qualifiés
3. Qualification des nouveaux prospects
4. Relance urgente après 7 jours
5. Suivi post-rendez-vous

### Templates de messages par défaut

5 templates de messages sont fournis :
1. Relance après 3 jours (EMAIL)
2. Proposition de rendez-vous (EMAIL)
3. Relance urgente (SMS)
4. Suivi post-rendez-vous (EMAIL)
5. Première qualification (EMAIL)

### Personnalisation

Les templates peuvent être personnalisés via l'API ou directement dans la base de données. Pour ajouter un nouveau template de suggestion :

```sql
INSERT INTO suggestion_template (
  org_id, trigger_condition, suggestion_type, title, description, 
  action_type, action_payload, priority, is_active
) VALUES (
  'your_org_id', 
  'CUSTOM_TRIGGER', 
  'CUSTOM_ACTION', 
  'Titre de la suggestion',
  'Description détaillée',
  'SEND_MESSAGE',
  '{"channel": "SMS", "templateId": 3}',
  7,
  true
);
```

## Métriques et monitoring

Le système enregistre automatiquement :
- Nombre de suggestions générées
- Taux d'acceptation par type de suggestion
- Templates les plus utilisés
- Actions les plus fréquentes par utilisateur

Ces métriques peuvent être consultées via les tables `suggestion_feedback` et `user_behavior_pattern`.

## Évolutions futures

### Machine Learning avancé
- Modèle de régression pour prédire la probabilité de conversion
- Clustering des utilisateurs pour personnalisation groupée
- Apprentissage par renforcement basé sur les résultats business

### Suggestions supplémentaires
- Détection d'anomalies (prix inhabituels, délais anormaux)
- Prédiction du meilleur moment pour contacter
- Suggestions de cross-selling / up-selling
- Alertes proactives sur risques de perte

### Intégration IA
- Génération automatique de contenu email via GPT
- Analyse de sentiment des messages reçus
- Transcription et analyse des appels téléphoniques
- Recommandations de biens basées sur l'historique
