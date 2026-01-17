# Runbook Observability (ELK + Prometheus/Grafana)

Ce runbook décrit comment vérifier et dépanner l’observabilité de l’environnement local Docker-first (logs ELK + métriques Prometheus/Grafana).

## 1) URLs utiles (local)

- Backend API : http://localhost:8080
  - Actuator Health : http://localhost:8080/actuator/health
  - Métriques Prometheus : http://localhost:8080/actuator/prometheus
- Keycloak : http://localhost:8081
- Adminer : http://localhost:8082
- Elasticsearch : http://localhost:9200
- Kibana : http://localhost:5601
- Prometheus : http://localhost:9090
- Grafana : http://localhost:3000

Identifiants Grafana (par défaut) :
- user : admin
- password : admin

## 2) Vérifier l’état des conteneurs

Depuis `infra/` :

```bash
docker compose ps
```

Attendu : tous les services en état `running`.

Pour diagnostiquer un service :

```bash
docker compose logs -f <service>
```

## 3) Logs (ELK)

### 3.1 Vérifier que le backend écrit bien ses logs

Dans la configuration Docker-first, le backend écrit un fichier JSON dans le conteneur (et un volume) :

```bash
docker compose exec backend sh -lc 'ls -lah /var/log/atlas && tail -n 20 /var/log/atlas/application.json || true'
```

Si le fichier est absent :
- vérifier que le profil Spring actif est correct (profil `elk` en Docker)
- vérifier la configuration Logback et les volumes du service backend

### 3.2 Vérifier Filebeat et Logstash

```bash
docker compose logs -f filebeat
```

```bash
docker compose logs -f logstash
```

Points typiques :
- erreurs de connexion Logstash/Elasticsearch
- erreurs de parsing (devraient être faibles, l’option P0 a supprimé le re-parsing JSON de `message`)

### 3.3 Vérifier l’indexation dans Elasticsearch

```bash
curl -s http://localhost:9200/_cat/indices?v | grep atlas-logs || true
```

Attendu : un index `atlas-logs-YYYY.MM.dd`.

### 3.4 Kibana : créer la Data View

1) Ouvrir Kibana : http://localhost:5601
2) Stack Management → Data Views → Create data view
3) Pattern : `atlas-logs-*`
4) Time field : `@timestamp`

Exemples de requêtes utiles :
- `service:backend AND level:ERROR`
- `orgId:"ORG-1"` (selon vos champs et conventions)

## 4) Métriques (Prometheus + Grafana)

### 4.1 Vérifier l’endpoint métriques du backend

```bash
curl -s http://localhost:8080/actuator/prometheus | head
```

### 4.2 Vérifier que Prometheus scrape le backend

1) Ouvrir Prometheus : http://localhost:9090
2) Status → Targets
3) Attendu : une cible `UP` pour le backend

Sinon :
- vérifier `infra/prometheus/prometheus.yml`
- vérifier le nom de service Docker (`backend`) et le port exposé

### 4.3 Grafana

1) Ouvrir Grafana : http://localhost:3000
2) Login admin/admin
3) Vérifier : datasources + dashboards provisionnés

## 5) Problèmes fréquents et correctifs

### 5.1 Kibana vide (pas de logs)

Check-list :
1) `docker compose ps` (tout running)
2) `docker compose exec backend ...` (fichier log présent)
3) logs `filebeat` et `logstash`
4) indices Elasticsearch (`_cat/indices`)

### 5.2 401/403 (OIDC)

Si le backend est dans Docker, l’issuer interne doit être :
- `http://keycloak:8080/realms/myrealm`

Côté navigateur (Angular), l’issuer doit rester :
- `http://localhost:8081/realms/myrealm`

### 5.3 Prometheus target DOWN

- vérifier que `/actuator/prometheus` est exposé et autorisé (permitAll)
- vérifier la config Prometheus et le réseau Docker

### 5.4 Nettoyage total

```bash
docker compose down -v
```

Attention : supprime les volumes (DB, Elasticsearch, Grafana, etc.).
