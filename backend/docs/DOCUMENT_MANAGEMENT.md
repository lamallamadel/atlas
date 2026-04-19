# Document Management System

## Overview

The document management system provides secure file upload, storage, and retrieval capabilities for dossiers. It supports both local filesystem and AWS S3 storage backends with configurable strategy selection.

## Features

- **Multi-tenant isolation**: Files are stored with orgId prefix to ensure tenant isolation
- **Configurable storage**: Switch between local filesystem and AWS S3 storage
- **File validation**: Type and size validation before upload
- **Virus scanning placeholder**: Ready for integration with antivirus services
- **RESTful API**: Complete CRUD operations via REST endpoints
- **Secure access**: Multi-tenant access control through orgId filtering

## Storage Strategies

### Local Filesystem Storage (Default)

Files are stored locally in the configured base path with the following structure:
```
{base-path}/{orgId}/dossiers/{dossierId}/{uuid}_{fileName}
```

**Configuration:**
```yaml
storage:
  strategy: localFileStorage
  local:
    base-path: ./storage
```

### AWS S3 Storage

Files are stored in S3 with the following key structure:
```
{orgId}/dossiers/{dossierId}/{uuid}_{fileName}
```

**Configuration:**
```yaml
storage:
  strategy: s3FileStorage
  s3:
    bucket-name: my-bucket
    region: us-east-1
    access-key: ${AWS_ACCESS_KEY}
    secret-key: ${AWS_SECRET_KEY}
```

If `access-key` and `secret-key` are not provided, the SDK will use the default credential provider chain (IAM roles, environment variables, etc.).

## API Endpoints

### Upload Document
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

Parameters:
  - dossierId: Long (required)
  - file: MultipartFile (required)

Response: 201 Created
{
  "id": 1,
  "orgId": "org-123",
  "dossierId": 456,
  "fileName": "contract.pdf",
  "fileType": "pdf",
  "fileSize": 1048576,
  "storagePath": "org-123/dossiers/456/uuid_contract.pdf",
  "uploadedBy": "user-id",
  "contentType": "application/pdf",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

### Download Document
```http
GET /api/v1/documents/{id}/download

Response: 200 OK
Content-Type: {file content type}
Content-Disposition: attachment; filename="{fileName}"
```

### Get Document Metadata
```http
GET /api/v1/documents/{id}

Response: 200 OK
{
  "id": 1,
  "orgId": "org-123",
  "dossierId": 456,
  "fileName": "contract.pdf",
  ...
}
```

### List Documents by Dossier
```http
GET /api/v1/documents/dossier/{dossierId}?page=0&size=20&sort=createdAt,desc

Response: 200 OK
{
  "content": [...],
  "pageable": {...},
  "totalElements": 10,
  "totalPages": 1
}
```

### Delete Document
```http
DELETE /api/v1/documents/{id}

Response: 204 No Content
```

## File Validation

### Allowed File Types
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- Documents: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`, `text/csv`

### Size Limits
Default maximum file size: 10MB (configurable via `storage.max-file-size`)

## Configuration Options

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 10MB

storage:
  strategy: localFileStorage  # or s3FileStorage
  max-file-size: 10485760     # bytes (10MB)
  
  # Local storage configuration
  local:
    base-path: ./storage
  
  # S3 storage configuration
  s3:
    bucket-name: my-document-bucket
    region: us-east-1
    access-key: ${AWS_ACCESS_KEY}
    secret-key: ${AWS_SECRET_KEY}
```

## Environment Variables

- `STORAGE_STRATEGY`: Storage backend (`localFileStorage` or `s3FileStorage`)
- `STORAGE_MAX_FILE_SIZE`: Maximum file size in bytes
- `STORAGE_LOCAL_BASE_PATH`: Base path for local file storage
- `STORAGE_S3_BUCKET_NAME`: S3 bucket name
- `STORAGE_S3_REGION`: AWS region
- `STORAGE_S3_ACCESS_KEY`: AWS access key (optional if using IAM roles)
- `STORAGE_S3_SECRET_KEY`: AWS secret key (optional if using IAM roles)
- `MULTIPART_MAX_FILE_SIZE`: Spring multipart max file size
- `MULTIPART_MAX_REQUEST_SIZE`: Spring multipart max request size

## Database Schema

```sql
CREATE TABLE document (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    uploaded_by VARCHAR(255),
    content_type VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_document_dossier FOREIGN KEY (dossier_id) 
        REFERENCES dossier(id) ON DELETE CASCADE
);
```

## Security

- All endpoints require authentication (`@PreAuthorize("hasAnyRole('ADMIN', 'PRO')")`)
- Multi-tenant isolation via `orgId` filtering
- File name sanitization to prevent path traversal attacks
- Content type validation
- File size limits

## Virus Scanning

The `DocumentService.performVirusScan()` method is a placeholder for integrating with antivirus services. Example integrations:

### ClamAV Integration
```java
private void performVirusScan(MultipartFile file) {
    try (InputStream is = file.getInputStream()) {
        ClamAVClient clamAV = new ClamAVClient("localhost", 3310);
        byte[] reply = clamAV.scan(is);
        if (!ClamAVClient.isCleanReply(reply)) {
            throw new FileValidationException("Virus detected in file");
        }
    } catch (IOException e) {
        throw new RuntimeException("Virus scan failed", e);
    }
}
```

### Cloud-based Scanning
- AWS GuardDuty Malware Protection
- Azure Defender for Storage
- Google Cloud Security Scanner

## Future Enhancements

- [ ] Document versioning
- [ ] File preview/thumbnail generation
- [ ] Full-text search integration
- [ ] Document expiration/archiving
- [ ] Shared document links with expiration
- [ ] Document templates
- [ ] Bulk upload support
- [ ] Document signing integration
- [ ] Audit trail for document access
