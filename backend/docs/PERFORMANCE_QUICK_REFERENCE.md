# Performance Testing Quick Reference

## Quick Start Commands

### Run Load Tests
```bash
# Standard load test (100 users, 1000 dossiers/hour, 60 minutes)
cd backend
mvn gatling:test -Dgatling.simulationClass=com.example.backend.loadtest.DossierCreationLoadTest

# Spike test (sudden traffic bursts)
mvn gatling:test -Dgatling.simulationClass=com.example.backend.loadtest.SpikeLoadTest

# Stress test (find breaking point)
mvn gatling:test -Dgatling.simulationClass=com.example.backend.loadtest.StressLoadTest -Dmax.users=500

# Endurance test (sustained load)
mvn gatling:test -Dgatling.simulationClass=com.example.backend.loadtest.EnduranceLoadTest -Dsteady.users=50 -Dduration.hours=4
```

### Enable Performance Monitoring
```bash
# Start with performance profile
SPRING_PROFILES_ACTIVE=performance mvn spring-boot:run

# Or set environment variables
export PERFORMANCE_HIBERNATE_STATISTICS_ENABLED=true
export PERFORMANCE_QUERY_PROFILING_ENABLED=true
export HIKARI_MAX_POOL_SIZE=100
mvn spring-boot:run
```

### Monitor Metrics
```bash
# Connection pool
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active | jq

# Cache hits
curl http://localhost:8080/actuator/metrics/cache.gets?tag=result:hit | jq

# JVM Memory
curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq

# HTTP requests
curl http://localhost:8080/actuator/metrics/http.server.requests | jq
```

---

## Performance Checklist

### Before Load Testing
- [ ] Application running with `performance` profile
- [ ] Redis running and accessible
- [ ] PostgreSQL optimized (vacuum, analyze)
- [ ] Sufficient system resources (CPU, RAM)
- [ ] Monitoring endpoints accessible
- [ ] Logs configured for performance tracking

### During Load Testing
- [ ] Monitor connection pool utilization
- [ ] Watch for N+1 query warnings
- [ ] Check cache hit rates
- [ ] Track response time percentiles
- [ ] Monitor system resources (CPU, memory)
- [ ] Review error rates

### After Load Testing
- [ ] Analyze Gatling HTML reports
- [ ] Review Hibernate statistics logs
- [ ] Check for slow query warnings
- [ ] Validate cache effectiveness
- [ ] Document performance baselines
- [ ] Identify optimization opportunities

---

## Key Configuration Values

### Connection Pool (HikariCP)
| Environment | Max Pool Size | Min Idle | Recommended For |
|-------------|---------------|----------|-----------------|
| Development | 10 | 5 | Local development |
| Staging | 30 | 10 | Testing |
| Production (Normal) | 50 | 10 | 50-100 concurrent users |
| Production (Peak) | 100 | 20 | 100-200 concurrent users |

### Cache TTL (seconds)
| Data Type | TTL | Use Case |
|-----------|-----|----------|
| Active Annonces | 300 | Homepage listings |
| Annonce Detail | 900 | Property pages |
| Dossier | 600 | Dossier details |
| User Preferences | 1800 | User settings |
| Referential Data | 3600 | Dropdown values |

### Hibernate Batch Sizes
| Environment | Batch Size | Fetch Size |
|-------------|------------|------------|
| Development | 10 | 25 |
| Production | 25-50 | 50-100 |
| Bulk Operations | 100+ | 200+ |

---

## Performance Targets

### Response Times (100 concurrent users)
| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Create Annonce | <100ms | <300ms | <500ms |
| Create Dossier | <150ms | <400ms | <650ms |
| Get Dossier | <50ms | <150ms | <300ms |
| List Annonces | <75ms | <200ms | <350ms |
| Update Status | <100ms | <250ms | <400ms |

### System Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Success Rate | >99% | <95% |
| Pool Utilization | 30-60% | >80% |
| Cache Hit Rate | >75% | <70% |
| CPU Utilization | <70% | >90% |
| Heap Memory | <75% | >85% |

---

## Common Issues and Solutions

### Issue: High Response Times
**Symptoms:** P95 >2000ms, P99 >5000ms

**Diagnosis:**
```bash
# Check slow queries
grep "SLOW QUERY" logs/spring.log

# Monitor connection pool
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

**Solutions:**
1. Enable query profiling: `performance.query.profiling.enabled=true`
2. Check for N+1 queries in Hibernate stats
3. Review database indexes
4. Increase cache TTL for frequently accessed data

### Issue: Connection Pool Exhaustion
**Symptoms:** `HikariPool - Connection is not available, request timed out`

**Diagnosis:**
```bash
# Check pool metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections
```

**Solutions:**
1. Increase `HIKARI_MAX_POOL_SIZE`
2. Check for connection leaks (review leak detection logs)
3. Reduce `idle-timeout` to release connections faster
4. Optimize slow queries holding connections

### Issue: Low Cache Hit Rate
**Symptoms:** Cache hit rate <70%

**Diagnosis:**
```bash
# Check cache stats in logs
grep "Redis Cache Statistics" logs/spring.log
```

**Solutions:**
1. Increase TTL values
2. Pre-warm cache on startup
3. Review cache invalidation logic
4. Verify Redis is accessible

### Issue: N+1 Queries Detected
**Symptoms:** `POTENTIAL N+1 QUERY DETECTED` in logs

**Solutions:**
```java
// Use JOIN FETCH
@Query("SELECT d FROM Dossier d LEFT JOIN FETCH d.parties WHERE d.id = :id")

