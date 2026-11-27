# Changelog — v0.14-donnees-demo-2026-11-27

Données de démonstration métier et comptes démo (`03_technique/18_donnees_demo.md`).
- Seed `db/demo/demo-seed.sql` (PostgreSQL et H2), chargé une fois au démarrage en profil `dev` par `DemoSeedLoader` (`atlas.demo.seed-enabled`) : 10 agences (directeur, manager, 2 agents ; une non vérifiée), 10 propriétaires, 20 biens en vente et en location à Tanger, Casablanca, Rabat et Marrakech, annonces de particuliers, bourse, demandes directes, 9 mandats (à signer, actifs, terminés, résiliés), offres, avis, 54 dossiers, visites, tâches et notifications. ORG-001 et les données E2E ne changent pas.
- Comptes démo sur `/login` (hors build de production) : jeton `mock-demo-…` dont le backend reprend `sub`, rôles et `org_id`, en mode mock uniquement.
- Générateur `scripts/demo/gen_demo_seed.py` (seed et liste des comptes du front).
- Correctif : la bourse et les recommandations répondaient 500 pour toute agence sans réglages (`organization_settings`) : la lecture du quota marquait la transaction en échec.
- Correctif : la progression des visites guidées était enregistrée sous un identifiant commun (`demo-user`) pour tous les utilisateurs, et synchronisée sans jeton avant la connexion.
- Les erreurs 500 inattendues sont maintenant journalisées (`GlobalExceptionHandler`).

# Changelog — v0.13-uc-proprietaire-offres-2026-11-26

Cas d'usage n°1, compléments du lot C : alertes aux agences, offres, note de l'agence.
- Alertes aux agences (`AgencyAlert`) : à l'ouverture d'une demande, les 10 agences les plus pertinentes ; l'agence invitée par le propriétaire ; l'agence d'une demande directe, puis un rappel à 48 h sans réponse (le propriétaire est prévenu à 72 h). Elles vont aux administrateurs et managers de l'agence (annuaire Keycloak, sinon tous les membres actifs), dans l'espace Pro et par e-mail.
- Offres : l'agence mandatée transmet l'offre d'un acquéreur anonyme (montant, profil, conditions, validité) depuis le dialogue du mandat ; le propriétaire l'accepte, la refuse ou fait une contre-proposition depuis `/proprietaire/mandats/{id}`. Dossier de l'agence `CRM_OFFER_RECEIVED` puis `CRM_NEGOTIATION`, décisions tracées en note interne, agent prévenu. Une seule offre acceptée à la fois.
- Alertes WhatsApp du propriétaire sur un mandat : lien `<site>/p/m<id>` vers le suivi du mandat.
- Profil de l'agence `/pro/mandats/profil` : note moyenne et 20 derniers avis.
- Migration V169 : `mandate_offer`.

# Changelog — v0.12-uc-proprietaire-suivi-2026-11-26

Cas d'usage n°1, lot C : matching et suivi du mandat (§ 5, UC-P8, UC-P9, critères PC-1 à PC-4).
- Score de pertinence des agences pour une demande (zone, spécialité, historique, réactivité, avis, acquéreurs compatibles ; valeurs neutres pour une agence de moins de 3 mois) ; filtres stricts : vérifiée, module actif, quota restant, zone, transaction et type de bien.
- Propriétaire : « Agences recommandées » (5) et « Inviter » (5 au plus) sur la page de la demande ; note des agences dans l'annuaire et sur les propositions ; suivi `/proprietaire/mandats/{id}` (événements marqués visibles, annonces de l'agence et contacts) ; « Terminer le mandat » avec motif ; avis une fois après un mandat signé et terminé ; « Faire vérifier le bien ».
- Agence : bourse triée (invitations, puis pertinence), colonne « Pertinence », badge « Invitée » ; fiche de la demande avec le nombre d'acquéreurs compatibles de l'agence et les badges de vérification ; « Terminer le mandat » avec motif dans le dialogue du mandat.
- Plateforme : file « Titres fonciers à contrôler » et vérification des propriétaires dans `/pro/moderation` ; quota `quotas.maxMandateProposalsMonth` par organisation.
- Fin de mandat : dossier de l'agence clos (gagné ou perdu), annonces de l'agence suspendues (`MANDATE_ENDED`) ; `CRM_CLOSED_WON` sur le dossier termine le mandat.
- Alertes : mandat bientôt échu (J-15) aux deux parties ; demande sans proposition après 48 h au propriétaire.
- Portail : badge « Bien vérifié » sur la fiche annonce.
- Migration V168 : `mandate_invitation`, `agency_review`, `mandate.ended_by`, `mandate.expiry_alerted_at`, `mandate_request.idle_alerted_at`.

