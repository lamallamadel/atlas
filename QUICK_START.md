# Guide de Démarrage Rapide (5 Minutes) 🚀

Bienvenue sur le projet **Atlas 2026** (Le Partenaire Cognitif Immobilier). 

L'architecture est composée de trois couches :
1. **Frontend (Angular)** : L'interface utilisateur "Calm & Mobile", connectée au système.
2. **Core Backend (Spring Boot Java 17)** : L'orchestrateur CRM gérant la base de données PostgreSQL, la sécurité Keycloak, l'Outbox Pattern et l'Audit.
3. **Brain Services (Python FastAPI)** : 4 microservices d'Intelligence Artificielle (*Match, Proposal, Nego, Agent*) + le service documentaire.

Ce guide vous permet de lancer l'intégralité de la grappe logicielle en une seule commande grâce à un script d'amorçage.

---

## Prérequis

Assurez-vous d'avoir installé les outils suivants sur votre machine de développement :
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (configuré et démarré)
- [Java 17 (JDK)](https://adoptium.net/) (vérifier avec `java -version`)
- [Node.js 18+](https://nodejs.org/) (vérifier avec `node -v` et `npm -v`)
- (Optionnel) [Maven 3.9+](https://maven.apache.org/) - *Nous utilisons le wrapper `mvnw` inclus, donc ce n'est pas strictement requis.*

---

## Étape 1 : Le Script Magique 🪄

Ouvrez un terminal **PowerShell** (en tant qu'Administrateur si Docker l'exige) à la racine du projet et lancez le script d'onboarding :

```powershell
.\scripts\dev-setup.ps1
```

**Que fait ce script ?**
1. Il lance la base de données **PostgreSQL**.
2. Il lance le serveur de logs combiné.
3. Il lance l'Identity Access Management **Keycloak** et importe automatiquement le royaume `myrealm` et les utilisateurs de test (ex: `demo`).
4. Il démarre les 5 microservices IA Python (`brain_*`).
5. Il compile et migre (Flyway) le backend **Spring Boot** sur le port `8080`.
6. Il installe les dépendances Node.js et démarre le **Frontend Angular** sur le port `4200`.

---

## Étape 2 : Identifiants de Connexion

Une fois que tout est vert, le Frontend est accessible à l'adresse logique. L'authentification OAuth2 (Keycloak) protège la plateforme.

*   🖥️ **URL Portail (App) :** [http://localhost:4200](http://localhost:4200)
*   🔑 **Utilisateur de test :** `demo`
*   🔓 **Mot de passe :** `demo`
*   🏢 **Multi-tenancy :** Par défaut, l'environnement injecte l'organisation `ORG-001`.

*Besoin d'accéder au backend en direct ?*
*   ⚙️ API Swagger (Backend) : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
*   🧠 API FastApi (Agent) : [http://localhost:8006/docs](http://localhost:8006/docs)
*   🔐 Console d'Admin Keycloak : [http://localhost:8081](http://localhost:8081) (`admin` / `admin`)

---

## Dépannage & Commandes Manuelles

Si le script rencontre un obstacle environnemental, voici les commandes équivalentes pour lancer l'infrastructure **manuellement**, étape par étape :

### 1. Démarrer l'infrastructure complète Docker (DB, Keycloak, Brain AI)
```bash
cd infra
docker-compose up -d postgres keycloak brain_match brain_proposal brain_nego brain_agent document_service
```

### 2. Démarrer le Backend (Core CRM)
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Démarrer le Frontend (Dashboard)
```bash
cd frontend
npm install
npm start
```

---
> 📚 **Pour aller plus loin** : Référez-vous à la documentation source : `docs/atlas-immobilier/README.md`
