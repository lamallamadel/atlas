# Performance Optimization Layer - Quick Start

## Overview

This backend application includes a comprehensive performance optimization layer with:

- **Redis Caching** for frequently accessed data
- **N+1 Query Prevention** using @EntityGraph
- **Database Index Audit** for missing index detection
- **Cursor-Based Pagination** for large datasets
- **Optimized HikariCP** connection pooling

## Quick Start

### 1. Start Redis (Docker)

```bash
cd infra
docker-compose up -d redis
```

Verify Redis is running:
```bash
docker exec -it redis_cache redis-cli ping
# Should return: PONG
```

### 2. Configure Application

The application is pre-configured with sensible defaults. No changes needed for local development.

To disable Redis caching (use local memory cache instead):

```yaml
# application-local.yml
cache:
  redis:
    enabled: false
```

### 3. Run Application

```bash
cd backend
mvn spring-boot:run
```

On startup, you'll see the database index audit results:

```
Database index audit: Found 3 missing indexes
Missing index on dossier.lead_email: Missing index on frequently filtered/joined column
Recommendation: CREATE INDEX idx_dossier_lead_email ON dossier(lead_email);
...
```

### 4. Test Caching

Get an annonce (first call - cache miss):
```bash
curl http://localhost:8080/api/v1/annonces/1
```

Get the same annonce (second call - cache hit, much faster):
```bash
curl http://localhost:8080/api/v1/annonces/1
```

### 5. Test Cursor Pagination

```bash
# First page
curl "http://localhost:8080/api/v1/annonces/cursor?limit=10"

# Next page (use nextCursor from previous response)
curl "http://localhost:8080/api/v1/annonces/cursor?cursor=MTIzNDU&limit=10"
```

### 6. Check Database Indexes

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:8080/api/v1/performance/index-audit
```

## Performance Metrics

Monitor cache performance via Actuator:

```bash
# Cache statistics
curl http://localhost:8080/actuator/metrics/cache.gets

# Connection pool metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

## Environment Variables

### Redis Configuration
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_REDIS_ENABLED=true
```

### HikariCP Tuning
```bash
HIKARI_MAX_POOL_SIZE=20        # Based on CPU cores
HIKARI_MIN_IDLE=5              # Minimum idle connections
```

### Cache TTLs (seconds)
```bash
CACHE_TTL_ANNONCE=900          # 15 minutes
CACHE_TTL_DOSSIER=600          # 10 minutes
CACHE_TTL_FUNNEL_ANALYSIS=3600 # 1 hour
```

## Troubleshooting

### Redis Connection Refused

**Problem:** Application fails to connect to Redis

**Solution:**
1. Check Redis is running: `docker ps | grep redis`
2. Check Redis logs: `docker logs redis_cache`
3. Test connection: `redis-cli -h localhost -p 6379 ping`

### Stale Cache Data

**Problem:** Data not updating after changes

**Solution:** Cache eviction happens automatically on updates/deletes. If needed, restart Redis:
```bash
docker restart redis_cache
```

### Slow Queries

**Problem:** Queries still slow despite indexes

**Solution:**
1. Run index audit: `GET /api/v1/performance/index-audit`
2. Apply recommended indexes
3. Check query explain plans in database

## Further Reading

For detailed documentation, see [PERFORMANCE.md](PERFORMANCE.md)

## Key Files

- `CacheConfig.java` - Redis cache configuration
- `CursorPaginationService.java` - Cursor pagination implementation
- `DatabaseIndexAudit.java` - Index audit utility
- `DossierRepository.java` - Example of @EntityGraph usage
- `V24__Add_performance_indexes.sql` - Database index migration
