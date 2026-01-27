# Documentation des Migrations de Base de Données

## Vue d'ensemble

Ce document explique la structure des migrations de base de données, l'utilisation des placeholders pour la compatibilité multi-bases, et les règles pour ajouter de nouvelles migrations.

## Structure des Dossiers

```
db/
├── migration/              # Migrations de base (compatibles H2 et PostgreSQL)
├── migration-postgres/     # Optimisations spécifiques à PostgreSQL uniquement
├── migration-h2/          # Migrations spécifiques à H2 (rarement utilisé)
└── e2e/                   # Données de test pour les tests E2E
```

### 1. `migration/` - Migrations de Base (Cross-Database)

**Objectif:** Contient toutes les migrations de schéma de base qui doivent fonctionner sur **H2 ET PostgreSQL**.

**Utilisé par:**
- Tests unitaires (H2)
- Tests d'intégration (H2)
- Tests E2E H2 (H2)
- Tests E2E PostgreSQL (PostgreSQL)
- Environnements de production (PostgreSQL)

**Règles:**
- ✅ SQL standard compatible avec H2 et PostgreSQL
- ✅ Utiliser `${json_type}` pour les colonnes JSON/JSONB
- ✅ Index standards (CREATE INDEX sans WHERE clause)
- ✅ Contraintes standards (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL)
- ❌ **PAS** de DO blocks PL/pgSQL
- ❌ **PAS** d'index partiels (avec WHERE)
- ❌ **PAS** d'index GIN/GiST
- ❌ **PAS** de ON CONFLICT (upsert)
- ❌ **PAS** de syntaxe spécifique à PostgreSQL

**Exemple:**
```sql
-- ✅ BON: Compatible H2 et PostgreSQL
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    dashboard_layout ${json_type},           -- Placeholder pour JSON/JSONB
    theme VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

### 2. `migration-postgres/` - Optimisations PostgreSQL

**Objectif:** Contient les optimisations et fonctionnalités avancées spécifiques à PostgreSQL.

**Utilisé par:**
- Tests E2E PostgreSQL uniquement
- Environnements de production (PostgreSQL)

**Non utilisé par:**
- Tests unitaires (H2)
- Tests d'intégration (H2)
- Tests E2E H2

**Fonctionnalités autorisées:**
- ✅ Index partiels (avec WHERE clause)
- ✅ Index GIN/GiST pour full-text search et JSONB
- ✅ DO blocks PL/pgSQL
- ✅ ON CONFLICT (upsert) pour seeding idempotent
- ✅ Triggers et stored procedures
- ✅ Materialized views
- ✅ Types spécifiques PostgreSQL (JSONB, arrays, hstore)

**Exemple:**
```sql
-- ✅ BON: Optimisation PostgreSQL seulement
-- Index partiel - uniquement les messages en attente
CREATE INDEX idx_outbound_message_queued 
ON outbound_message(status, attempt_count) 
WHERE status = 'QUEUED';

-- Index GIN pour recherche JSON
CREATE INDEX idx_activity_metadata 
ON activity USING GIN (metadata);

-- Full-text search
CREATE INDEX idx_dossier_notes_fts 
ON dossier_note USING gin (to_tsvector('french', COALESCE(content, '')));
```

Voir [migration-postgres/README.md](../migration-postgres/README.md) pour plus de détails.

## Utilisation du Placeholder `${json_type}`

### Pourquoi ce Placeholder?

Les colonnes JSON sont gérées différemment selon la base de données:
- **H2:** Type `JSON` (texte avec validation JSON)
- **PostgreSQL:** Type `JSONB` (binaire, indexable, plus performant)

Le placeholder `${json_type}` permet d'utiliser le bon type selon l'environnement.

### Configuration par Profil

**H2 (tests unitaires, tests E2E H2):**
```yaml
# application-e2e-h2-mock.yml
spring:
  flyway:
    locations: classpath:db/migration,classpath:db/e2e
    placeholders:
      json_type: JSON    # ← Type H2
