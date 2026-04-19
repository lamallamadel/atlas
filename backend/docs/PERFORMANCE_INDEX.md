# Performance Testing Suite - Index and Navigation

Quick reference guide to navigate all performance testing and optimization documentation.

## 📚 Documentation Map

### Getting Started (Start Here!)
1. **[PERFORMANCE_README.md](PERFORMANCE_README.md)** ⭐ **START HERE**
   - Overview of the entire suite
   - Quick start guide
   - 5-minute setup and first test run

2. **[PERFORMANCE_IMPLEMENTATION_SUMMARY.md](PERFORMANCE_IMPLEMENTATION_SUMMARY.md)**
   - What has been implemented
   - File inventory
   - Acceptance criteria

### Comprehensive Guides
3. **[PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md)**
   - Complete guide (500+ lines)
   - Load testing with Gatling
   - Performance monitoring setup
   - Database optimization
   - Redis caching strategy
   - Connection pool tuning
   - Performance baseline metrics
   - Optimization recommendations

### Quick References
4. **[PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md)**
   - Essential commands
   - Common issues and solutions
   - Performance targets
   - Monitoring patterns
   - Quick wins

### Templates and Checklists
5. **[PERFORMANCE_BASELINE_TEMPLATE.md](PERFORMANCE_BASELINE_TEMPLATE.md)**
   - Performance baseline report template
   - Use this to document each release's performance

6. **[PERFORMANCE_OPTIMIZATION_CHECKLIST.md](PERFORMANCE_OPTIMIZATION_CHECKLIST.md)**
   - Pre-deployment checklist
   - Load testing checklist
   - Monitoring setup
   - Code quality checks
   - Sign-off template

### K6 Load Tests
7. **[k6-tests/README.md](k6-tests/README.md)**
   - K6 load testing guide (alternative to Gatling)
   - JavaScript-based tests
   - Easier learning curve

---

## 🎯 Documentation by Use Case

### "I want to run my first load test"
1. Read: [PERFORMANCE_README.md](PERFORMANCE_README.md) - Quick Start section
2. Run: `./run-load-tests.sh standard`
3. View: `target/gatling/[test-name]/index.html`

### "I need to debug slow queries"
1. Read: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Database Query Profiling
2. Enable: `PERFORMANCE_QUERY_PROFILING_ENABLED=true`
3. Watch: `tail -f logs/spring.log | grep "SLOW QUERY"`

### "I want to optimize caching"
1. Read: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Redis Caching Strategy
2. Review: `RedisCacheService.java`
3. Monitor: Cache hit rates in logs

### "I need to prepare for production"
1. Read: [PERFORMANCE_OPTIMIZATION_CHECKLIST.md](PERFORMANCE_OPTIMIZATION_CHECKLIST.md)
2. Run: All load tests
3. Document: Use [PERFORMANCE_BASELINE_TEMPLATE.md](PERFORMANCE_BASELINE_TEMPLATE.md)
4. Complete: Checklist sign-offs

### "Something is slow and I don't know why"
1. Read: [PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md) - Troubleshooting section
2. Check: Common issues and solutions
3. Enable: Performance monitoring
4. Analyze: Logs and metrics

---

## 📂 Files by Category

### Source Code
**Java Classes:**
- `src/main/java/com/example/backend/performance/`
  - `HibernateStatisticsConfig.java` - Hibernate stats configuration
  - `HibernateStatisticsLogger.java` - Statistics logging and N+1 detection
  - `QueryPerformanceAspect.java` - AOP-based query profiling
  - `RedisCacheService.java` - Redis caching service
  - `PerformanceMonitoringService.java` - Connection pool and cache monitoring

**Controllers:**
- `src/main/java/com/example/backend/controller/`
  - `PerformanceController.java` - Performance API endpoints

**Gatling Tests:**
- `src/test/scala/com/example/backend/loadtest/`
  - `DossierCreationLoadTest.scala` - Standard load test
  - `SpikeLoadTest.scala` - Spike test
  - `StressLoadTest.scala` - Stress test
  - `EnduranceLoadTest.scala` - Endurance test

**K6 Tests:**
- `k6-tests/`
  - `dossier-creation-load.js` - Standard load test
  - `spike-load.js` - Spike test
  - `stress-load.js` - Stress test

### Database
**Migrations:**
- `src/main/resources/db/migration/`
  - `V111__Add_performance_optimization_indexes.sql` - 30+ optimized indexes

### Configuration
**Application Config:**
- `src/main/resources/application.yml` - Production configuration
- `src/main/resources/application-performance.yml` - Performance testing profile

**Build Config:**
- `pom.xml` - Maven dependencies (Gatling, etc.)
- `.gitignore` - Excludes test results

### Scripts
**Execution:**
- `run-load-tests.sh` - Load test runner (Linux/Mac)
- `run-load-tests.ps1` - Load test runner (Windows)
- `make-executable.sh` - Make scripts executable

### Monitoring
**Dashboards:**
- `grafana-dashboard-performance.json` - Grafana dashboard configuration

