# Performance Testing and Optimization Suite

Comprehensive load testing, performance monitoring, and optimization toolkit for the backend application.

## 🎯 Overview

This suite provides:
- **Load Testing**: Gatling and K6 tests for realistic user workloads
- **Performance Monitoring**: Hibernate statistics, connection pool metrics, cache monitoring
- **Database Optimization**: Comprehensive indexes and query profiling
- **Caching Strategy**: Redis-based caching with configurable TTL
- **Connection Pool Tuning**: HikariCP optimization based on load test results

## 🚀 Quick Start

### 1. Run Load Tests

```bash
# Start application with performance profile
cd backend
SPRING_PROFILES_ACTIVE=performance mvn spring-boot:run

# In another terminal, run load tests
./run-load-tests.sh standard

# Or on Windows
.\run-load-tests.ps1 standard
```

### 2. View Results

Gatling HTML reports are generated at:
```
backend/target/gatling/[test-name]-[timestamp]/index.html
```

### 3. Monitor Performance

```bash
# Enable performance monitoring
export PERFORMANCE_HIBERNATE_STATISTICS_ENABLED=true
export PERFORMANCE_QUERY_PROFILING_ENABLED=true
mvn spring-boot:run

# Watch performance logs
tail -f logs/spring.log | grep -E "Hibernate|HikariCP|SLOW"
```

## 📊 Load Test Scenarios

### Standard Load Test (Recommended)
- **Users**: 100 concurrent
- **Duration**: 60 minutes
- **Target**: 1000 dossiers/hour
- **Scenarios**: Create annonce, create dossier, retrieve, update status

```bash
./run-load-tests.sh standard
```

### Spike Test
- Sudden traffic bursts (0 → 500 → 1000 → 1500 users)
- Tests resilience under sudden load

```bash
./run-load-tests.sh spike
```

### Stress Test
- Gradual increase to breaking point
- Finds system limits

```bash
./run-load-tests.sh stress
```

### Endurance Test
- Sustained load over 4+ hours
- Detects memory leaks and degradation

```bash
./run-load-tests.sh endurance
```

## 🔧 Configuration

### Application Profiles

**Performance Profile** (`application-performance.yml`):
- HikariCP max pool size: 100
- Hibernate batch size: 50
- Statistics enabled
- Optimized cache TTL

**Production Profile** (`application.yml`):
- HikariCP max pool size: 50
- Hibernate batch size: 25
- Statistics disabled (for performance)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HIKARI_MAX_POOL_SIZE` | 50 | Connection pool size |
| `HIKARI_MIN_IDLE` | 10 | Minimum idle connections |
| `HIBERNATE_BATCH_SIZE` | 25 | Batch insert/update size |
| `PERFORMANCE_HIBERNATE_STATISTICS_ENABLED` | false | Enable Hibernate stats |
| `PERFORMANCE_QUERY_PROFILING_ENABLED` | false | Enable query profiling |
| `CACHE_REDIS_ENABLED` | true | Enable Redis caching |
| `CACHE_TTL_ANNONCE` | 900 | Annonce cache TTL (seconds) |
| `CACHE_TTL_DOSSIER` | 600 | Dossier cache TTL (seconds) |

## 📈 Performance Targets

### Response Times (100 concurrent users)
| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Create Annonce | <100ms | <300ms | <500ms |
| Create Dossier | <150ms | <400ms | <650ms |
| Get Dossier | <50ms | <150ms | <300ms |

### System Metrics
| Metric | Target |
|--------|--------|
| Success Rate | >99% |
| Pool Utilization | 30-60% |
| Cache Hit Rate | >75% |
| CPU Utilization | <70% |

## 🛠️ Tools and Technologies

### Load Testing
- **Gatling 3.10.3**: Primary load testing tool (Scala-based)
- **K6**: Alternative load testing tool (JavaScript-based)

### Monitoring
- **Hibernate Statistics**: Query performance and N+1 detection
- **HikariCP JMX**: Connection pool metrics
- **Spring Actuator**: Application metrics
- **Prometheus**: Metrics collection
- **Grafana**: Visualization (dashboard provided)

### Optimization
- **Redis**: Distributed caching
- **PostgreSQL Indexes**: 30+ optimized indexes (Migration V111)
- **Batch Processing**: Hibernate batch operations

## 📁 File Structure

```
backend/
├── src/
│   ├── main/
│   │   └── java/com/example/backend/performance/
│   │       ├── HibernateStatisticsConfig.java
│   │       ├── HibernateStatisticsLogger.java
│   │       ├── QueryPerformanceAspect.java
│   │       ├── RedisCacheService.java
│   │       └── PerformanceMonitoringService.java
│   └── test/
│       └── scala/com/example/backend/loadtest/
│           ├── DossierCreationLoadTest.scala
│           ├── SpikeLoadTest.scala
│           ├── StressLoadTest.scala
│           └── EnduranceLoadTest.scala
├── k6-tests/
│   ├── dossier-creation-load.js
│   ├── spike-load.js
│   ├── stress-load.js
│   └── README.md
├── PERFORMANCE_LOAD_TESTING.md           # Comprehensive guide
├── PERFORMANCE_QUICK_REFERENCE.md        # Quick commands & tips
├── PERFORMANCE_BASELINE_TEMPLATE.md      # Report template
├── grafana-dashboard-performance.json    # Grafana dashboard
├── run-load-tests.sh                     # Load test runner (Linux/Mac)
└── run-load-tests.ps1                    # Load test runner (Windows)
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) | Complete guide with detailed explanations |
| [PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md) | Quick commands and troubleshooting |
| [PERFORMANCE_BASELINE_TEMPLATE.md](PERFORMANCE_BASELINE_TEMPLATE.md) | Template for baseline reports |
| [k6-tests/README.md](k6-tests/README.md) | K6 load testing guide |

