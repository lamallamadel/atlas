# GDPR and Data Residency Compliance

## Overview

This document describes how Atlas CRM ensures GDPR compliance and data residency requirements through regional data isolation in the multi-region architecture.

## Data Classification

### Global Entities (Replicated Across Regions)

These entities are synchronized across all regions using PostgreSQL logical replication:

1. **Organization** - Company/tenant configuration
   - Basic organization metadata
   - Settings and preferences
   - Does NOT include sensitive customer data

2. **User Accounts** (app_user)
   - Authentication credentials
   - User profile information
   - Role and permission assignments
   - User preferences

3. **Referential Data**
   - Code lists and lookup values
   - System configurations
   - Translations

4. **System Configuration**
   - Application settings
   - Feature flags
   - Integration configurations

**Justification for Replication:**
- These entities enable users to access the system from any region
- Single sign-on (SSO) requires synchronized user accounts
- No personally identifiable customer data is included
- Users consent to account data replication during registration

### Regional Entities (Isolated by Region)

These entities are stored ONLY in the region where they are created:

1. **Dossier** - Real estate case files
   - Contains customer personal data
   - Property information
   - Transaction details
   - Must remain in customer's region per GDPR

2. **Annonce** - Property listings
   - Property details
   - Owner information
   - Contact information
   - Geographically specific

3. **Document** - File attachments
   - Contracts and legal documents
   - Identity documents
   - Financial records
   - Highly sensitive, region-locked

4. **Activity** - User actions and events
   - Audit trail for GDPR compliance
   - Must be stored where data resides
   - Subject to data retention policies

5. **Audit Events** - System audit logs
   - Access logs
   - Data modification history
   - Required for GDPR Article 30 compliance

6. **Messages** - Communications
   - Customer communications
   - Email/SMS/WhatsApp messages
   - Must comply with ePrivacy Directive

## Regional Data Flow

```
┌─────────────────────────────────────────────────────┐
│                 User in France                       │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│          Geo-Routing (Cloudflare + Route53)         │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              EU-West-1 (Paris)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │           Application Layer                   │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼──────────┬───────────────────┐  │
│  │   Global Entities       │ Regional Entities  │  │
│  │   (Replicated)          │ (Isolated)         │  │
│  │                         │                    │  │
│  │ • User Account    ◄──┐  │ • Dossier         │  │
│  │ • Organization       │  │ • Annonce         │  │
│  │ • Referential        │  │ • Document        │  │
│  └──────────────────────┼──┴──────────────────┘  │
│                         │                          │
└─────────────────────────┼──────────────────────────┘
                          │
              Logical Replication
              (Global Entities Only)
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  US-East-1  │   │AP-Southeast-1│   │  Other Regions│
│  (Replica)  │   │  (Replica)   │   │   (Replica)   │
└─────────────┘   └──────────────┘   └──────────────┘
```

## GDPR Compliance Implementation

### Article 5: Principles

**1. Lawfulness, fairness, and transparency**
```java
// Backend enforcement of regional data access
@PreAuthorize("hasRegionalAccess(#dossierId)")
public Dossier getDossier(Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId);
    
    // Verify dossier is in user's authorized region
    if (!dossier.getRegion().equals(getCurrentUserRegion())) {
        throw new AccessDeniedException("Cross-region access denied");
    }
    
    return dossier;
}
```

**2. Purpose limitation**
- Regional data used only for real estate transactions in that region
- Global data used only for authentication and system operation
- Cross-region queries explicitly blocked at application level

**3. Data minimization**
- Only essential fields replicated globally
- Sensitive fields excluded from replication
- Documents stored in region-specific S3 buckets

**4. Accuracy**
- Version tracking on global entities for conflict resolution
- Audit trails for all data modifications
- Data validation before replication

**5. Storage limitation**
```sql
-- Automated data retention policy
CREATE TABLE data_retention_policy (
    entity_type VARCHAR(50) PRIMARY KEY,
    retention_days INTEGER NOT NULL,
    deletion_strategy VARCHAR(50) NOT NULL
);

INSERT INTO data_retention_policy VALUES
    ('dossier', 2555, 'SOFT_DELETE'),  -- 7 years
    ('document', 3650, 'HARD_DELETE'), -- 10 years
    ('audit_event', 2555, 'ARCHIVE');  -- 7 years
```

**6. Integrity and confidentiality**
- TLS 1.3 for data in transit
- AES-256 encryption at rest (RDS, S3)
- Database-level encryption for replication
- VPC isolation between regions

