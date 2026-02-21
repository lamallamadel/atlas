# K6 Load Tests

Alternative load testing suite using [K6](https://k6.io/) for performance testing.

## Prerequisites

Install K6:
```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Linux
sudo apt-get install k6
```

## Available Tests

### 1. Dossier Creation Load Test
Realistic user workflow: create annonce → create dossier → get dossier → update status

```bash
# Default (100 users, 60 minutes)
k6 run dossier-creation-load.js

# Custom configuration
k6 run dossier-creation-load.js \
  -e BASE_URL=http://localhost:8080 \
  -e CONCURRENT_USERS=150 \
  -e DURATION=120m
```

### 2. Spike Load Test
Tests application resilience under sudden traffic spikes

```bash
k6 run spike-load.js
```

### 3. Stress Load Test
Gradually increases load to find system breaking point

```bash
# Default (500 max users)
k6 run stress-load.js

# Custom max users
k6 run stress-load.js -e MAX_USERS=750
```

## Output Formats

### Console Output (Default)
```bash
k6 run dossier-creation-load.js
```

### JSON Output
```bash
k6 run dossier-creation-load.js --out json=results.json
```

### CSV Output
```bash
k6 run dossier-creation-load.js --out csv=results.csv
```

### InfluxDB + Grafana
```bash
k6 run dossier-creation-load.js --out influxdb=http://localhost:8086/k6
```

## Interpreting Results

### Key Metrics
- **http_req_duration**: Response time (p95, p99)
- **http_reqs**: Total requests and rate (req/s)
- **http_req_failed**: Error rate
- **vus**: Virtual users (concurrent connections)

### Success Criteria
- ✅ P95 response time < 2000ms
- ✅ P99 response time < 5000ms
- ✅ Error rate < 5%
- ✅ Successful requests > 95%

## Comparison: K6 vs Gatling

| Feature | K6 | Gatling |
|---------|-----|---------|
| Language | JavaScript | Scala/Java |
| Learning Curve | Easy | Moderate |
| Performance | Excellent | Excellent |
| Reports | CLI/JSON | Rich HTML |
| CI/CD Integration | Excellent | Good |
| Cloud Support | K6 Cloud | Gatling Enterprise |

## Example Output

```
✓ annonce created successfully
✓ dossier created successfully
✓ dossier retrieved successfully
✓ status updated successfully

checks.........................: 98.50% ✓ 7880  ✗ 120
data_received..................: 15 MB  250 kB/s
data_sent......................: 5.2 MB 87 kB/s
dossiers_created...............: 1970   32.83/s
http_req_duration..............: avg=285ms min=45ms med=220ms max=4.5s p(95)=680ms p(99)=1.2s
http_reqs......................: 7880   131.33/s
vus............................: 100    min=0 max=100
```

## Advanced Usage

### Custom Thresholds
```javascript
export const options = {
  thresholds: {
    'http_req_duration{scenario:create_dossier}': ['p(95)<500'],
    'errors': ['rate<0.01'],
  },
};
```

### Scenarios
```javascript
export const options = {
  scenarios: {
    create_workload: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
    },
    browse_workload: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
      ],
    },
  },
};
```
