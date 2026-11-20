# Tester WhatsApp de bout en bout (numéro de test Meta)

Objectif : vérifier la chaîne complète d'Atlas avec un vrai WhatsApp —
annonce → acheteur trouvé → proposition WhatsApp (texte + photos) → réponse du client →
visite planifiée → relance.

Durée : 30 à 45 minutes. Il faut un compte Facebook, un téléphone avec WhatsApp, et
l'accès à la base (Adminer : `db.afroware.app`, ou `psql`).

## 1. Créer l'application Meta

1. Aller sur <https://developers.facebook.com/apps> → **Créer une app** → type **Business**
   (« Entreprise »).
2. Ajouter le produit **WhatsApp** → **Configurer**. Meta crée automatiquement un compte
   WhatsApp Business de test et un **numéro de test** (gratuit).
3. Ouvrir **WhatsApp → Configuration de l'API** (« API Setup ») et noter :
   - **ID du numéro de téléphone** (`Phone number ID`, 15 chiffres) — pas l'ID du compte ;
   - **ID du compte WhatsApp Business** (`WABA ID`, 16 chiffres) ;
   - **Jeton d'accès temporaire** — valable 24 h seulement (voir étape 7 pour un jeton durable).
4. Dans **À** (« To ») → **Gérer la liste des numéros** : ajouter **votre** numéro WhatsApp
   (format international, ex. `+212 6XX XX XX XX`) et saisir le code reçu. Le numéro de test ne
   peut écrire qu'à 5 numéros enregistrés ainsi.
5. Envoyer le message modèle `hello_world` depuis cette page : vous devez le recevoir sur votre
   téléphone. Sinon, inutile d'aller plus loin (numéro mal saisi, code non validé…).
6. **Paramètres de l'app → Général** : copier la **Clé secrète** (`App Secret`). C'est elle qui
   signe les webhooks.

## 2. Préparer le serveur Atlas

Variables d'environnement du backend (fichier `.env` à côté de `infra/docker-compose.yml`) :

```env
# Jeton de votre choix, à saisir aussi dans Meta (étape 3)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=atlas-verif-change-moi
# Heure du Maroc pour les créneaux de visite et les messages
TZ=Africa/Casablanca
```

Redémarrer le backend : `docker compose up -d backend`.

Vérifier l'heure : les journaux du backend doivent afficher l'heure marocaine.

## 3. Brancher le webhook (réponses des clients)

Meta doit joindre Atlas en HTTPS public :

- **Serveur de production** : `https://api.afroware.app/api/v1/webhooks/whatsapp/inbound`
- **PC local** : ouvrir un tunnel vers le port 8080, par exemple
  `cloudflared tunnel --url http://localhost:8080`, puis utiliser l'adresse donnée +
  `/api/v1/webhooks/whatsapp/inbound`.

Dans Meta : **WhatsApp → Configuration** :

1. **URL de rappel** (« Callback URL ») : l'adresse ci-dessus.
2. **Jeton de vérification** (« Verify token ») : la valeur de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
3. **Vérifier et enregistrer**. En cas d'échec : jeton différent, URL injoignable, ou backend
   pas redémarré.
4. Dans **Champs de webhook**, s'abonner au champ **messages**. Sans cet abonnement, aucun
   message n'arrive.

Atlas retrouve l'organisation grâce au numéro WhatsApp qui reçoit le message, et refuse tout
webhook non signé par Meta.

## 4. Enregistrer la configuration dans Atlas

**En local** (`infra/docker-compose.local.yml`, base H2) : utiliser plutôt
`infra/scripts/configure-whatsapp-h2.sql` dans la console H2 (<http://localhost:8083>, JDBC URL
`jdbc:h2:tcp://localhost:1521/atlas`, utilisateur `sa`, mot de passe vide). L'organisation des
données de démonstration est `ORG-001`, et le « Verify token » par défaut est `atlas-local`.

**Sur le serveur** (PostgreSQL) :

Ouvrir `infra/scripts/configure-whatsapp.sql`, remplacer les valeurs entre `<>` et exécuter la
première requête (`INSERT … ON CONFLICT`) :