### Article 12-14: Transparency

**Privacy Notice Generation:**
```java
@GetMapping("/api/privacy/data-location")
public DataLocationInfo getDataLocation(@AuthenticationPrincipal User user) {
    return DataLocationInfo.builder()
        .userRegion(user.getRegion())
        .dataStorageLocation(getRegionDisplayName(user.getRegion()))
        .globalDataCategories(List.of("User account", "Organization", "System config"))
        .regionalDataCategories(List.of("Dossiers", "Documents", "Messages"))
        .replicationStatus("Global entities replicated to: EU, US, APAC")
        .build();
}
```

### Article 15: Right of Access

**Data Export:**
```java
@GetMapping("/api/gdpr/export")
public ResponseEntity<Resource> exportUserData(@AuthenticationPrincipal User user) {
    // Collect all user data from current region
    Map<String, Object> userData = new HashMap<>();
    userData.put("user_account", userService.getUserData(user.getId()));
    userData.put("dossiers", dossierService.getUserDossiers(user.getId()));
    userData.put("documents", documentService.getUserDocuments(user.getId()));
    userData.put("activities", activityService.getUserActivities(user.getId()));
    
    // Generate JSON export
    String json = objectMapper.writeValueAsString(userData);
    
    // Return as downloadable file
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user-data.json")
        .contentType(MediaType.APPLICATION_JSON)
        .body(new ByteArrayResource(json.getBytes()));
}
```

### Article 16: Right to Rectification

Implemented through standard update APIs with audit trails:
```java
@PutMapping("/api/dossiers/{id}")
@Audited(action = "UPDATE", entity = "DOSSIER")
public Dossier updateDossier(@PathVariable Long id, @RequestBody DossierDTO dto) {
    // Update triggers version increment
    // Audit event created automatically
    return dossierService.update(id, dto);
}
```

### Article 17: Right to Erasure

**Soft Delete with Retention:**
```java
@DeleteMapping("/api/dossiers/{id}")
public ResponseEntity<Void> deleteDossier(@PathVariable Long id) {
    Dossier dossier = dossierService.findById(id);
    
    // Soft delete with retention period
    dossier.setDeletedAt(Instant.now());
    dossier.setDeletionReason("USER_REQUEST");
    dossier.setHardDeleteAt(Instant.now().plus(30, ChronoUnit.DAYS));
    
    dossierRepository.save(dossier);
    
    // Schedule hard deletion after retention period
    deletionScheduler.scheduleHardDeletion(dossier);
    
    return ResponseEntity.noContent().build();
}
```

### Article 20: Right to Data Portability

Export in machine-readable format (JSON):
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.atlas-crm.com/api/gdpr/export \
  -o my-data.json
```

### Article 30: Records of Processing

**Automated Audit Logging:**
```java
@Aspect
@Component
public class GDPRAuditAspect {
    
    @Around("@annotation(Audited)")
    public Object auditDataAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        AuditEvent event = new AuditEvent();
        event.setAction(getAuditAction(joinPoint));
        event.setEntityType(getEntityType(joinPoint));
        event.setUserId(getCurrentUserId());
        event.setRegion(getCurrentRegion());
        event.setTimestamp(Instant.now());
        
        try {
            Object result = joinPoint.proceed();
            event.setStatus("SUCCESS");
            return result;
        } catch (Exception e) {
            event.setStatus("FAILED");
            event.setErrorMessage(e.getMessage());
            throw e;
        } finally {
            auditRepository.save(event);
        }
    }
}
```

### Article 32: Security of Processing

**Security Measures Implemented:**

1. **Encryption at Rest**
   - RDS: AES-256 with AWS KMS
   - S3: Server-side encryption (SSE-KMS)
   - ElastiCache: Encryption enabled
   - Secrets Manager: Encrypted credentials

2. **Encryption in Transit**
   - TLS 1.3 minimum
   - Certificate pinning for mobile apps
   - VPN for inter-region replication

3. **Access Controls**
   - IAM roles with least privilege
   - MFA for administrative access
   - IP allowlisting for databases
   - Security groups restricting network access

4. **Monitoring**
   - CloudWatch alarms for security events
   - AWS CloudTrail for API auditing
   - VPC Flow Logs for network monitoring
   - Real-time alerting for anomalies

### Article 33-34: Data Breach Notification

**Automated Breach Detection:**
```java
@Component
public class BreachDetectionService {
    
