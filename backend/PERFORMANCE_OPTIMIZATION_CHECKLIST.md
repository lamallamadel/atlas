# Performance Optimization Checklist

Comprehensive checklist for optimizing and validating backend performance.

## 📋 Pre-Deployment Checklist

### Database Optimization
- [x] **Database indexes created** (Migration V111)
  - 30+ optimized indexes for common query patterns
  - Partial indexes for filtered data (PostgreSQL)
  - Composite indexes for multi-column queries
- [x] **Query optimization**
  - All repository methods use pagination
  - JOIN FETCH used for associations where needed
  - Batch fetching configured (`@BatchSize`)
- [x] **N+1 query prevention**
  - Hibernate statistics monitoring enabled
  - Query profiling aspect active
  - Regular log reviews for N+1 warnings
- [ ] **Database maintenance scheduled**
  - Weekly VACUUM ANALYZE
  - Monthly REINDEX if needed
  - Quarterly index usage review

### Connection Pool Configuration
- [x] **HikariCP configured**
  - Maximum pool size: 50 (production), 100 (performance profile)
  - Minimum idle: 10-20
  - Leak detection enabled (60s threshold)
  - JMX monitoring enabled
- [x] **Pool sizing validated**
  - Load tested with target concurrent users
  - Utilization stays below 80%
  - No connection timeouts under load
- [ ] **Monitoring alerts configured**
  - Alert if utilization >80%
  - Alert if threads waiting for connections >0
  - Alert if connection timeouts >1/min

### Caching Strategy
- [x] **Redis caching implemented**
  - Active annonces (TTL: 5 min)
  - Individual annonces (TTL: 15 min)
  - Dossiers (TTL: 10 min)
  - Referential data (TTL: 1 hour)
  - User preferences (TTL: 30 min)
- [x] **Cache invalidation logic**
  - Automatic on create/update/delete
  - Manual invalidation endpoint available
- [x] **Cache monitoring**
  - Hit rate logging every 2 minutes
  - Target hit rate >75%
- [ ] **Cache warming implemented**
  - Preload frequently accessed data on startup
  - Scheduled cache refresh for stale data

### Hibernate Configuration
- [x] **Batch processing enabled**
  - Batch size: 25 (production), 50 (performance)
  - Fetch size: 50 (production), 100 (performance)
  - Order inserts/updates enabled
- [x] **Statistics monitoring**
  - Optional via `PERFORMANCE_HIBERNATE_STATISTICS_ENABLED`
  - N+1 query detection automatic
  - Query execution time tracking
- [x] **Second-level cache configured**
  - Disabled by default (Redis preferred)
  - Can enable for read-heavy entities if needed

### Application Configuration
- [x] **JVM tuning**
  - Heap size: -Xmx2g -Xms1g (minimum)
  - GC: G1GC recommended for low pause times
- [x] **Thread pool sizing**
  - Tomcat thread pool: Auto-configured
  - Async executor: Configured via `AsyncConfig`
- [x] **Resource limits**
  - File upload size limits configured
  - Request timeout configured

## 🧪 Load Testing

### Test Coverage
- [x] **Standard load test** (100 users, 1000 dossiers/hour)
  - Dossier creation workflow
  - Browse/search scenarios
  - Mixed workload
- [x] **Spike test** (sudden traffic bursts)
  - 0 → 500 → 1000 → 1500 users
  - Validates resilience
- [x] **Stress test** (find breaking point)
  - Gradual increase to max capacity
  - Identifies system limits
- [x] **Endurance test** (4+ hours)
  - Detects memory leaks
  - Validates stability
- [ ] **Production-like load test**
  - Replicate expected production traffic patterns
  - Include all critical user journeys

### Test Environments
- [ ] **Local environment tested**
  - Developer workstation specs
  - H2 database (for development)
- [ ] **Staging environment tested**
  - Production-like infrastructure
  - PostgreSQL database
  - Redis cache
- [ ] **Pre-production tested**
  - Exact production configuration
  - Real data volume (anonymized)

### Performance Targets Met
- [ ] **Response times**
  - P95 < 2000ms ✓
  - P99 < 5000ms ✓
- [ ] **Success rate**
  - >95% success rate ✓
  - <1% server errors ✓
- [ ] **Throughput**
  - Target req/s achieved ✓
  - Target dossiers/hour achieved ✓
- [ ] **Resource utilization**
  - CPU <70% average ✓
  - Memory <75% of allocated ✓
  - Connection pool <60% utilization ✓

## 📊 Monitoring and Observability

### Metrics Collection
- [x] **Spring Actuator enabled**
  - `/actuator/health`
  - `/actuator/metrics`
  - `/actuator/prometheus`
- [x] **Custom metrics**
  - Connection pool metrics
  - Cache hit rates
  - Query performance
- [ ] **Prometheus configured**
  - Scraping backend metrics
  - Retention period set
- [ ] **Grafana dashboards**
  - Performance dashboard imported
  - Alerts configured

### Logging
- [x] **Performance logging**
  - Slow query detection (>1s)
  - N+1 query warnings
  - Connection pool statistics
  - Cache statistics
- [x] **Log levels configured**
  - Production: WARN/ERROR
  - Performance testing: INFO/DEBUG
- [ ] **Log aggregation**
  - Centralized logging (ELK, CloudWatch, etc.)
  - Log retention policy