```

**PostgreSQL (tests E2E PostgreSQL, production):**
```yaml
# application-e2e-postgres-mock.yml
spring:
  flyway:
    locations: 
      - classpath:db/migration           # Migrations de base
      - classpath:db/migration-postgres  # Optimisations PostgreSQL
      - classpath:db/e2e
    placeholders:
      json_type: JSONB   # ← Type PostgreSQL
```

### Exemples d'Utilisation

**Création de table avec colonnes JSON:**
```sql
-- V34__Add_user_preferences.sql
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    dashboard_layout ${json_type},      -- Remplacé par JSON ou JSONB
    widget_settings ${json_type},       -- Remplacé par JSON ou JSONB
    general_preferences ${json_type},   -- Remplacé par JSON ou JSONB
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Ajout de colonne JSON à une table existante:**
```sql
-- V2__Add_jsonb_and_missing_columns.sql
ALTER TABLE annonce ADD COLUMN photos_json ${json_type};
ALTER TABLE annonce ADD COLUMN rules_json ${json_type};
ALTER TABLE partie_prenante ADD COLUMN meta_json ${json_type};
```

**Utilisation dans des conditions IF NOT EXISTS:**
```sql
-- V30__Add_activity_metadata_and_new_types.sql
ALTER TABLE activity ADD COLUMN IF NOT EXISTS metadata ${json_type};
```

### ⚠️ Important: N'utilisez PAS de Type Explicite

```sql
-- ❌ MAUVAIS: Type explicite - ne fonctionne pas sur H2
ALTER TABLE product ADD COLUMN metadata JSONB;

-- ✅ BON: Placeholder - fonctionne sur H2 et PostgreSQL
ALTER TABLE product ADD COLUMN metadata ${json_type};
```

## Règles d'Ajout de Nouvelles Migrations

### Décision: migration/ ou migration-postgres/?

Utilisez ce flowchart pour décider où placer votre migration:

```
┌─────────────────────────────────────────┐
│ Nouvelle migration à ajouter            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Utilise des fonctionnalités             │
│ spécifiques PostgreSQL?                 │
│ (voir liste ci-dessous)                 │
└─────────────┬───────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
       OUI         NON
        │           │
        ▼           ▼
┌──────────────┐  ┌──────────────────────┐
│ migration-   │  │ migration/           │
│ postgres/    │  │ (base cross-DB)      │
└──────────────┘  └──────────────────────┘
```

**Fonctionnalités spécifiques PostgreSQL:**
1. Index partiels (WHERE clause dans CREATE INDEX)
2. Index GIN/GiST (USING gin, USING gist)
3. Full-text search (to_tsvector, to_tsquery)
4. DO blocks PL/pgSQL
5. ON CONFLICT (upsert)
6. Triggers et stored procedures
7. Materialized views
8. Types PostgreSQL (JSONB avec opérateurs spécifiques, arrays, hstore)

### Exemples de Décision

#### Exemple 1: Ajouter une Table Utilisateur

```sql
-- ✅ migration/V50__Add_user_table.sql
-- Raison: SQL standard, fonctionne sur H2 et PostgreSQL

CREATE TABLE user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    preferences ${json_type},           -- Utilise placeholder
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON user(email);
```

#### Exemple 2: Optimiser les Requêtes Utilisateur

```sql
-- ✅ migration-postgres/V100__Optimize_user_queries.sql
-- Raison: Index partiel (WHERE clause) - PostgreSQL uniquement

-- Index partiel pour utilisateurs actifs seulement
CREATE INDEX idx_user_active 
ON user(email, created_at) 
WHERE deleted_at IS NULL;

-- Index GIN pour recherche full-text sur le nom
CREATE INDEX idx_user_name_fts 
ON user USING gin (to_tsvector('french', COALESCE(name, '')));
```

#### Exemple 3: Ajouter une Colonne de Métadonnées

