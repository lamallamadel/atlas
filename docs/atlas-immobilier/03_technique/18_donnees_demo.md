# Données de démonstration

Un jeu de données métier complet pour présenter Atlas ou tester un parcours à la main : 10 agences avec leurs équipes, 10 propriétaires, 20 biens en vente et en location à Tanger, Casablanca, Rabat et Marrakech, et tout le cycle propriétaire → agence (annonces de particuliers, bourse aux mandats, mandats, offres, avis). Chaque compte se connecte en un clic depuis la page de connexion.

Fichiers :

| Fichier | Rôle |
| --- | --- |
| `backend/src/main/resources/db/demo/demo-seed.sql` | Le jeu de données (PostgreSQL et H2) |
| `backend/.../loader/DemoSeedLoader.java` | Le charge au démarrage en profil `dev` |
| `frontend/src/app/pages/login/demo-accounts.ts` | Les comptes proposés sur la page de connexion |
| `scripts/demo/gen_demo_seed.py` | Génère les deux fichiers précédents |

## Charger les données

**Stack locale** (`infra/docker-compose.local.yml`, profils `h2,local,dev`) : rien à faire. Au démarrage, `DemoSeedLoader` passe après `SeedDataLoader` (ORG-001/ORG-002) et charge le seed une seule fois. S'il trouve l'organisation `DEMO-DETROIT`, il ne fait rien. En cas d'erreur, la transaction est annulée et l'erreur est journalisée ; l'application démarre quand même.

Pour repartir de zéro :

```powershell
cd infra
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d
```