### Alerting
- [ ] **Critical alerts**
  - P95 response time >2s
  - Success rate <95%
  - Connection pool exhaustion
  - Database connection failures
- [ ] **Warning alerts**
  - P95 response time >1s
  - Cache hit rate <70%
  - Connection pool >80% utilized
  - High GC pause times
- [ ] **Alert destinations configured**
  - Email/Slack/PagerDuty
  - On-call rotation defined

## 🔧 Code Quality

### Query Optimization
- [ ] **All queries reviewed**
  - No SELECT * queries
  - Only necessary columns fetched
  - Appropriate indexes available
- [ ] **Pagination implemented**
  - All list endpoints paginated
  - Default page size: 20-50
  - Maximum page size enforced
- [ ] **DTO projections used**
  - List views use lightweight DTOs
  - Avoid loading full entities unnecessarily
- [ ] **Lazy loading configured correctly**
  - Associations marked as LAZY
  - Eager loading only where needed
  - @EntityGraph used appropriately

### Caching Usage
- [ ] **@Cacheable annotations reviewed**
  - Appropriate cache names
  - Correct TTL configuration
  - Cache keys well-designed
- [ ] **Cache invalidation validated**
  - @CacheEvict on updates/deletes
  - Consistent cache key generation
- [ ] **Cache-aside pattern**
  - Graceful degradation if Redis unavailable
  - No cache stampedes

### Async Processing
- [ ] **Async methods identified**
  - Long-running operations are async
  - @Async properly configured
  - Thread pool sized appropriately
- [ ] **Blocking operations minimized**
  - I/O operations are non-blocking where possible
  - External API calls use circuit breakers

## 🏗️ Infrastructure

### Database
- [ ] **Connection pool sized**
  - Based on load test results
  - Room for growth
- [ ] **Read replicas configured** (if needed)
  - For read-heavy workloads
  - Replication lag monitored
- [ ] **Backup and recovery**
  - Automated backups configured
  - Recovery tested
- [ ] **Maintenance windows**
  - VACUUM scheduled
  - Statistics updated regularly

### Caching Layer
- [ ] **Redis configured**
  - Persistence enabled (if needed)
  - Memory limit set
  - Eviction policy configured
- [ ] **Redis monitoring**
  - Memory usage tracked
  - Eviction rate monitored
- [ ] **Redis cluster** (for high availability)
  - 3+ node cluster
  - Sentinel or Cluster mode

### Application Servers
- [ ] **Horizontal scaling ready**
  - Stateless application design
  - Session management (if needed)
  - Sticky sessions configured (if needed)
- [ ] **Load balancer configured**
  - Health checks enabled
  - Session affinity (if needed)
  - SSL termination
- [ ] **Auto-scaling configured**
  - CPU-based scaling rules
  - Request rate scaling rules
  - Min/max instance counts

## 📈 Continuous Improvement

### Regular Reviews
- [ ] **Weekly performance reviews**
  - Check slow query logs
  - Review cache hit rates
  - Monitor connection pool
- [ ] **Monthly load tests**
  - Regression testing
  - Capacity planning
- [ ] **Quarterly optimization sprints**
  - Address technical debt
  - Implement new optimizations
  - Update baselines

### Performance Baselines
- [ ] **Baseline documented**
  - Current version performance recorded
  - Using PERFORMANCE_BASELINE_TEMPLATE.md
- [ ] **Baseline tracked over time**
  - Version-to-version comparison
  - Regression detection
- [ ] **Performance SLOs defined**
  - Service level objectives documented
  - Measured and reported regularly

### Knowledge Sharing
- [ ] **Documentation updated**
  - Performance guides current
  - Runbooks available
  - Troubleshooting guides complete
- [ ] **Team training**
  - Performance best practices
  - Load testing procedures
  - Monitoring and alerting

## ✅ Sign-off

### Development Team
- [ ] Code review completed
- [ ] All performance tests pass
- [ ] Documentation updated
- [ ] Knowledge transfer complete

**Signed:** ________________ **Date:** __________

### QA Team
- [ ] Load tests executed successfully
- [ ] Performance targets validated
- [ ] Monitoring verified
- [ ] Regression tests pass

**Signed:** ________________ **Date:** __________

### DevOps/SRE Team
- [ ] Infrastructure provisioned
- [ ] Monitoring configured
- [ ] Alerts tested
- [ ] Runbooks reviewed

**Signed:** ________________ **Date:** __________

### Product Owner
- [ ] Performance targets agreed
- [ ] Acceptance criteria met
- [ ] Ready for production

**Signed:** ________________ **Date:** __________

---

## 📊 Performance Summary

**Last Updated:** [Date]  
**Version:** [Version]  
**Environment:** [Environment]

### Key Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| P95 Response Time | <2000ms | [X]ms | ✓/✗ |
| Success Rate | >95% | [X]% | ✓/✗ |
| Throughput | [X] req/s | [X] req/s | ✓/✗ |
| Cache Hit Rate | >75% | [X]% | ✓/✗ |
| Pool Utilization | <60% | [X]% | ✓/✗ |

### Outstanding Issues
1. [Issue description] - Priority: [High/Medium/Low]
2. [Issue description] - Priority: [High/Medium/Low]

### Next Steps
1. [Action item] - Owner: [Name] - Due: [Date]
2. [Action item] - Owner: [Name] - Due: [Date]
