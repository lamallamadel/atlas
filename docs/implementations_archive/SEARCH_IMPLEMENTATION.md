# Search Implementation

## Overview

This document describes the implementation of advanced filtering and full-text search functionality for Annonces and Dossiers using Elasticsearch with PostgreSQL fallback.

## Features

### Backend

1. **Elasticsearch Integration**
   - Full-text search on Annonce (title, description, address)
   - Full-text search on Dossier (leadName, notes)
   - Fuzzy matching with 0.7 tolerance
   - Relevance scoring
   - Automatic indexing on create/update operations

2. **PostgreSQL Fallback**
   - Automatic fallback when Elasticsearch is unavailable
   - PostgreSQL full-text search using GIN indexes
   - Maintains search functionality without Elasticsearch

3. **Search API**
   - `GET /api/v1/search` - Main search endpoint with filters
   - `GET /api/v1/search/autocomplete` - Autocomplete endpoint (top 5 results)
   - Supports filtering by type (annonce/dossier), status, city, source, etc.
   - JSON-encoded filters parameter

### Frontend

1. **Global Search Bar**
   - Integrated in app header
   - Real-time autocomplete with 300ms debounce
   - Shows mixed results (annonces and dossiers)
   - Displays relevance scores when using Elasticsearch
   - Visual indicator for search backend (Elasticsearch vs PostgreSQL)

2. **Search Results Page**
   - Dedicated search page at `/search`
   - Advanced filtering options
   - Pagination support
   - Click to navigate to detail pages

## Database Changes

### Migration V8
- Added `notes` column to `dossier` table (TEXT)
- Created GIN indexes for PostgreSQL full-text search:
  - `idx_annonce_title_fts`
  - `idx_annonce_description_fts`
  - `idx_annonce_address_fts`
  - `idx_dossier_lead_name_fts`
  - `idx_dossier_notes_fts`

## Configuration

### Elasticsearch (Optional)

Add to `application.yml`:

```yaml
spring:
  elasticsearch:
    enabled: true
    uris: http://localhost:9200
    username: ""  # Optional
    password: ""  # Optional
```

Or use environment variables:
- `ELASTICSEARCH_ENABLED=true`
- `ELASTICSEARCH_URIS=http://localhost:9200`
- `ELASTICSEARCH_USERNAME` (optional)
- `ELASTICSEARCH_PASSWORD` (optional)

### Docker Compose

Start Elasticsearch:

```bash
cd infra
docker-compose up -d elasticsearch
```

## API Usage

### Search

```bash
# Search all types
curl -H "X-Org-Id: org-123" \
  "http://localhost:8080/api/v1/search?q=apartment"

# Search annonces only
curl -H "X-Org-Id: org-123" \
  "http://localhost:8080/api/v1/search?q=apartment&type=annonce"

# Search with filters
curl -H "X-Org-Id: org-123" \
  "http://localhost:8080/api/v1/search?q=paris&filters={\"status\":\"ACTIVE\",\"city\":\"Paris\"}"

# Autocomplete
curl -H "X-Org-Id: org-123" \
  "http://localhost:8080/api/v1/search/autocomplete?q=apa"
```

### Response Format

```json
{
  "results": [
    {
      "id": 1,
      "type": "annonce",
      "title": "Beautiful Apartment in Paris",
      "description": "3 bedroom apartment...",
      "relevanceScore": 2.45,
      "createdAt": "2024-01-01T12:00:00",
      "updatedAt": "2024-01-02T14:30:00"
    }
  ],
  "totalHits": 15,
  "elasticsearchAvailable": true
}
```

## Architecture

### Components

1. **Search Documents** (`entity.search`)
   - `AnnonceDocument` - Elasticsearch document for Annonce
   - `DossierDocument` - Elasticsearch document for Dossier

2. **Search Repositories** (`repository.search`)
   - `AnnonceSearchRepository` - Elasticsearch repository
   - `DossierSearchRepository` - Elasticsearch repository

3. **Search Service** (`service.SearchService`)
   - Handles search logic
   - Manages Elasticsearch/PostgreSQL fallback
   - Indexing operations

4. **Search Controller** (`controller.SearchController`)
   - REST API endpoints
   - Request validation

### Frontend Components

1. **SearchApiService** - API client for search endpoints
2. **GlobalSearchBarComponent** - Header search bar with autocomplete
3. **SearchComponent** - Full search results page

## Notes Field

Added `notes` field to Dossier:
- Backend: Updated `Dossier` entity, `DossierCreateRequest`, `DossierResponse`, `DossierMapper`
- Database: Migration V8 adds the column
- Search: Included in full-text search

## Automatic Indexing

- Annonces are automatically indexed when created or updated
- Dossiers are automatically indexed when created or updated
- Indexing is gracefully skipped if Elasticsearch is unavailable

## Testing

### With Elasticsearch

```bash
# Start Elasticsearch
cd infra && docker-compose up -d elasticsearch

# Run backend with Elasticsearch enabled
export ELASTICSEARCH_ENABLED=true
cd backend && mvn spring-boot:run
```

### Without Elasticsearch (PostgreSQL only)

```bash
# Run backend without Elasticsearch
cd backend && mvn spring-boot:run
```

The search will automatically use PostgreSQL full-text search as fallback.

## Performance

- Elasticsearch provides better performance for large datasets
- PostgreSQL fallback is suitable for small to medium datasets
- GIN indexes optimize PostgreSQL full-text search
- Fuzzy matching in Elasticsearch improves search accuracy