// Or @EntityGraph
@EntityGraph(attributePaths = {"parties", "appointments"})

// Or batch fetching
@BatchSize(size = 25)
```

---

## Essential Log Patterns

### Monitor Performance Logs
```bash
# Watch all performance metrics
tail -f logs/spring.log | grep -E "Hibernate Performance|HikariCP|Redis Cache|SLOW"

# N+1 query detection
tail -f logs/spring.log | grep "N+1 QUERY DETECTED"

# Slow queries only
tail -f logs/spring.log | grep "🐌 SLOW"

# Cache statistics
tail -f logs/spring.log | grep "Redis Cache Statistics"
```

### Performance Metric Extraction
```bash
# Extract P95 response times from Gatling report
grep "95th percentile" target/gatling/*/simulation.log

# Count slow queries
grep -c "SLOW QUERY" logs/spring.log

# Average connection pool utilization
grep "Pool utilization" logs/spring.log | awk '{sum+=$NF} END {print sum/NR "%"}'
```

---

## Load Test Parameter Tuning

### Gatling Test Parameters
```bash
# Moderate load
mvn gatling:test \
  -Dgatling.simulationClass=com.example.backend.loadtest.DossierCreationLoadTest \
  -Dconcurrent.users=100 \
  -Ddossiers.per.hour=1000 \
  -Dduration.minutes=60

# Heavy load
mvn gatling:test \
  -Dgatling.simulationClass=com.example.backend.loadtest.DossierCreationLoadTest \
  -Dconcurrent.users=200 \
  -Ddossiers.per.hour=2000 \
  -Dduration.minutes=120

# Stress test to breaking point
mvn gatling:test \
  -Dgatling.simulationClass=com.example.backend.loadtest.StressLoadTest \
  -Dmax.users=1000
```

---

## Database Optimization

### Index Health Check
```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Most used indexes
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Maintenance Commands
```sql
-- Analyze tables
ANALYZE annonce;
ANALYZE dossier;
ANALYZE message;

-- Vacuum (reclaim space)
VACUUM ANALYZE annonce;

-- Reindex if needed
REINDEX TABLE annonce;
```

---

## Quick Wins

### Immediate Performance Improvements
1. **Enable Redis caching**: `CACHE_REDIS_ENABLED=true`
2. **Increase connection pool**: `HIKARI_MAX_POOL_SIZE=50`
3. **Enable batch processing**: `HIBERNATE_BATCH_SIZE=25`
4. **Add missing indexes**: Run migration V111
5. **Use pagination**: Limit query results to 20-50 per page

### Code-Level Optimizations
```java
// ✅ Use projections instead of full entities
@Query("SELECT new DossierSummaryDTO(d.id, d.leadName) FROM Dossier d")
List<DossierSummaryDTO> findSummaries();

// ✅ Fetch associations eagerly when needed
@EntityGraph(attributePaths = {"parties"})
List<Dossier> findAll();

// ✅ Batch updates
@Modifying
@Query("UPDATE Dossier d SET d.status = :status WHERE d.id IN :ids")
void updateStatusBatch(@Param("status") DossierStatus status, @Param("ids") List<Long> ids);
```

---

## Reporting

### Generate Performance Report
```bash
# After load test
open target/gatling/dossier-creation-load-test-*/index.html

# Extract key metrics
echo "P95 Response Time: $(grep '95th percentile' target/gatling/*/simulation.log | head -1)"
echo "Success Rate: $(grep 'OK' target/gatling/*/simulation.log | tail -1)"
echo "Requests/sec: $(grep 'requests/sec' target/gatling/*/simulation.log | tail -1)"
```

### Performance Baseline Document
Create a baseline after each major release:
```
# Performance Baseline - v1.2.3 - 2024-01-15

## Test Environment
- Concurrent Users: 100
- Duration: 60 minutes
- Target: 1000 dossiers/hour

## Results
- P95 Response Time: 380ms
- Success Rate: 98.7%
- Throughput: 285 req/s
- Pool Utilization: 42%
- Cache Hit Rate: 82%

## Regressions
- None

## Improvements
- 15% faster than v1.2.2
- Added 12 new indexes
```

---

## Contact and Support

For performance issues:
1. Check this quick reference first
2. Review detailed guide: `PERFORMANCE_LOAD_TESTING.md`
3. Analyze Gatling reports
4. Review application logs
5. Check database query performance
