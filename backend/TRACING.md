# OpenTelemetry Distributed Tracing

This application uses OpenTelemetry for distributed tracing with Micrometer integration.

## Configuration

### Default Configuration

By default, traces are exported to an OTLP endpoint at `http://localhost:4318/v1/traces` with 100% sampling.

### Environment Variables

- `OTLP_ENDPOINT`: OTLP endpoint URL (default: `http://localhost:4318/v1/traces`)
- `OTLP_AUTH_HEADER`: Optional authorization header for OTLP endpoint
- `OTLP_TIMEOUT`: Timeout for OTLP exports (default: `10s`)
- `OTLP_COMPRESSION`: Compression algorithm (default: `gzip`)
- `TRACING_SAMPLING_PROBABILITY`: Sampling probability 0.0-1.0 (default: `1.0`)

## Supported Backends

### Jaeger

**OTLP Endpoint (HTTP):**
```bash
export OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

**OTLP Endpoint (gRPC):**
```bash
export OTLP_ENDPOINT=http://localhost:4317
```

**Docker Compose:**
```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "16686:16686"  # Jaeger UI
    - "4317:4317"    # OTLP gRPC
    - "4318:4318"    # OTLP HTTP
  environment:
    - COLLECTOR_OTLP_ENABLED=true
```

**Jaeger UI:** http://localhost:16686

### Grafana Tempo

**OTLP Endpoint:**
```bash
export OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

**Docker Compose:**
```yaml
tempo:
  image: grafana/tempo:latest
  command: [ "-config.file=/etc/tempo.yaml" ]
  volumes:
    - ./tempo.yaml:/etc/tempo.yaml
    - ./tempo-data:/tmp/tempo
  ports:
    - "4317:4317"   # OTLP gRPC
    - "4318:4318"   # OTLP HTTP
    - "3200:3200"   # Tempo

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    - GFX_AUTH_ANONYMOUS_ENABLED=true
    - GFX_AUTH_ANONYMOUS_ORG_ROLE=Admin
  volumes:
    - ./grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
```

**Tempo Configuration (tempo.yaml):**
```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
        grpc:

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
```

**Grafana Datasource (grafana-datasources.yaml):**
```yaml
apiVersion: 1

datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    isDefault: true
```

## Instrumented Operations

### WhatsApp Cloud API Provider

- **Span Name:** `whatsapp.send`
- **Tags:**
  - `message.id`: Message entity ID
  - `org.id`: Organization ID
  - `message.channel`: Channel name
  - `message.to`: Recipient phone number
  - `template.code`: Template code (if applicable)

### Session Window Checks

- **Span Name:** `whatsapp.session.check`
- **Tags:**
  - `org.id`: Organization ID
  - `phone.number`: Phone number
  - `within.window`: Whether within session window

### Rate Limit Decisions

- **Span Name:** `whatsapp.ratelimit.check`
- **Tags:**
  - `org.id`: Organization ID
  - `quota.available`: Whether quota is available
  - `rate.limit.backend`: Redis or database

### Outbound Message Processing

- **Span Name:** `outbound.message.process`
- **Tags:**
  - `message.id`: Message entity ID
  - `message.channel`: Channel name
  - `message.attempt`: Attempt number
  - `org.id`: Organization ID
  - `session.id`: Session ID (if applicable)
  - `run.id`: Run ID (if applicable)
  - `hypothesis.id`: Hypothesis ID (if applicable)

## W3C Trace Context Propagation

The application propagates trace context using W3C Trace Context headers:
- `traceparent`: Trace ID, span ID, trace flags
- `tracestate`: Vendor-specific trace state

### Baggage Propagation

The following fields are propagated as W3C baggage:
- `sessionId`: User session ID
- `runId`: Experiment run ID
- `hypothesisId`: A/B test hypothesis ID

These baggage fields are automatically added to all child spans and correlated with logs.

## Log Correlation

Logs are automatically correlated with traces using MDC:
- `traceId`: OpenTelemetry trace ID
- `spanId`: Current span ID
- `sessionId`: Session ID (from baggage)
- `runId`: Run ID (from baggage)
- `hypothesisId`: Hypothesis ID (from baggage)

Log pattern includes trace information:
```
%5p [backend,%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n
```

## Production Configuration

### Sampling

For production, adjust sampling to reduce overhead:

```bash
export TRACING_SAMPLING_PROBABILITY=0.1  # 10% sampling
```

### Authentication

For secured OTLP endpoints:

```bash
export OTLP_AUTH_HEADER="Bearer your-token-here"
```

### Timeout and Compression

```bash
export OTLP_TIMEOUT=30s
export OTLP_COMPRESSION=gzip
```

## Disabling Tracing

To disable tracing entirely:

```bash
export TRACING_SAMPLING_PROBABILITY=0.0
```

Or set in `application.yml`:
```yaml
management:
  tracing:
    enabled: false
```

## Troubleshooting

### Traces Not Appearing

1. Check OTLP endpoint is reachable:
   ```bash
   curl http://localhost:4318/v1/traces
   ```

2. Check application logs for OTLP export errors

3. Verify sampling probability is > 0

4. Check Jaeger/Tempo backend is running and configured correctly

### Performance Impact

- Default sampling (100%) is suitable for development only
- Use 1-10% sampling in production
- OTLP export is asynchronous and should not block requests
- Compression (gzip) reduces network overhead by ~70%