    @Scheduled(fixedRate = 60000) // Every minute
    public void detectAnomalies() {
        // Check for unusual data access patterns
        List<AuditEvent> recentEvents = auditRepository
            .findByTimestampAfter(Instant.now().minus(5, ChronoUnit.MINUTES));
        
        // Detect potential breaches
        if (hasUnusualAccessPattern(recentEvents)) {
            sendBreachAlert();
            lockAffectedAccounts();
            initiateIncidentResponse();
        }
    }
    
    private void sendBreachAlert() {
        // Notify DPO and security team
        notificationService.send(
            NotificationType.SECURITY_ALERT,
            "Potential data breach detected",
            SecurityTeam.ALL
        );
        
        // Log to SIEM
        siemService.logSecurityEvent("POTENTIAL_BREACH", EventSeverity.CRITICAL);
    }
}
```

## Data Subject Rights API

```java
@RestController
@RequestMapping("/api/gdpr")
public class GDPRController {
    
    @GetMapping("/my-data")
    public DataSubjectResponse getMyData(@AuthenticationPrincipal User user) {
        // Article 15: Right of access
    }
    
    @PostMapping("/rectify")
    public void rectifyData(@RequestBody RectificationRequest request) {
        // Article 16: Right to rectification
    }
    
    @DeleteMapping("/erase")
    public void eraseData(@AuthenticationPrincipal User user) {
        // Article 17: Right to erasure
    }
    
    @GetMapping("/export")
    public Resource exportData(@AuthenticationPrincipal User user) {
        // Article 20: Right to data portability
    }
    
    @PostMapping("/restrict")
    public void restrictProcessing(@AuthenticationPrincipal User user) {
        // Article 18: Right to restriction
    }
    
    @PostMapping("/object")
    public void objectToProcessing(@AuthenticationPrincipal User user) {
        // Article 21: Right to object
    }
}
```

## Regional Data Access Control

```sql
-- Row-level security for regional data isolation
ALTER TABLE dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY dossier_region_isolation ON dossier
    USING (region = current_setting('app.current_region'));

-- Set region context for each session
SET app.current_region = 'eu-west-1';
```

## Compliance Verification

### Automated Compliance Tests

```java
@Test
public void testRegionalDataIsolation() {
    // Create dossier in EU region
    Dossier euDossier = createDossier("eu-west-1");
    
    // Switch to US region context
    switchRegion("us-east-1");
    
    // Attempt to access EU dossier from US region
    assertThrows(AccessDeniedException.class, () -> {
        dossierService.getDossier(euDossier.getId());
    });
}

@Test
public void testGlobalEntityReplication() {
    // Create organization in EU
    Organization org = createOrganization("eu-west-1");
    
    // Wait for replication
    await().atMost(10, SECONDS).until(() -> 
        organizationExists(org.getId(), "us-east-1")
    );
    
    // Verify accessible from all regions
    switchRegion("us-east-1");
    Organization usOrg = organizationService.get(org.getId());
    assertEquals(org.getName(), usOrg.getName());
}
```

### Manual Compliance Checklist

- [ ] All regional entities have `region` column
- [ ] Regional data access enforced at application layer
- [ ] Cross-region queries blocked by default
- [ ] Audit logs enabled for all data access
- [ ] Data retention policies implemented
- [ ] GDPR data subject rights APIs functional
- [ ] Privacy notices updated and accessible
- [ ] Breach notification procedures tested
- [ ] Regular security audits scheduled
- [ ] Data Processing Agreements in place

## Regional Regulations

### European Union (GDPR)
- Data stored in EU-West-1 (Frankfurt or Paris)
- Complies with GDPR Articles 5, 12-22, 30-34
- DPA with AWS ensures data protection
- EU-US data transfers via Standard Contractual Clauses

### United States
- Data stored in US-East-1 (Virginia)
- Complies with state-specific laws (CCPA, CPRA, etc.)
- Health data: HIPAA compliance if enabled
- Financial data: SOC 2 Type II certified

### Asia Pacific
- Data stored in AP-Southeast-1 (Singapore)
- Complies with PDPA (Singapore)
- Australia: Privacy Act compliance
- China: Data localization when required

## Contact Information

**Data Protection Officer (DPO)**
- Email: dpo@atlas-crm.com
- Phone: +33 1 XX XX XX XX

**Data Subject Rights Requests**
- Email: privacy@atlas-crm.com
- Portal: https://atlas-crm.com/privacy/request

**Security Incidents**
- Email: security@atlas-crm.com
- Emergency: +33 1 XX XX XX XX (24/7)