## 🔍 Monitoring and Debugging

### Enable Detailed Logging

```bash
# Enable all performance monitoring
export PERFORMANCE_HIBERNATE_STATISTICS_ENABLED=true
export PERFORMANCE_QUERY_PROFILING_ENABLED=true
export PERFORMANCE_MONITORING_ENABLED=true
export HIBERNATE_GENERATE_STATISTICS=true
mvn spring-boot:run
```

### Watch Performance Logs

```bash
# All performance metrics
tail -f logs/spring.log | grep -E "Hibernate|HikariCP|Redis|SLOW"

# N+1 query detection only
tail -f logs/spring.log | grep "N+1 QUERY"

# Slow queries only
tail -f logs/spring.log | grep "🐌 SLOW"
```

### Access Performance Endpoints

```bash
# Connection pool metrics
curl http://localhost:8080/api/v1/performance/metrics

# Cache statistics
curl http://localhost:8080/api/v1/performance/cache/stats

# Invalidate cache
curl -X POST http://localhost:8080/api/v1/performance/cache/invalidate

# Prometheus metrics
curl http://localhost:8080/actuator/prometheus
```

## 🎨 Grafana Dashboard

Import the performance dashboard:
1. Open Grafana
2. Go to Dashboards → Import
3. Upload `grafana-dashboard-performance.json`
4. Configure Prometheus datasource

**Dashboard Includes:**
- HTTP request duration (P95/P99)
- Request rate
- Connection pool utilization
- Cache hit rate
- JVM memory usage
- GC pause times
- Success rate

## 🐛 Troubleshooting

### Issue: Slow Response Times

**Check:**
```bash
# Enable query profiling
export PERFORMANCE_QUERY_PROFILING_ENABLED=true

# Look for slow queries
grep "SLOW QUERY" logs/spring.log
```

**Solutions:**
- Add database indexes (check `V111__Add_performance_optimization_indexes.sql`)
- Enable Redis caching
- Use JOIN FETCH for associations

### Issue: Connection Pool Exhaustion

**Check:**
```bash
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

**Solutions:**
- Increase `HIKARI_MAX_POOL_SIZE`
- Check for connection leaks
- Optimize slow queries

### Issue: N+1 Queries Detected

**Check Hibernate logs:**
```
⚠️ POTENTIAL N+1 QUERY DETECTED: Entity fetch count (2345) is much higher than query count (234)
```

**Solutions:**
```java
// Use JOIN FETCH
@Query("SELECT d FROM Dossier d LEFT JOIN FETCH d.parties")
List<Dossier> findAllWithParties();

// Or @EntityGraph
@EntityGraph(attributePaths = {"parties", "appointments"})
List<Dossier> findAll();
```

## 🚦 Performance Checklist

Before production deployment:
- [ ] Run all load tests and verify targets are met
- [ ] Review Hibernate statistics for N+1 queries
- [ ] Verify connection pool size is adequate
- [ ] Confirm cache hit rate >75%
- [ ] Check database indexes are in place (V111 migration)
- [ ] Set up Grafana dashboard
- [ ] Configure alerts for performance degradation
- [ ] Document performance baseline

## 📞 Support

For performance issues:
1. Check [PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md) for common issues
2. Review Gatling reports for bottlenecks
3. Analyze Hibernate statistics logs
4. Check database slow query logs
5. Monitor connection pool and cache metrics

## 📝 License

Same as the main project.