Pour ne pas charger les données : `atlas.demo.seed-enabled=false` (variable d'environnement `ATLAS_DEMO_SEEDENABLED=false`).

**PostgreSQL à la main** (base migrée par Flyway, données démo absentes) :

```powershell
psql -d atlas -1 -v ON_ERROR_STOP=1 -f backend/src/main/resources/db/demo/demo-seed.sql
```

Les colonnes JSON sont marquées `/*json*/` : PostgreSQL ignore ce commentaire. Sous H2, le chargeur le remplace par `FORMAT JSON`. Un script copié dans la console H2 doit subir le même remplacement ; sinon le JSON est enregistré comme une chaîne.

Le seed n'écrit jamais d'identifiant : les clés étrangères sont résolues par sous-requêtes sur des clés naturelles (organisation, titre, numéro de téléphone), et les séquences restent intactes. Les dates sont relatives (`CURRENT_TIMESTAMP - INTERVAL 'N' DAY`) : une base chargée aujourd'hui a des demandes ouvertes « il y a 2 jours », des échéances « dans 10 jours », etc.

Le seed ne touche pas aux organisations existantes (ORG-001, ORG-002, `default`) ni aux données E2E.

## Se connecter

Page `/login`, bloc **Comptes démo**, visible hors build de production. Il contient cinq boutons rapides (agent, manager et directeur de l'Agence du Détroit, propriétaire Nadia I., super-admin), plus une liste de tous les comptes. Le propriétaire arrive sur `/proprietaire`, le super-admin sur `/pro/moderation`, les autres sur le tableau de bord.

Le bouton fabrique un jeton `mock-demo-<en-tête base64url>.<charge base64url>.demo`. La charge porte `sub`, `roles`, `org_id`, `name`, `email`. Le backend ne l'accepte qu'**en mode mock** (`issuer-uri` vide ou `mock`) : avec Keycloak, il est rejeté comme n'importe quel jeton invalide. Seuls `sub`, `roles`, `org_id`, `name`, `given_name`, `family_name`, `preferred_username`, `email` et `phone_number` sont repris ; le jeton expire 8 h après l'appel. Les anciens boutons « Mock User » / « Mock Admin » (ORG-001) sont inchangés.

### Agences

Organisations `DEMO-*`. Chaque agence a un directeur (`ADMIN`), un manager (`MANAGER`) et deux agents (`AGENT`). Les e-mails sont de la forme `prenom.nom@<agence>.demo`. Toutes sont vérifiées sauf **Kech Immo Nouvelle**, qui montre le refus d'accès à la bourse (403 `AGENCY_NOT_VERIFIED`). **Atlantic Habitat** a un quota de 5 propositions par mois ; les autres gardent le quota par défaut.

| Agence | Comptes |
| --- | --- |
| Plateforme (`DEMO-PLATFORM`) | Super-admin Atlas : Équipe Atlas (`demo-superadmin`) |
| Agence du Détroit (`DEMO-DETROIT`) | Directeur : Hassan Amrani (`demo-detroit-directeur`) ; Manager : Samira Bennis (`demo-detroit-manager`) ; Agent : Yassine Alaoui (`demo-detroit-agent1`) ; Agent : Imane Zerouali (`demo-detroit-agent2`) |
| Tanger Immo Conseil (`DEMO-TANGERIMMO`) | Directeur : Mustapha El Khattabi (`demo-tangerimmo-directeur`) ; Manager : Khadija Ouazzani (`demo-tangerimmo-manager`) ; Agent : Anas Bakkali (`demo-tangerimmo-agent1`) ; Agent : Houda Rifi (`demo-tangerimmo-agent2`) |
| Iberia Habitat (`DEMO-IBERIA`) | Directeur : Driss Benmoussa (`demo-iberia-directeur`) ; Manager : Najat El Amrani (`demo-iberia-manager`) ; Agent : Mehdi Ouahbi (`demo-iberia-agent1`) ; Agent : Sara Tahiri (`demo-iberia-agent2`) |
| Casa Prestige Immobilier (`DEMO-CASAPRESTIGE`) | Directeur : Kamal Lazrak (`demo-casaprestige-directeur`) ; Manager : Ghita Benkirane (`demo-casaprestige-manager`) ; Agent : Adil Sqalli (`demo-casaprestige-agent1`) ; Agent : Nour Berrada (`demo-casaprestige-agent2`) |
| Maârif Immo (`DEMO-MAARIF`) | Directeur : Abdelaziz Hajji (`demo-maarif-directeur`) ; Manager : Siham Mernissi (`demo-maarif-manager`) ; Agent : Reda Chami (`demo-maarif-agent1`) ; Agent : Loubna Kettani (`demo-maarif-agent2`) |
| Atlantic Habitat (`DEMO-ATLANTIC`) | Directeur : Jamal Bouzid (`demo-atlantic-directeur`) ; Manager : Asmae Filali (`demo-atlantic-manager`) ; Agent : Othmane Naciri (`demo-atlantic-agent1`) ; Agent : Kenza Belhaj (`demo-atlantic-agent2`) |
| Rabat Agdal Immobilier (`DEMO-AGDAL`) | Directeur : Noureddine Squalli (`demo-agdal-directeur`) ; Manager : Hanane Benabdellah (`demo-agdal-manager`) ; Agent : Ilyas Guessous (`demo-agdal-agent1`) ; Agent : Zineb Ammor (`demo-agdal-agent2`) |
| Souissi Prestige (`DEMO-SOUISSI`) | Directeur : Mohamed Bennouna (`demo-souissi-directeur`) ; Manager : Rim Lamrani (`demo-souissi-manager`) ; Agent : Hamza Skalli (`demo-souissi-agent1`) ; Agent : Aya Cherkaoui (`demo-souissi-agent2`) |
| Marrakech Palmeraie Immo (`DEMO-PALMERAIE`) | Directeur : Abdellah Ouarzazi (`demo-palmeraie-directeur`) ; Manager : Fadwa Tounsi (`demo-palmeraie-manager`) ; Agent : Ismail Marrakchi (`demo-palmeraie-agent1`) ; Agent : Salma Haddaoui (`demo-palmeraie-agent2`) |
| Kech Immo Nouvelle (`DEMO-KECH`) | Directeur : Youness Ait Lahcen (`demo-kech-directeur`) ; Manager : Wiam Chafik (`demo-kech-manager`) ; Agent : Saad Amzil (`demo-kech-agent1`) ; Agent : Oumaima Ennaji (`demo-kech-agent2`) |

Le super-admin a les rôles `SUPER_ADMIN` et `ADMIN` sur l'organisation plateforme `DEMO-PLATFORM` : il voit la modération, la vérification des comptes et des titres fonciers, et l'espace Pro sans erreur d'accès.

### Propriétaires

Organisations `OWN-DEMO01` à `OWN-DEMO10`, rôle `OWNER`, téléphone `+2126000001NN`. Les propriétaires 01, 03, 05 et 07 sont vérifiés.

| Organisation | Nom | Compte |
| --- | --- | --- |
| `OWN-DEMO01` | Nadia Idrissi | `demo-owner-01` |
| `OWN-DEMO02` | Karim Benjelloun | `demo-owner-02` |
| `OWN-DEMO03` | Salma El Fassi | `demo-owner-03` |
| `OWN-DEMO04` | Omar Tazi | `demo-owner-04` |
| `OWN-DEMO05` | Leïla Berrada | `demo-owner-05` |
| `OWN-DEMO06` | Hicham Chraïbi | `demo-owner-06` |
| `OWN-DEMO07` | Fatima Zahra Lahlou | `demo-owner-07` |
| `OWN-DEMO08` | Youssef Bennani | `demo-owner-08` |
| `OWN-DEMO09` | Meryem Alami | `demo-owner-09` |
| `OWN-DEMO10` | Rachid Sefrioui | `demo-owner-10` |

## Scénarios par bien

| Bien | Propriétaire | Ce que la démo montre |
| --- | --- | --- |
| P01 Appartement 3 pièces vue mer, Tanger Malabata, vente 1 450 000 MAD | Nadia I. | Mandat exclusif actif chez Agence du Détroit (agent Yassine Alaoui) : une offre en attente de réponse, une contre-proposition, 3 événements partagés, 3 contacts sur l'annonce de l'agence. Titre foncier vérifié |
| P02 Studio meublé centre-ville, Tanger, location 4 500 MAD | Nadia I. | Annonce de particulier en ligne, 2 contacts (dont un nouveau message) |
| P03 Villa avec jardin à Boubana, Tanger, vente 4 800 000 MAD | Karim B. | Demande ouverte sur la bourse : propositions de Détroit (envoyée), Tanger Immo (présélectionnée) et Iberia (invitée). Titre foncier à contrôler |
| P04 Appartement familial Iberia, Tanger, location 7 500 MAD | Karim B. | Demande directe à Iberia Habitat, mandat simple en attente de signature |
| P05 Duplex avec terrasse Marshan, Tanger, vente 2 300 000 MAD | Meryem A. | Mandat exclusif Détroit terminé (vente conclue par l'agence), avis 5/5 |
| P06 Local commercial boulevard Pasteur, Tanger, location 12 000 MAD | Meryem A. | Demande directe à Tanger Immo sans réponse depuis 50 h : la relance d'inactivité est partie |
| P07 Appartement haut standing Anfa, Casablanca, vente 3 900 000 MAD | Salma E. | Mandat actif chez Casa Prestige : une offre acceptée, une refusée ; la proposition d'Atlantic Habitat a été déclinée |
| P08 Villa Aïn Diab vue océan, Casablanca, vente 9 500 000 MAD | Salma E. | Annonce de particulier en ligne et, en parallèle, demande de mandat simple sur la bourse |
| P09 Appartement 2 pièces Maârif, Casablanca, location 6 500 MAD | Omar T. | Mandat exclusif actif chez Maârif Immo, visites planifiées, gestion locative demandée |
| P10 Bureau 120 m² Sidi Maârouf, Casablanca, location 15 000 MAD | Omar T. | Annonce de particulier en brouillon |
| P11 Appartement neuf Bourgogne, Casablanca, vente 1 650 000 MAD | Rachid S. | Mandat Maârif Immo résilié (le propriétaire a vendu lui-même), avis 3/5 |
| P12 Studio Gauthier meublé, Casablanca, location 5 200 MAD | Rachid S. | Annonce de particulier en attente de modération (file du super-admin) |
| P13 Appartement Agdal proche tram, Rabat, vente 1 900 000 MAD | Leïla B. | Mandat exclusif actif chez Rabat Agdal Immobilier, échéance dans 10 jours |
| P14 Villa Souissi avec piscine, Rabat, vente 12 500 000 MAD | Leïla B. | Demande de mandat exclusif sur la bourse. Titre foncier à contrôler (propriétaire vérifiée) |
| P15 Appartement Hay Riad 3 chambres, Rabat, location 9 000 MAD | Hicham C. | Mandat simple Agdal terminé (locataire trouvé), avis 4/5 |
| P16 Terrain constructible Témara, Rabat, vente 1 800 000 MAD | Hicham C. | Annonce de particulier en ligne |
| P17 Riad rénové Médina, Marrakech, vente 3 200 000 MAD | Fatima Zahra L. | Mandat exclusif actif chez Marrakech Palmeraie Immo, offre en attente |
| P18 Villa Palmeraie piscine, Marrakech, location 25 000 MAD | Fatima Zahra L. | Demande directe déclinée par Marrakech Palmeraie Immo |
| P19 Appartement Guéliz 2 chambres, Marrakech, vente 1 250 000 MAD | Youssef B. | Demande ouverte sur la bourse |
| P20 Appartement Hivernage meublé, Marrakech, location 8 000 MAD | Youssef B. | Annonce de particulier en ligne |

Chaque mandat a son dossier côté agence, positionné sur le workflow (`CRM_OFFER_RECEIVED`, `CRM_VISIT_PLANNED`, `CRM_LISTED`, `CRM_CLOSED_WON`…). Les agences ont aussi 40 dossiers d'acquéreurs et de locataires avec critères de recherche : la bourse calcule des « acquéreurs compatibles » et les recommandations restent dans les zones de chaque agence. On y trouve encore des rendez-vous, des tâches, des notes internes et des notes visibles du propriétaire, et des notifications non lues dans l'espace Pro.

## Parcours conseillés

1. **Propriétaire** (Nadia I.) : *Mes biens* → *Appartement 3 pièces vue mer* → *Suivre le mandat* : répondre à l'offre en attente, lire ce que l'agence partage.
2. **Manager** (Détroit) : *Mandats* → *Bourse* : la villa de Boubana avec sa pertinence ; *Mes propositions*, *Mandats*.
3. **Agent** (Détroit) : *Dossiers* : les leads et le dossier du mandat P01 avec ses transitions.
4. **Super-admin** : *Modération* : titres fonciers de P03 et P14, annonce P12 à valider.
5. **Agence non vérifiée** : n'importe quel compte Kech Immo Nouvelle → *Mandats* : accès refusé.

## Modifier les données

Ne pas éditer `demo-seed.sql` ni `demo-accounts.ts` à la main. On modifie `scripts/demo/gen_demo_seed.py`, puis depuis la racine :

```powershell
python scripts/demo/gen_demo_seed.py backend/src/main/resources/db/demo/demo-seed.sql frontend/src/app/pages/login/demo-accounts.ts
```

`DemoSeedBackendE2ETest` exécute le seed sur H2 et vérifie les volumes et les parcours clés (suivi propriétaire, bourse, recommandations, portail, transitions). Après une modification du schéma, relancer ce test : une colonne `NOT NULL` ajoutée sans valeur par défaut fera échouer le seed.

Limites connues :
- les statuts acceptés par les contraintes de la base priment sur les enums Java (par exemple, un rendez-vous ne peut pas être `CONFIRMED` en base) ;
- le profil `dev` seul, sans `MODE=PostgreSQL` sur l'URL H2, échoue sur les colonnes JSONB ; c'est antérieur au seed et sans effet sur la stack locale.