### Documentation
**Guides:**
- `PERFORMANCE_README.md` - Main entry point
- `PERFORMANCE_LOAD_TESTING.md` - Comprehensive guide
- `PERFORMANCE_QUICK_REFERENCE.md` - Quick reference
- `PERFORMANCE_IMPLEMENTATION_SUMMARY.md` - Implementation status

**Templates:**
- `PERFORMANCE_BASELINE_TEMPLATE.md` - Baseline report template
- `PERFORMANCE_OPTIMIZATION_CHECKLIST.md` - Pre-deployment checklist

**Index:**
- `PERFORMANCE_INDEX.md` - This file

**K6:**
- `k6-tests/README.md` - K6 usage guide

---

## 🔍 Quick Lookup

### Commands
```bash
# Standard load test
./run-load-tests.sh standard

# Enable monitoring
SPRING_PROFILES_ACTIVE=performance mvn spring-boot:run

# View metrics
curl http://localhost:8080/api/v1/performance/metrics

# Watch logs
tail -f logs/spring.log | grep -E "Hibernate|HikariCP|SLOW"
```

### Endpoints
- `GET /api/v1/performance/metrics` - Current performance metrics
- `GET /api/v1/performance/cache/stats` - Cache statistics
- `POST /api/v1/performance/cache/invalidate` - Invalidate all cache
- `GET /actuator/prometheus` - Prometheus metrics

### Configuration Flags
- `PERFORMANCE_HIBERNATE_STATISTICS_ENABLED` - Enable Hibernate stats (default: false)
- `PERFORMANCE_QUERY_PROFILING_ENABLED` - Enable query profiling (default: false)
- `PERFORMANCE_MONITORING_ENABLED` - Enable monitoring service (default: true)
- `HIKARI_MAX_POOL_SIZE` - Connection pool size (default: 50)
- `CACHE_REDIS_ENABLED` - Enable Redis cache (default: true)

### Performance Targets
| Metric | Target |
|--------|--------|
| P95 Response Time | <2000ms |
| P99 Response Time | <5000ms |
| Success Rate | >95% |
| Cache Hit Rate | >75% |
| Pool Utilization | <60% |

---

## 🎓 Learning Path

### Day 1: Introduction
1. Read [PERFORMANCE_README.md](PERFORMANCE_README.md)
2. Run first load test: `./run-load-tests.sh standard`
3. Review Gatling report

### Day 2: Deep Dive
1. Read [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md)
2. Enable performance monitoring
3. Review logs for insights

### Day 3: Optimization
1. Analyze slow queries
2. Review cache hit rates
3. Check connection pool utilization

### Week 2: Advanced Topics
1. Read [PERFORMANCE_OPTIMIZATION_CHECKLIST.md](PERFORMANCE_OPTIMIZATION_CHECKLIST.md)
2. Set up Grafana dashboard
3. Configure alerts

### Month 1: Production Ready
1. Complete all load test scenarios
2. Document baseline using template
3. Complete checklist sign-offs
4. Deploy to production

---

## 📞 Support

### For Questions About...

**Load Testing:**
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Load Testing with Gatling
- See: [k6-tests/README.md](k6-tests/README.md) - K6 Alternative

**Performance Monitoring:**
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Performance Monitoring
- Check: `HibernateStatisticsLogger.java`, `PerformanceMonitoringService.java`

**Database Optimization:**
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Database Index Optimization
- Check: `V111__Add_performance_optimization_indexes.sql`

**Caching:**
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Redis Caching Strategy
- Check: `RedisCacheService.java`

**Connection Pool:**
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Connection Pool Tuning
- Check: `application.yml`, `application-performance.yml`

**Troubleshooting:**
- See: [PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md) - Common Issues
- See: [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md) - Troubleshooting

---

## ✅ Quick Wins

Want immediate performance improvements? Check these:

1. **Enable Redis caching** → [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md#redis-caching-strategy)
2. **Add database indexes** → Run migration V111
3. **Optimize connection pool** → [PERFORMANCE_LOAD_TESTING.md](PERFORMANCE_LOAD_TESTING.md#connection-pool-tuning)
4. **Detect N+1 queries** → Enable Hibernate statistics
5. **Use pagination** → [PERFORMANCE_QUICK_REFERENCE.md](PERFORMANCE_QUICK_REFERENCE.md#application-level-optimization)

---

## 🗺️ Navigation Tips

- 📖 **Comprehensive learning** → Start with PERFORMANCE_LOAD_TESTING.md
- ⚡ **Quick answers** → Use PERFORMANCE_QUICK_REFERENCE.md
- ✅ **Pre-deployment** → Follow PERFORMANCE_OPTIMIZATION_CHECKLIST.md
- 📊 **Document baseline** → Use PERFORMANCE_BASELINE_TEMPLATE.md
- 🔍 **Find specific topic** → Use this index (PERFORMANCE_INDEX.md)

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Total Files:** 29 (15 source, 7 docs, 4 config, 2 scripts, 1 dashboard)