```sql
-- ✅ migration/V51__Add_product_metadata.sql
-- Raison: Ajout de colonne standard avec placeholder

ALTER TABLE product ADD COLUMN metadata ${json_type};

-- Index standard (fonctionne sur H2 et PostgreSQL)
CREATE INDEX idx_product_metadata ON product(metadata);
```

Puis, **optionnellement**, optimiser pour PostgreSQL:

```sql
-- ✅ migration-postgres/V101__Optimize_product_metadata.sql
-- Raison: Index GIN pour requêtes JSONB - PostgreSQL uniquement

-- Remplacer l'index standard par un index GIN optimisé
DROP INDEX IF EXISTS idx_product_metadata;
CREATE INDEX idx_product_metadata ON product USING gin (metadata);
```

## Syntaxe Compatible H2/PostgreSQL

### ✅ Syntaxe Standard à Utiliser (migration/)

**Types de données:**
```sql
-- Numériques
BIGSERIAL, INTEGER, DECIMAL(10,2), NUMERIC

-- Texte
VARCHAR(255), TEXT

-- Date/Heure
TIMESTAMP, DATE, TIME

-- JSON (avec placeholder)
${json_type}

-- Booléen
BOOLEAN
```

**Indexes standards:**
```sql
-- Index simple
CREATE INDEX idx_table_column ON table_name(column_name);

-- Index composite
CREATE INDEX idx_table_multi ON table_name(col1, col2);

-- Index unique
CREATE UNIQUE INDEX idx_table_unique ON table_name(column_name);
```

**Contraintes:**
```sql
-- Primary key
PRIMARY KEY

-- Foreign key
FOREIGN KEY (other_id) REFERENCES other_table(id) ON DELETE CASCADE

-- Unique
UNIQUE (column_name)

-- Not null
NOT NULL

-- Default
DEFAULT CURRENT_TIMESTAMP
DEFAULT 'value'
```

**Fonctions standards:**
```sql
CURRENT_TIMESTAMP
COALESCE(column, 'default')
UPPER(column), LOWER(column)
CONCAT(col1, col2)
```

### ❌ Syntaxe à Éviter dans migration/ (base)

