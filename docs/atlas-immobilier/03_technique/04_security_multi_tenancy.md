# Sécurité & Multi-tenancy (`org_id`) — implémentation Week 3

> **Statut**: Implémenté (AS-IS)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`

## Objectif
Garantir :
1) **Authentification** des appels API via JWT (Keycloak).
2) **Isolation stricte des données** par organisation (tenant) via `org_id`.

---

## 1) Authentification (JWT / Keycloak)

### Backend (Spring Security)
- Le backend protège **tous** les endpoints `/api/**` : un header `Authorization: Bearer <jwt>` est requis.
- Les endpoints non métiers restent accessibles sans authentification :
  - `/actuator/**`
  - `/swagger-ui/**`, `/swagger-ui.html`
  - `/api-docs/**`, `/v3/api-docs/**`

### Source d’autorités (rôles)
Le mapping des rôles côté backend supporte deux formes de claims JWT :

1) **Keycloak standard** : `realm_access.roles = ["PRO", "ADMIN", ...]`
2) Claim simplifié : `roles = ["PRO", "ADMIN", ...]` (utile pour tests/dev)

Les autorités Spring sont dérivées sous la forme `ROLE_<ROLE>`, par exemple :
- `ADMIN` → `ROLE_ADMIN`
- `PRO` → `ROLE_PRO`
- autre valeur → `ROLE_<VALUE_IN_UPPERCASE>`

### Mode tests / dev sans IdP
Pour faciliter les tests (et des exécutions locales contrôlées), le backend accepte un mode « mock decoder » si :
- `spring.security.oauth2.resourceserver.jwt.issuer-uri` est vide, ou
- `issuer-uri=mock`

Dans ce mode, n’importe quel token est accepté et un JWT minimal est construit avec un rôle `ADMIN` par défaut.
Cela **n’est pas** destiné à la production.

---

## 2) Multi-tenancy (`org_id`) — approche retenue

### Principe
- Le tenant est porté par un header HTTP **obligatoire** : `X-Org-Id: <ORG_ID>`.
- Ce tenant est propagé en `TenantContext` (ThreadLocal) durant la requête.
- Un filtre Hibernate (`orgIdFilter`) est activé automatiquement à chaque requête, ce qui garantit que **toutes les lectures** via Hibernate sont filtrées par `org_id`.

### Chaîne d’exécution (backend)
1) **TenantFilter** (Servlet Filter)
   - Lit `X-Org-Id`.
   - Si absent/vide → réponse **400** (pour `/api/**`).
   - Alimente `TenantContext.setOrgId(orgId)`.

2) **HibernateFilterInterceptor**
   - Sur ouverture de session, active le filtre `orgIdFilter` et injecte le paramètre `orgId`.
   - Désactive le filtre en fin de session si nécessaire.

3) **Entities**
   - Les entités persistées sont annotées avec `@Filter(name = "orgIdFilter", condition = "org_id = :orgId")`.
   - Les colonnes `org_id` sont **NOT NULL** (migrations SQL).

### Règles de sécurité multi-tenant
- **Le client ne fournit jamais `org_id` dans les DTOs de création** : le `org_id` est imposé côté serveur depuis `TenantContext`.
- Toute tentative d’accès à une ressource d’un autre tenant est traitée comme **non trouvée** (`404`) pour limiter l’énumération (principe d’anti-IDOR).
- Les contrôles « cross-tenant » sont couverts par des tests (création dans ORG1/ORG2 puis vérification d’isolation).

---

## 3) Côté Frontend (Angular)

### Stockage local
- Token JWT : stocké dans `localStorage` (clé `auth_token`).
- Org (tenant) : stocké dans `localStorage` (clé `org_id`).

### Injection automatique des headers
Un interceptor HTTP applique automatiquement, pour les URLs contenant `/api/` :
- `Authorization: Bearer <token>` si `auth_token` est présent
- `X-Org-Id: <org>` si `org_id` est présent

### Login actuel
Le front propose :
- un **login par collage de JWT** (ex: token Keycloak)
- des **tokens mock** pour développement (non valides côté Keycloak, mais utiles lorsque le backend est en `issuer-uri=mock`)

---

## 4) Obtenir un token Keycloak (local)

### Pré-requis
- Infra lancée via : `cd infra && docker compose up -d --build`
- Keycloak exposé sur le host : `http://localhost:8081`
- Realm importé : `myrealm`
- Client public : `atlas-frontend`
- Utilisateur de démo : `demo` (rôle realm `PRO`)

### Méthode A — Console Keycloak (standard flow)
- Se connecter à l’admin console Keycloak (admin/admin par défaut si non modifié).
- Utiliser l’interface pour authentifier l’utilisateur et récupérer un access token.

### Méthode B — Password grant (dev)
Exemple (adapter le mot de passe si besoin) :

```bash
curl -s \
  -d "client_id=atlas-frontend" \
  -d "grant_type=password" \
  -d "username=demo" \
  -d "password=demo" \
  "http://localhost:8081/realms/myrealm/protocol/openid-connect/token"
```

Copier `access_token` et le coller dans l’écran Login du front.

---

## 5) Points d’attention / limites connues
- `X-Org-Id` est une stratégie pragmatique pour le MVP : la trajectoire cible reste l’extraction d’orgId depuis le JWT (claim) lorsque l’IdP est stabilisé côté métier.
- Les entités « Advanced CRM » (messages/consentements/audit/appointments) existent côté modèle BD, mais les endpoints et l’UI sont planifiés sur les sprints suivants (voir `05_roadmap/`).