| Valeur | Où la trouver |
| --- | --- |
| `<ORG_ID>` | `SELECT DISTINCT org_id FROM annonce;` |
| `<ACCESS_TOKEN>` | étape 1.3 (ou 7) |
| `<APP_SECRET>` | étape 1.6 |
| `<PHONE_NUMBER_ID>` | étape 1.3 |
| `<WABA_ID>` | étape 1.3 |

## 5. Dérouler le scénario

1. **Ouvrir la conversation** : depuis votre téléphone, écrivez « Bonjour » au numéro de test.
   Cela crée (ou retrouve) votre dossier dans Atlas et ouvre la **fenêtre de 24 h** pendant
   laquelle Atlas peut vous écrire librement. Sans ce premier message, WhatsApp n'accepte que des
   modèles validés par Meta, et la proposition serait refusée (« fenêtre de 24 h fermée »).
2. **Accord marketing** : exécuter la requête « TEST UNIQUEMENT » du script pour votre dossier
   (l'onglet Consentements ne sait pas encore enregistrer un accord marketing complet).
3. **Critères** : dans votre dossier → « Biens correspondants » → saisir des critères (ville,
   budget…), ou « Suggérer depuis la conversation ».
4. **Annonce** : créer ou modifier une annonce qui correspond, avec 1 ou 2 photos JPEG/PNG.
   Votre dossier apparaît dans « Acheteurs potentiels » (notification à l'agent).
5. **Proposition** : « Proposer » → relire le brouillon → cocher des photos → Envoyer. Vous
   recevez le texte puis les photos.
6. **Réponse** : répondez par exemple « On peut visiter samedi à 10h ? ». Sur la fiche, la
   réponse apparaît (« Veut visiter ») avec un créneau libre ; l'agent est notifié.
7. **Visite** : « Planifier la visite » → le rendez-vous apparaît dans le calendrier.
8. **Relance** (facultatif) : ne répondez pas à un client pendant 24 h, ou réglez
   `atlas.follow-up.agent-reply-hours=1` pour tester plus vite ; il apparaît dans « Relances ».

## 6. En cas de problème

| Symptôme | Cause probable |
| --- | --- |
| Rien n'arrive dans Atlas quand vous écrivez | champ **messages** non abonné ; URL non publique ; `<PHONE_NUMBER_ID>` différent de celui de Meta (le webhook répond 400) |
| Webhook refusé en 401 | `<APP_SECRET>` incorrect dans `webhook_secret_encrypted` |
| Envoi refusé, « fenêtre de 24 h » | vous n'avez pas écrit au numéro de test depuis 24 h (étape 5.1) |
| Envoi refusé, « consentement » / « GDPR » | accord marketing absent ou incomplet (étape 5.2) |
| Message en échec, erreur 190 | jeton expiré (le temporaire dure 24 h) : le renouveler (requête `UPDATE` du script) |
| Message en échec, erreur 131030 | votre numéro n'est pas dans la liste des destinataires du numéro de test (étape 1.4) |
| Photo en échec `MEDIA_UNAVAILABLE` | photo introuvable, ni JPEG ni PNG, ou plus de 5 Mo |
| Créneau décalé d'une heure | `TZ` non défini sur le backend |

Les messages sortants et leurs erreurs se consultent dans la base :
`SELECT id, status, error_code, error_message FROM outbound_message ORDER BY id DESC LIMIT 10;`

## 7. Jeton durable (après le premier test)

Le jeton temporaire expire en 24 h. Pour un jeton qui n'expire pas :
**Paramètres de l'entreprise** (Meta Business Suite) → **Utilisateurs → Utilisateurs système** →
**Ajouter** (rôle Admin) → **Ajouter des éléments** : l'app et le compte WhatsApp → **Générer un
jeton** avec les autorisations `business_management`, `whatsapp_business_management` et
`whatsapp_business_messaging`. Le remplacer avec la requête `UPDATE` du script.

## Après le test

- Passer à un vrai numéro d'entreprise (vérification de l'entreprise par Meta).
- Hors fenêtre de 24 h, une première proposition exige un **modèle de message** approuvé par
  Meta : ce n'est pas encore géré par l'éditeur de proposition.