**DO blocks (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user') THEN
        CREATE TABLE user (...);
    END IF;
END $$;

-- ✅ Alternative compatible: utiliser IF NOT EXISTS directement
CREATE TABLE IF NOT EXISTS user (...);
```

**Index partiels (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
CREATE INDEX idx_user_active ON user(email) WHERE deleted_at IS NULL;

-- ✅ Alternative: index standard (moins optimisé mais fonctionne)
CREATE INDEX idx_user_email ON user(email);
-- Puis ajouter l'index partiel dans migration-postgres/
```

**Index GIN/GiST (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
CREATE INDEX idx_metadata ON product USING gin (metadata);

-- ✅ Alternative: index standard sur colonne
CREATE INDEX idx_metadata ON product(metadata);
-- Puis ajouter l'index GIN dans migration-postgres/
```

**ON CONFLICT (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
INSERT INTO category (code, name) VALUES ('TECH', 'Technology')
ON CONFLICT (code) DO NOTHING;

-- ✅ Alternative: simple INSERT (peut échouer si existe déjà)
INSERT INTO category (code, name) VALUES ('TECH', 'Technology');
-- Puis ajouter l'upsert dans migration-postgres/ si nécessaire
```

**Opérateurs JSONB spécifiques (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
SELECT * FROM product WHERE metadata @> '{"color": "red"}';
SELECT * FROM product WHERE metadata ? 'brand';

-- ✅ Alternative: utiliser des fonctions dans l'application
-- Pas de requête JSON complexe dans les migrations de base
```

**Full-text search (PostgreSQL uniquement):**
```sql
-- ❌ Ne fonctionne PAS sur H2
CREATE INDEX idx_notes_fts ON notes USING gin (to_tsvector('french', content));

-- ✅ Alternative: index standard sur la colonne texte
CREATE INDEX idx_notes_content ON notes(content);
-- Puis ajouter le full-text search dans migration-postgres/
```

## Workflow de Développement

### Étape 1: Créer la Migration de Base

Commencez toujours par une migration compatible H2/PostgreSQL dans `migration/`:

```sql
-- migration/V50__Add_order_table.sql
CREATE TABLE order (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    metadata ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index standard
CREATE INDEX idx_order_status ON order(status);
CREATE INDEX idx_order_metadata ON order(metadata);
```

### Étape 2: Tester avec H2

```bash
cd backend
mvn test
```

Vérifie que la migration fonctionne sur H2 (tests unitaires).

### Étape 3: Ajouter les Optimisations PostgreSQL (optionnel)

Si nécessaire, ajouter des optimisations dans `migration-postgres/`:

```sql
-- migration-postgres/V100__Optimize_order_queries.sql

-- Index partiel pour commandes actives seulement (5-10% du total)
DROP INDEX IF EXISTS idx_order_status;
CREATE INDEX idx_order_active 
ON order(status, created_at) 
WHERE status IN ('PENDING', 'PROCESSING');

-- Index GIN pour métadonnées JSON
DROP INDEX IF EXISTS idx_order_metadata;
CREATE INDEX idx_order_metadata ON order USING gin (metadata);
```

### Étape 4: Tester avec PostgreSQL

```bash
cd backend
mvn verify -Pbackend-e2e-postgres
```

Vérifie que:
1. Les migrations de base fonctionnent sur PostgreSQL
2. Les optimisations PostgreSQL sont appliquées
3. Les performances sont améliorées

### Étape 5: Documenter l'Impact

Ajoutez des commentaires dans la migration PostgreSQL:

```sql
-- V100__Optimize_order_queries.sql
-- Optimisation: Index partiel pour commandes actives uniquement
-- Impact attendu:
--   - Réduction taille index: ~85% (seulement 15% des commandes actives)
--   - Performance requêtes: +50-60% pour filtres sur status actif
--   - Maintenance: -80% overhead lors des insertions (index plus petit)
```

## Numérotation des Versions

### Convention de Numérotation

```
migration/
├── V1__Initial_schema.sql
├── V2__Add_jsonb_columns.sql
├── ...
├── V50__Add_feature_X.sql
└── V99__Last_base_migration.sql

migration-postgres/
├── V100__Add_postgres_optimizations.sql
├── V101__Add_partial_indexes.sql
├── V102__Add_fulltext_search.sql
└── ...
```

**Règles:**
- `V1-V99`: Migrations de base (cross-database) dans `migration/`
- `V100-V199`: Optimisations PostgreSQL dans `migration-postgres/`
- `V200+`: Réservé pour futures extensions

**Important:** Ne jamais utiliser le même numéro de version dans les deux dossiers!

### Ordre d'Exécution

Flyway applique les migrations dans l'ordre des versions, **tous dossiers confondus**:

```
1. V1 (migration/)
2. V2 (migration/)
...
50. V50 (migration/)
...
100. V100 (migration-postgres/)  ← Exécuté après V99, uniquement sur PostgreSQL
101. V101 (migration-postgres/)
```

## Tests et Validation

### Tests Unitaires (H2)

```bash
cd backend
mvn test
```

- Utilise H2 in-memory
- Applique uniquement `db/migration/`
- Rapide (quelques secondes)
- Valide la compatibilité H2

### Tests E2E H2

```bash
cd backend
mvn verify -Pbackend-e2e-h2
```

- Utilise H2 in-memory
- Applique `db/migration/` + `db/e2e/`
- Valide le comportement end-to-end sur H2

### Tests E2E PostgreSQL

```bash
cd backend
mvn verify -Pbackend-e2e-postgres
```

- Utilise PostgreSQL via Testcontainers (Docker requis)
- Applique `db/migration/` + `db/migration-postgres/` + `db/e2e/`
- Valide les optimisations PostgreSQL
- Valide le comportement production-like

### Frontend E2E

```bash
cd frontend
npm run e2e            # H2 + mock auth (par défaut)
npm run e2e:postgres   # PostgreSQL + mock auth
npm run e2e:full       # Tous les environnements
```

## Checklist de Migration

Avant de créer une nouvelle migration, vérifiez:

### Pour migration/ (base):
- [ ] SQL standard compatible H2 et PostgreSQL
- [ ] Utilisation de `${json_type}` pour colonnes JSON
- [ ] Aucune syntaxe spécifique PostgreSQL
- [ ] `mvn test` passe (tests H2)
- [ ] Commentaires expliquant l'objectif de la migration

### Pour migration-postgres/ (optimisations):
- [ ] Migration de base correspondante existe dans `migration/`
- [ ] Utilise des fonctionnalités spécifiques PostgreSQL
- [ ] `mvn verify -Pbackend-e2e-postgres` passe
- [ ] Impact performance documenté
- [ ] Numéro de version unique (V100+)

## Exemples Complets

### Exemple 1: Ajouter une Fonctionnalité Complète

**1. Migration de base (pour tous):**
```sql
-- migration/V60__Add_notification_system.sql
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content ${json_type},
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_read ON notification(read);
```

**2. Optimisations PostgreSQL (production):**
```sql
-- migration-postgres/V110__Optimize_notifications.sql

-- Index partiel pour notifications non lues (généralement <20% du total)
DROP INDEX IF EXISTS idx_notification_read;
CREATE INDEX idx_notification_unread 
ON notification(user_id, created_at) 
WHERE read = FALSE;

-- Index GIN pour recherche dans le contenu JSON
CREATE INDEX idx_notification_content 
ON notification USING gin (content);
```

### Exemple 2: Modifier une Table Existante

**1. Migration de base:**
```sql
-- migration/V61__Add_notification_priority.sql
ALTER TABLE notification ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL';
UPDATE notification SET priority = 'NORMAL' WHERE priority IS NULL;
ALTER TABLE notification ALTER COLUMN priority SET NOT NULL;

CREATE INDEX idx_notification_priority ON notification(priority);
```

**2. Optimisation PostgreSQL:**
```sql
-- migration-postgres/V111__Optimize_high_priority_notifications.sql

-- Index partiel pour notifications haute priorité uniquement
CREATE INDEX idx_notification_high_priority 
ON notification(user_id, created_at) 
WHERE priority = 'HIGH' AND read = FALSE;
```

## Dépannage

### Erreur: Syntaxe non reconnue par H2

**Symptôme:**
```
org.h2.jdbc.JdbcSQLSyntaxErrorException: Syntax error in SQL statement "CREATE INDEX ... WHERE [*]..."
```

**Solution:**
- Déplacer la migration vers `migration-postgres/`
- Créer une version simplifiée dans `migration/` si nécessaire

### Erreur: Placeholder non remplacé

**Symptôme:**
```
SQL state [42601]; error code [0]; ERROR: syntax error at or near "${json_type}"
```

**Solution:**
- Vérifier que `flyway.placeholders.json_type` est configuré dans le fichier de configuration
- H2: `json_type: JSON`
- PostgreSQL: `json_type: JSONB`

### Erreur: Version en double

**Symptôme:**
```
org.flywaydb.core.api.FlywayException: Found more than one migration with version 100
```

**Solution:**
- Utiliser des plages de versions différentes
- Base: V1-V99
- PostgreSQL: V100+
- Ne jamais dupliquer un numéro de version

## Ressources Additionnelles

- [migration-postgres/README.md](../migration-postgres/README.md) - Documentation détaillée des optimisations PostgreSQL
- [AGENTS.md](/AGENTS.md) - Guide de développement général
- [Flyway Documentation](https://flywaydb.org/documentation/)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [H2 Database Documentation](https://www.h2database.com/html/main.html)

## Support

Pour questions ou problèmes:
1. Consulter cette documentation
2. Vérifier [migration-postgres/README.md](../migration-postgres/README.md) pour optimisations PostgreSQL
3. Tester localement: `mvn test` (H2) et `mvn verify -Pbackend-e2e-postgres` (PostgreSQL)
4. Consulter les logs Flyway pour détails d'erreur