# Changelog — v0.11-uc-proprietaire-bourse-2026-11-26

Cas d'usage n°1, lot B : bourse aux mandats (UC-P5 à UC-P7, critères PB-1 à PB-8).
- Propriétaire : « Demander des propositions » (toutes les agences vérifiées de la ville, ou une agence de l'annuaire), comparaison des propositions, échanges, acceptation confirmée par code.
- Agence : `/pro/mandats` (bourse de ses zones, demandes directes, propositions, mandats), fiche anonymisée, proposition, mandat obtenu avec coordonnées, signature déclarée, annonce du bien liée au mandat ; profil public et zones `/pro/mandats/profil`.
- Plateforme : vérification des agences par le super-admin ; module `module.mandate_marketplace`.
- Coordonnées masquées dans les messages tant que la proposition n'est pas acceptée (téléphones de 9 chiffres ou plus, e-mails, liens WhatsApp et Telegram).
- Exclusif : annonce du propriétaire suspendue (`MANDATE_EXCLUSIVE`), redirection 301 vers l'annonce de l'agence, plus de nouvelle demande. Simple : une seule fiche portail pour le bien, avec la liste des annonceurs.
- Nouveau type de dossier `CRM_MANDATE_SALE` / `CRM_MANDATE_RENT` et statuts `CRM_MANDATE_PENDING`, `CRM_MANDATE_SIGNED`, `CRM_LISTED`, `CRM_COMPROMISE_SIGNED`.
- Alertes WhatsApp du propriétaire : un seul modèle, bouton `<site>/p/{{1}}` (`c<id>` contact, `d<id>` demande) — remplace l'URL `/proprietaire/contacts/{{1}}` du lot A.
- Migration V167 : `agency_profile`, `agency_zone`, `mandate_request`, `mandate_proposal`, `marketplace_message`, `mandate`, `annonce.mandate_id`.

# Changelog — v0.10-uc-proprietaire-messagerie-2026-11-25

Cas d'usage n°1, lot A terminé : échanges propriétaire ↔ prospect et visites (UC-P4, critère PA-5).
- Alerte au propriétaire à chaque nouveau contact, puis à chaque message ou visite choisie.
- Fiche contact `/proprietaire/contacts/{id}` : fil d'échanges, réponse, créneaux de visite (1 à 3), annulation.
- Page du prospect `/contact/{jeton}`, sans compte : lire, répondre, choisir un créneau ; lien valable 60 jours, jeton haché en base.
- Alertes par la plateforme : WhatsApp (modèles `OWNER_ALERT_WHATSAPP_TEMPLATE`, `PROSPECT_ALERT_WHATSAPP_TEMPLATE`), sinon e-mail, sinon SMS, après validation de la transaction.
- Migration V166 : `lead_conversation`, `lead_conversation_link`, `visit_proposal`.

# Changelog — v0.9-uc-proprietaire-lot-a-2026-11-25

Cas d'usage n°1, lot A livré : le propriétaire publie seul (spec 13, critères PA-1 à PA-4).
- Inscription `/proprietaire/inscription` : code à 6 chiffres (WhatsApp, SMS en secours), mot de passe, connexion avec le numéro de téléphone ; un numéro = un compte.
- Rôle `OWNER` et organisation personnelle (`organization`, V163) ; biens (`property`, V164) ; codes de vérification (`phone_verification`, V165).
- Annonce du propriétaire : première annonce en modération a priori, publiée ensuite directement si le score de fraude est bas ; file de modération `/pro/moderation` (super-admin).
- Espace `/proprietaire` : biens, annonce, photos, publication, contacts reçus avec statuts simplifiés (Nouveau, En contact, Visite prévue, Conclu, Sans suite).
- Portail : badge « Particulier », photos servies aux visiteurs non connectés.
- Décisions Q5 (WhatsApp + SMS) et Q6 (modération par l'équipe Atlas) appliquées par défaut.

# Changelog — v0.8-uc-proprietaire-2026-11-25

Cas d'usage n°1 : le propriétaire publie seul ou confie son bien à un agent (spec TO-BE, à valider avant code).
- `02_fonctionnel/13_uc_proprietaire_mandats.md` : parcours UC-P1 à UC-P9, matching, règles R-PROP-01 à 16, modèle, API, écrans, lots A/B/C et critères d'acceptation, décisions Q1 à Q4 (propriétaire ↔ agent avant publication, demande directe, bourse gratuite avec quota, messagerie + alerte WhatsApp, indépendants admis), questions Q5 à Q8 ouvertes.
- `docs/adr/0005` : une organisation par propriétaire ; mandat et bien (`property`) comme objets inter-organisations.
- Intégré dans : personas, glossaire, nomenclature (§ 10 bis), règles métier (§ 8), feature flags (`module.mandate_marketplace`), RBAC (rôle `OWNER`), backlog (étapes 8 à 10).
- Backlog : étapes 2 à 7 marquées faites.

# Changelog — v0.7-docs-realigned-2026-11-23

Relecture des specs contre le code de `master` (commit `6c3db9ad`).
- `05_roadmap/00_etat_avancement_mvp.md` réécrit depuis le code : stack réelle, sites et routes, AS-IS par domaine, modules livrés hors spec, écarts bloquants.
- `05_roadmap/02_backlog_mvp_execution.md` : nouvel ordre de travail (leads multi-agences, publication gouvernée, signalements, rôles d’agence).
- `02_fonctionnel/02_regles_metier.md` §2 : règles de consentement réelles (MARKETING en opt-in double, TRANSACTIONNEL, réponse dans la fenêtre WhatsApp de 24 h, lien de consentement).
- WhatsApp : l’API WhatsApp Cloud de Meta remplace Twilio dans la doc (Twilio reste pour les SMS).
- Codes : `CRM_LEAD_B2B_DEMO` unifié, raisons de perte B2B alignées sur la nomenclature, sources de lead sans préfixe (comme en base), résultats de RDV corrigés.
- Coop Habitat : statut « backend seul ». Branding : état actuel `afroware.app` + routes `/`, `/biz`, `/pro`.
- `docs/implementations_archive/` déplacé dans `docs/archive/implementations/` ; liens morts vers des fichiers supprimés corrigés.
- `CLAUDE.md` : Angular 21, prochaine migration V157.

# Changelog — v0.4-week3-2026-01-04

> **Statut**: Historique  
> **Dernière vérification**: 2026-01-10  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/README.md`

## Week 3 — Sécurité + multi-tenancy (implémenté)
- Ajout **Keycloak** dans `infra/docker-compose.yml` + import automatique du realm (`myrealm`) et utilisateur de démonstration.
- Backend : **OAuth2 Resource Server (JWT)** + mapping de rôles depuis `realm_access.roles` (Keycloak) ou `roles`.
- Sécurisation des endpoints `'/api/**'` (actuator + swagger autorisés).
- Multi-tenancy : header `X-Org-Id` obligatoire sur les endpoints API + `TenantContext` + filtre Hibernate `orgIdFilter` activé à chaque requête.
- Tests : couverture des cas `401`/`403`, validation du `TenantFilter` et tests d’isolation cross-tenant sur services Annonce/Dossier.
- Frontend : interceptor HTTP ajoutant `Authorization: Bearer <token>` + `X-Org-Id` (depuis `localStorage`) + écran de login par token (dev).

## Points restant « Advanced CRM » (spécification prête, implémentation à venir)
- Endpoints + UI : **messages**, **consentements**, **audit read-only**, **appointments**, **workflow transitions**.
- E2E Playwright (parcours critiques) + durcissement CI.

---

# Changelog — v0.3-advanced-crm-2026-01-03

## Ajouts (Advanced CRM)
- Messagerie & timeline d’activité (EMAIL/SMS/PHONE/WHATSAPP, entrant/sortant).
- Audit logging automatique via listeners JPA (`@PostPersist/@PostUpdate/@PreRemove`) avec diffs JSON avant/après.
- Consentement RGPD par canal (opt-in/opt-out) + règles bloquantes de communication.
- Multi-tenancy `org_id` : filtrage systématique en lecture/écriture + contrôles Spring Security.
- Workflow Dossier (machine à états) + endpoint des transitions autorisées.
- Recherche & reporting (PostgreSQL full-text + KPIs).
- Notifications (email/SMS) avec templates + dispatch async.
- Stratégie de tests (Testcontainers + Playwright) et objectifs de couverture.

## Correctifs FE (tests unitaires)
- `DashboardKpiService` : ajout de `HttpClientTestingModule` dans le spec (provider `HttpClient` manquant).
- `GenericTableComponent` : alignement des attentes booléennes sur la locale FR (`Oui/Non` au lieu de `Yes/No`).
- `DossiersComponent` : enregistrement de la locale `fr` (`registerLocaleData(localeFr)`) + `LOCALE_ID=fr-FR` pour éviter l’erreur `Missing locale data "fr-FR"`.

## v0.6-docs-market-ready — 2026-01-07

- Harmonisation documentation selon 4 règles de cohérence (source of truth, encart statut, AS-IS vs TO-BE, enums → référentiels).
- Ajout des spécifications “référentiels + workflows modulables” (multi-métiers immobilier).
- Mise à jour notifications/outbound selon **Choix B** : WhatsApp Outbound réel (provider, templates, outbox, retry, monitoring) + consentement strict.

## 2026-01-10 — MVP “3 sites” (Portail + Biz + Pro)

Ajouts post `docs_merged_normalized` :
- Spécification Portail d’annonces (`atlasia.ma`) + URLs/SEO.
- Spécification site vitrine B2B (`biz.atlasia.ma`) + formulaire démo.
- Workflow B2B Demo (statuts/transitions + lost reasons) pour `CRM_LEAD_B2B_DEMO`.
- Contrat API Pro pour dossiers B2B Demo.
- Spécification UI Pro (Kanban/Liste/Détail) B2B Demo.
- Spécification UI Pro Publications / Listings.
- Contrat API Pro Listings (CRUD, médias, transitions, trust, reports).
- Acceptance Criteria E2E (Portail + Biz + Pro).

## Documentation — 2026-01-10
- Ajout de la page unique **Arborescence & déploiement (MVP)** : `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`


## Documentation — 2026-01-11
- Ajout de la spécification **Biz — SEO & Tracking (MVP)** : `docs/atlas-immobilier/02_fonctionnel/11_biz_seo_tracking.md`

- Ajout du document **MVP — Scope Freeze** : `docs/atlas-immobilier/01_cadrage/05_mvp_scope_freeze.md`
- Ajout du document **Référentiel — Freeze MVP** : `docs/atlas-immobilier/02_fonctionnel/12_referential_freeze_mvp.md`

- Ajout du document **API Public — Portail & Biz (MVP)** : `docs/atlas-immobilier/03_technique/15_api_public_portal_biz.md`
- Ajout du document **Modèle de données — MVP (DB Schema)** : `docs/atlas-immobilier/03_technique/16_db_mvp_schema.md`
- Ajout du document **Runbook — Dev & Déploiement (MVP)** : `docs/atlas-immobilier/03_technique/17_runbook_dev_deploy_mvp.md`
- Ajout du document **Backlog — Exécution MVP** : `docs/atlas-immobilier/05_roadmap/02_backlog_mvp_execution.md`