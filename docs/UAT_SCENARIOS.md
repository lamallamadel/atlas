# UAT Scenarios Documentation

This document describes the User Acceptance Testing (UAT) scenarios for the application's core features.

## Table of Contents
- [UAT-01: Create Annonce via Wizard with ACTIVE Status](#uat-01-create-annonce-via-wizard-with-active-status)
- [UAT-02: Edit Annonce rulesJson](#uat-02-edit-annonce-rulesjson)
- [UAT-03: Create Dossier Linked to Annonce](#uat-03-create-dossier-linked-to-annonce)
- [UAT-04: Patch Dossier Status](#uat-04-patch-dossier-status)
- [UAT-05: Anti-Doublons Soft Warning](#uat-05-anti-doublons-soft-warning)
- [UAT-06: Annonce ARCHIVED Validation](#uat-06-annonce-archived-validation)

---

## UAT-01: Create Annonce via Wizard with ACTIVE Status

### Description
Test the creation of a new annonce through the multi-step wizard process, ensuring it can be created with an ACTIVE status.

### Acceptance Criteria
- User can successfully create an annonce with all required fields
- Annonce can be created with status set to ACTIVE
- All fields are properly validated
- Response includes the created annonce with a unique ID
- Created annonce appears in the list of annonces
- HTTP 201 status code is returned on success

### Test Steps

#### Prerequisites
- Application is running
- User has valid organization ID (`org-123`)

#### Steps
1. **Send POST request to create annonce**
   ```
   POST /api/v1/annonces
   Content-Type: application/json
   ```

2. **Request body:**
   ```json
   {
     "orgId": "org-123",
     "title": "Modern 3-Bedroom Apartment in City Center",
     "description": "Beautiful apartment with city views, fully renovated",
     "category": "Apartment",
     "type": "RENT",
     "address": "123 Main Street",
     "surface": 85.5,
     "city": "Paris",
     "price": 1500.00,
     "currency": "EUR",
     "photosJson": [
       "https://example.com/photo1.jpg",
       "https://example.com/photo2.jpg"
     ],
     "rulesJson": {
       "pets": false,
       "smoking": false,
       "minimumLease": 12
     }
   }
   ```

3. **Verify response:**
   - Status code: 201 Created
   - Response contains all submitted fields
   - `id` field is present and positive
   - `status` is set to "DRAFT" by default (or specify status explicitly)
   - `createdAt` and `updatedAt` timestamps are present

4. **Update status to ACTIVE:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "status": "ACTIVE"
   }
   ```

5. **Verify updated response:**
   - Status code: 200 OK
   - `status` field is now "ACTIVE"
   - `updatedAt` timestamp is updated

6. **Retrieve annonce by ID:**
   ```
   GET /api/v1/annonces/{id}
   ```
   - Status code: 200 OK
   - Verify all fields match created annonce
   - Verify status is "ACTIVE"

7. **List annonces with ACTIVE filter:**
   ```
   GET /api/v1/annonces?status=ACTIVE
   ```
   - Verify newly created annonce appears in results
   - Verify pagination metadata is correct

### Expected Results
- Annonce is created successfully with all provided data
- Status can be updated to ACTIVE
- Annonce is retrievable and appears in filtered lists
- All validations pass without errors

### Error Scenarios to Test
- Missing required field `orgId` → HTTP 400 with validation error
- Missing required field `title` → HTTP 400 with validation error
- Invalid `status` value → HTTP 400 with validation error
- Negative `price` value → HTTP 400 with validation error
- Negative `surface` value → HTTP 400 with validation error

---

## UAT-02: Edit Annonce rulesJson

### Description
Test the ability to update the rulesJson field of an existing annonce, which stores business rules as a flexible JSON object.

### Acceptance Criteria
- User can update rulesJson with new or modified key-value pairs
- Existing rules can be removed
- New rules can be added
- rulesJson supports nested objects
- Other annonce fields remain unchanged when only rulesJson is updated
- Invalid JSON is rejected with appropriate error

### Test Steps

#### Prerequisites
- An existing annonce with ID (from UAT-01 or created separately)
- Initial rulesJson: `{"pets": false, "smoking": false, "minimumLease": 12}`

#### Steps
1. **Get current annonce state:**
   ```
   GET /api/v1/annonces/{id}
   ```
   - Note the current `rulesJson` and `updatedAt` values

2. **Update rulesJson with new rules:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "rulesJson": {
       "pets": true,
       "smoking": false,
       "minimumLease": 6,
       "parking": true,
       "amenities": {
         "wifi": true,
         "heating": "central",
         "elevator": true
       }
     }
   }
   ```

3. **Verify response:**
   - Status code: 200 OK
   - `rulesJson` reflects all new values
   - `pets` changed from false to true
   - `minimumLease` changed from 12 to 6
   - New `parking` field is present
   - Nested `amenities` object is properly stored
   - Other fields (title, description, etc.) remain unchanged
   - `updatedAt` timestamp is more recent

4. **Retrieve annonce to confirm persistence:**
   ```
   GET /api/v1/annonces/{id}
   ```
   - Verify `rulesJson` matches the updated values
   - Verify nested objects are intact

5. **Partially update rulesJson:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "rulesJson": {
       "pets": true,
       "minimumLease": 3
     }
   }
   ```
   - Verify that the entire rulesJson is replaced (not merged)

6. **Clear rulesJson:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "rulesJson": {}
   }
   ```
   - Verify `rulesJson` is now an empty object

7. **Set rulesJson to null:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "rulesJson": null
   }
   ```
   - Verify `rulesJson` is null in response

### Expected Results
- rulesJson can be updated with complex nested structures
- Updates are persisted correctly in the database
- JSON data types are preserved (boolean, number, string, object)
- Other annonce fields are not affected by rulesJson updates

### Error Scenarios to Test
- Invalid JSON syntax → HTTP 400
- Non-existent annonce ID → HTTP 404

---

## UAT-03: Create Dossier Linked to Annonce

### Description
Test the creation of a dossier (case/folder) that is linked to an existing annonce.

### Acceptance Criteria
- User can create a dossier linked to a valid annonce
- Dossier contains reference to the annonce ID
- Dossier is created with NEW status by default
- Lead information is properly stored
- Initial party (partie prenante) can be created with the dossier
- Dossier appears in filtered queries by annonceId

### Test Steps

#### Prerequisites
- An existing active annonce with ID (from UAT-01)
- Valid organization ID (`org-123`)

#### Steps
1. **Create dossier linked to annonce:**
   ```
   POST /api/v1/dossiers
   Content-Type: application/json
   ```
   ```json
   {
     "orgId": "org-123",
     "annonceId": 1,
     "leadPhone": "+33612345678",
     "leadName": "Jean Dupont",
     "leadSource": "Website Contact Form",
     "score": 75,
     "source": "WEB",
     "initialParty": {
       "phone": "+33612345678",
       "email": "jean.dupont@example.com",
       "name": "Jean Dupont",
       "role": "LOCATAIRE",
       "comment": "Interested in viewing the apartment next week"
     }
   }
   ```

2. **Verify response:**
   - Status code: 201 Created
   - Response contains `id`, `orgId`, `annonceId`
   - `annonceId` matches the provided value (1)
   - `status` is "NEW" by default
   - `leadPhone`, `leadName`, `leadSource` are correctly stored
   - `score` is 75
   - `source` is "WEB"
   - `createdAt` and `updatedAt` timestamps are present
   - `parties` array contains the initial party

3. **Retrieve dossier by ID:**
   ```
   GET /api/v1/dossiers/{id}
   ```
   - Verify all fields match created dossier
   - Verify `annonceId` is present and correct
   - Verify initial party is included in response

4. **List dossiers filtered by annonceId:**
   ```
   GET /api/v1/dossiers?annonceId=1
   ```
   - Verify newly created dossier appears in results
   - Verify only dossiers linked to annonce ID 1 are returned

5. **List dossiers filtered by leadPhone:**
   ```
   GET /api/v1/dossiers?leadPhone=%2B33612345678
   ```
   - Verify dossier appears in results
   - URL encoding of + sign is handled correctly

6. **Verify annonce link:**
   - If annonce endpoint provides related dossiers count, verify it's incremented
   - Dossier shows correct linkage to annonce

### Expected Results
- Dossier is created and linked to the specified annonce
- All lead information is captured correctly
- Initial party is created as part of dossier creation
- Dossier can be retrieved via various filters
- Foreign key relationship is maintained

### Error Scenarios to Test
- Missing required field `orgId` → HTTP 400
- Non-existent `annonceId` → HTTP 400 or creates dossier without annonce link (depending on validation rules)
- Invalid phone format (if validated) → HTTP 400
- Score outside 0-100 range → HTTP 400

---

## UAT-04: Patch Dossier Status

### Description
Test the partial update (PATCH) operation to change only the status of a dossier without affecting other fields.

### Acceptance Criteria
- User can update dossier status using PATCH endpoint
- Only status field is modified
- Valid status transitions are enforced
- Other fields remain unchanged
- Status history is tracked (if implemented)
- HTTP 200 status code is returned on success

### Test Steps

#### Prerequisites
- An existing dossier with status "NEW" (from UAT-03)

#### Steps
1. **Get current dossier state:**
   ```
   GET /api/v1/dossiers/{id}
   ```
   - Note current `status` ("NEW") and `updatedAt` values
   - Note other field values (leadName, score, etc.)

2. **Patch status to QUALIFIED:**
   ```
   PATCH /api/v1/dossiers/{id}/status
   Content-Type: application/json
   ```
   ```json
   {
     "status": "QUALIFIED"
   }
   ```

3. **Verify response:**
   - Status code: 200 OK
   - `status` field is now "QUALIFIED"
   - `updatedAt` timestamp is updated
   - All other fields remain unchanged:
     - `leadPhone` same as before
     - `leadName` same as before
     - `score` same as before
     - `annonceId` same as before

4. **Retrieve dossier to confirm:**
   ```
   GET /api/v1/dossiers/{id}
   ```
   - Verify `status` is "QUALIFIED"
   - Verify all other fields are unchanged

5. **Patch status to APPOINTMENT:**
   ```
   PATCH /api/v1/dossiers/{id}/status
   Content-Type: application/json
   ```
   ```json
   {
     "status": "APPOINTMENT"
   }
   ```
   - Verify status code: 200 OK
   - Verify status updated to "APPOINTMENT"

6. **Patch status to WON:**
   ```
   PATCH /api/v1/dossiers/{id}/status
   Content-Type: application/json
   ```
   ```json
   {
     "status": "WON"
   }
   ```
   - Verify status code: 200 OK
   - Verify status updated to "WON"

7. **Patch status to LOST:**
   ```
   PATCH /api/v1/dossiers/{id}/status
   Content-Type: application/json
   ```
   ```json
   {
     "status": "LOST"
   }
   ```
   - Verify status code: 200 OK
   - Verify status updated to "LOST"

8. **Filter dossiers by status:**
   ```
   GET /api/v1/dossiers?status=LOST
   ```
   - Verify updated dossier appears in results

### Expected Results
- Status can be updated independently of other fields
- PATCH operation is efficient (only updates necessary fields)
- Status transitions follow valid workflow
- Timestamp tracking works correctly
- Filtering by status returns correct results

### Error Scenarios to Test
- Non-existent dossier ID → HTTP 404
- Invalid status value → HTTP 400
- Missing status field in body → HTTP 400
- Empty request body → HTTP 400

---

## UAT-05: Anti-Doublons Soft Warning

### Description
Test the duplicate detection system that checks for existing dossiers with the same phone number and provides a soft warning without blocking creation.

### Acceptance Criteria
- System detects existing open dossiers with same phone number
- Dossier creation is NOT blocked (soft warning)
- Response includes warning with ID of existing dossier
- Warning only applies to open/active dossiers (not LOST or closed)
- User can proceed with creating duplicate dossier
- Both dossiers can coexist in the system

### Test Steps

#### Prerequisites
- An existing dossier with phone number "+33612345678" and status "NEW" or "QUALIFIED" (from UAT-03)

#### Steps
1. **Verify existing dossier:**
   ```
   GET /api/v1/dossiers?leadPhone=%2B33612345678
   ```
   - Note the ID of existing dossier
   - Verify status is "NEW", "QUALIFIED", or "APPOINTMENT" (not LOST or WON)

2. **Create new dossier with same phone number:**
   ```
   POST /api/v1/dossiers
   Content-Type: application/json
   ```
   ```json
   {
     "orgId": "org-123",
     "annonceId": 1,
     "leadPhone": "+33612345678",
     "leadName": "Jean Dupont",
     "leadSource": "Phone Call",
     "score": 60,
     "source": "PHONE",
     "initialParty": {
       "phone": "+33612345678",
       "email": "jean.dupont@example.com",
       "name": "Jean Dupont",
       "role": "LOCATAIRE",
       "comment": "Called again about different property"
     }
   }
   ```

3. **Verify response:**
   - Status code: 201 Created (NOT 409 Conflict)
   - Response contains new dossier with new ID
   - Response includes `existingOpenDossierId` field
   - `existingOpenDossierId` contains the ID of the previously created dossier
   - New dossier is fully created and persisted

4. **Verify both dossiers exist:**
   ```
   GET /api/v1/dossiers?leadPhone=%2B33612345678
   ```
   - Response contains multiple dossiers
   - Both dossiers share the same phone number
   - Each has unique ID

5. **Test with closed dossier (should not warn):**
   - Update first dossier status to LOST:
     ```
     PATCH /api/v1/dossiers/{first-dossier-id}/status
     ```
     ```json
     {
       "status": "LOST"
     }
     ```
   
6. **Create another dossier with same phone:**
   ```
   POST /api/v1/dossiers
   Content-Type: application/json
   ```
   ```json
   {
     "orgId": "org-123",
     "leadPhone": "+33612345678",
     "leadName": "Jean Dupont",
     "leadSource": "Email",
     "score": 80,
     "source": "WEB"
   }
   ```
   - Verify `existingOpenDossierId` points to second dossier (not the LOST one)
   - Or no warning if only LOST dossiers exist

### Expected Results
- Duplicate detection works correctly based on phone number
- System provides informative warning without blocking operation
- Only open dossiers trigger the warning
- Closed/LOST dossiers are excluded from duplicate check
- User experience is not blocked by potential duplicates

### Edge Cases to Test
- No existing dossiers with phone → No warning field in response
- Multiple existing open dossiers → Warning includes first/most recent match
- Phone number with different formatting → System normalizes and detects (if implemented)
- Null or empty phone number → No duplicate check performed

---

## UAT-06: Annonce ARCHIVED Validation

### Description
Test validation rules and business logic when an annonce is moved to ARCHIVED status, ensuring proper constraints and behavior.

### Acceptance Criteria
- Annonce can be updated to ARCHIVED status
- ARCHIVED annonces are excluded from default listings
- ARCHIVED annonces can still be retrieved by ID
- ARCHIVED status can be filtered explicitly
- Attempting to create dossiers on ARCHIVED annonces fails (if validation exists)
- Status can be changed from ARCHIVED back to other statuses (reactivation)

### Test Steps

#### Prerequisites
- An existing annonce with status "ACTIVE" (from UAT-01)

#### Steps
1. **Get current annonce:**
   ```
   GET /api/v1/annonces/{id}
   ```
   - Verify current status is "ACTIVE"

2. **Update status to ARCHIVED:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "status": "ARCHIVED"
   }
   ```

3. **Verify response:**
   - Status code: 200 OK
   - `status` field is "ARCHIVED"
   - All other fields remain unchanged
   - `updatedAt` timestamp is updated

4. **Retrieve ARCHIVED annonce by ID:**
   ```
   GET /api/v1/annonces/{id}
   ```
   - Status code: 200 OK
   - Annonce is returned with status "ARCHIVED"
   - All data is intact

5. **List annonces without status filter:**
   ```
   GET /api/v1/annonces
   ```
   - Verify ARCHIVED annonce appears (unless explicitly excluded by default)
   - Or verify it does NOT appear if default behavior excludes archived

6. **List annonces with ACTIVE filter:**
   ```
   GET /api/v1/annonces?status=ACTIVE
   ```
   - Verify ARCHIVED annonce does NOT appear in results

7. **List annonces with ARCHIVED filter:**
   ```
   GET /api/v1/annonces?status=ARCHIVED
   ```
   - Verify ARCHIVED annonce appears in results
   - Only archived annonces are returned

8. **Test creating dossier on ARCHIVED annonce:**
   ```
   POST /api/v1/dossiers
   Content-Type: application/json
   ```
   ```json
   {
     "orgId": "org-123",
     "annonceId": 1,
     "leadPhone": "+33698765432",
     "leadName": "Marie Martin",
     "leadSource": "Website",
     "source": "WEB"
   }
   ```
   - If validation exists: Verify HTTP 400 with error message about archived annonce
   - If no validation: Dossier is created successfully (business logic dependent)

9. **Reactivate annonce:**
   ```
   PUT /api/v1/annonces/{id}
   Content-Type: application/json
   ```
   ```json
   {
     "status": "ACTIVE"
   }
   ```
   - Verify status code: 200 OK
   - Verify status is back to "ACTIVE"
   - Annonce appears in active listings again

10. **Archive with other field updates:**
    ```
    PUT /api/v1/annonces/{id}
    Content-Type: application/json
    ```
    ```json
    {
      "status": "ARCHIVED",
      "description": "This property has been rented - ARCHIVED"
    }
    ```
    - Verify both status and description are updated
    - Multiple fields can be updated simultaneously

### Expected Results
- Annonce can be transitioned to ARCHIVED status
- ARCHIVED annonces are properly filtered in queries
- Direct retrieval of ARCHIVED annonces still works
- Business rules for ARCHIVED annonces are enforced (if applicable)
- Status can be reversed (reactivation)

### Business Logic Considerations
- Should ARCHIVED annonces accept new dossiers?
- Should existing dossiers be affected when annonce is archived?
- Should there be a confirmation step before archiving?
- Should archived annonces auto-close related open dossiers?
- Are there audit log entries for archive/unarchive actions?

### Error Scenarios to Test
- Attempt to archive non-existent annonce → HTTP 404
- Invalid status value → HTTP 400

---

## General Testing Notes

### Environment Setup
- Ensure database is in a clean state before running UAT
- Use consistent test data across scenarios
- Document any environment-specific configurations

### Test Data Cleanup
- Consider creating cleanup scripts to reset test data
- Document which scenarios create persistent data
- Maintain referential integrity when cleaning up

### Performance Considerations
- Monitor response times for list endpoints with large datasets
- Test pagination with various page sizes
- Verify indexes are used for filtered queries

### Security Testing
- Verify organization ID isolation (users can only access their org's data)
- Test with invalid/malformed authentication tokens (if auth is implemented)
- Ensure sensitive data is not exposed in error messages

### API Documentation
- All scenarios should match OpenAPI/Swagger documentation
- Document any discrepancies found during UAT
- Update examples in API docs based on UAT findings
