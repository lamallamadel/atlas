# WhatsApp Conversation Flow Implementation Summary

## Overview

Fully implemented WhatsApp conversation flow manager for interactive appointment confirmations with finite state machine (FSM), keyword and semantic intent detection, automatic appointment status updates, and comprehensive activity timeline logging.

## Implementation Summary

### 1. Database Migration (V137)

**File:** `backend/src/main/resources/db/migration/V137__Create_conversation_flow_tables.sql`

Created two tables:

- **inbound_message**: Stores all incoming WhatsApp messages with processing status
- **conversation_state**: Manages FSM state for active conversations with 24-hour expiration

Key features:
- Uses `${json_type}` placeholder for H2/PostgreSQL compatibility
- Unique constraint on active conversations per phone number
- Foreign keys to appointment and dossier tables for cascading deletes
- Comprehensive indexes for efficient querying

### 2. Entity Classes

**Files:**
- `backend/src/main/java/com/example/backend/entity/InboundMessageEntity.java`
- `backend/src/main/java/com/example/backend/entity/ConversationStateEntity.java`
- `backend/src/main/java/com/example/backend/entity/enums/ConversationState.java`

**ConversationState Enum:**
```java
AWAITING_CONFIRMATION, CONFIRMED, CANCELLED, RESCHEDULED, EXPIRED
```

### 3. Updated Enums

**AppointmentStatus** - Added new statuses:
- CONFIRMED
- RESCHEDULED

**ActivityType** - Added conversation-related activities:
- CONVERSATION_STARTED
- CONVERSATION_REPLY
- APPOINTMENT_CONFIRMED
- APPOINTMENT_CANCELLED_BY_CLIENT
- APPOINTMENT_RESCHEDULED_BY_CLIENT

### 4. Repository Classes

**Files:**
- `backend/src/main/java/com/example/backend/repository/InboundMessageRepository.java`
- `backend/src/main/java/com/example/backend/repository/ConversationStateRepository.java`

Key queries:
- Find active conversations by phone number or appointment
- Find unprocessed messages
- Bulk expire old conversations

### 5. Core Service - ConversationStateManager

**File:** `backend/src/main/java/com/example/backend/service/ConversationStateManager.java`

**Key Features:**
- FSM implementation with state transitions
- Hybrid intent classification (keywords + semantic similarity)
- Automatic appointment status updates
- Activity timeline logging for all conversation turns
- Context data management for conversation history

**Intent Classification:**
1. **Keyword Matching**: Fast pattern matching for common French/English phrases
2. **Semantic Similarity**: Jaccard similarity for ambiguous messages
3. **Fallback**: Sends clarification messages for unclear intents

**Supported Keywords:**
- **Confirmation**: oui, yes, ok, confirme, d'accord, parfait, bien reçu
- **Cancellation**: annule, cancel, non, no, pas possible, impossible
- **Reschedule**: reprogrammer, reporter, décaler, changer, autre date

### 6. Response Service - ConversationResponseService

**File:** `backend/src/main/java/com/example/backend/service/ConversationResponseService.java`

Sends context-aware automated responses:
- Confirmation acknowledgment with appointment details
- Cancellation confirmation with reassurance
- Reschedule acknowledgment with callback promise
- Clarification requests for unclear messages

### 7. Integration with Appointment Reminders

**Modified File:** `backend/src/main/java/com/example/backend/service/AppointmentReminderScheduler.java`

**Changes:**
- Added ConversationStateManager dependency injection
- Automatically initializes conversation when WhatsApp reminder is sent
- Links conversation to appointment and dossier

### 8. Schedulers

**Files:**
- `backend/src/main/java/com/example/backend/service/ConversationExpirationScheduler.java`

Runs hourly to expire conversations older than 24 hours:
- Transitions AWAITING_CONFIRMATION → EXPIRED
- Prevents stale state from affecting new reminders

### 9. REST API Controllers

**Files:**
- `backend/src/main/java/com/example/backend/controller/ConversationController.java`
- `backend/src/main/java/com/example/backend/controller/WhatsAppWebhookController.java`

**ConversationController Endpoints:**
```
POST /api/conversations/inbound          - Receive inbound message
GET  /api/conversations/phone/{phone}    - Get active conversation
GET  /api/conversations/appointment/{id} - Get conversation by appointment
POST /api/conversations/initialize       - Initialize conversation
```

**WhatsAppWebhookController:**
```
GET  /api/webhooks/whatsapp - Webhook verification
POST /api/webhooks/whatsapp - Receive WhatsApp webhook
```

Processes Meta WhatsApp Cloud API webhook format automatically.

### 10. DTOs

**Files:**
- `backend/src/main/java/com/example/backend/dto/InboundMessageRequest.java`
- `backend/src/main/java/com/example/backend/dto/ConversationStateResponse.java`

### 11. Tests

**File:** `backend/src/test/java/com/example/backend/service/ConversationStateManagerTest.java`

Unit tests covering:
- Confirmation intent handling
- Cancellation intent handling
- Reschedule intent handling
- No active conversation scenario
- Conversation initialization
- Conversation expiration

### 12. Documentation

**File:** `backend/docs/CONVERSATION_FLOW.md`

Comprehensive documentation including:
- Architecture overview
- State machine diagram
- Database schema
- Feature descriptions
- API endpoints
- Configuration guide
- Testing instructions
- Security considerations

## Flow Diagram

```
1. Appointment Reminder Sent (WhatsApp)
   ↓
2. ConversationStateManager.initializeConversation()
   - Create ConversationStateEntity (AWAITING_CONFIRMATION)
   - Log CONVERSATION_STARTED activity
   ↓
3. Client Responds via WhatsApp
   ↓
4. Webhook receives message → WhatsAppWebhookController
   ↓
5. ConversationStateManager.processInboundMessage()
   - Save InboundMessageEntity
   - Find active conversation
   - Classify intent (keywords + semantic)
   - Log CONVERSATION_REPLY activity
   ↓
6. State Transition (based on intent)
   - CONFIRM → Update appointment to CONFIRMED
   - CANCEL → Update appointment to CANCELLED
   - RESCHEDULE → Update appointment to RESCHEDULED
   - Log activity (APPOINTMENT_CONFIRMED, etc.)
   ↓
7. ConversationResponseService sends automated response
   - Confirmation acknowledgment
   - Cancellation confirmation
   - Reschedule acknowledgment
   - Clarification request (if unclear)
   ↓
8. Activity Timeline Updated
   - All conversation turns logged
   - Linked to dossier for visibility
```

## Activity Timeline Integration

All conversation events are logged to the dossier activity timeline with metadata:

```json
{
  "type": "APPOINTMENT_CONFIRMED",
  "content": "Le client a confirmé le rendez-vous",
  "metadata": {
    "appointment_id": 123,
    "source": "whatsapp_conversation"
  }
}
```

This provides full visibility into client interactions and appointment status changes.

## Key Features Implemented

✅ **Migration V137** with inbound_message and conversation_state tables  
✅ **ConversationStateManager** service with FSM transitions  
✅ **Intent classification** using keyword detection and semantic similarity  
✅ **AppointmentEntity status updates** (CONFIRMED/CANCELLED/RESCHEDULED)  
✅ **Integration with SmartSuggestionsService** architecture (semantic similarity)  
✅ **Activity timeline logging** for all conversation turns  
✅ **Dossier linking** for full audit trail  
✅ **Automated responses** via ConversationResponseService  
✅ **WhatsApp webhook handler** for Meta Cloud API  
✅ **Conversation expiration scheduler** (24-hour TTL)  
✅ **Appointment reminder integration** (auto-initialize conversations)  
✅ **REST API endpoints** for manual testing and integrations  
✅ **Unit tests** for core FSM logic  
✅ **Comprehensive documentation**  

## Configuration

### application.yml

```yaml
# Conversation expiration scheduler
conversation.expiration.cron: 0 0 * * * ?  # Run every hour

# Appointment reminder integration
appointment.reminder.enabled: true
appointment.reminder.hours-ahead: 24
appointment.reminder.cron: 0 0/15 * * * ?
```

### WhatsApp Webhook Setup

1. Update verification token in `WhatsAppWebhookController`
2. Configure webhook URL in Meta Business Manager
3. Verify webhook with GET request
4. Start receiving inbound messages

## Testing

### Run Unit Tests
```bash
cd backend
mvn test -Dtest=ConversationStateManagerTest
```

### Manual API Testing
```bash
# Test confirmation
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Oui"}'

# Test cancellation
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Annuler"}'

# Test reschedule
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Reporter"}'

# Get active conversation
curl http://localhost:8080/api/conversations/phone/+33612345678 \
  -H "X-Org-Id: test-org"
```

## Files Created/Modified

### Created Files (16)
1. `backend/src/main/resources/db/migration/V137__Create_conversation_flow_tables.sql`
2. `backend/src/main/java/com/example/backend/entity/InboundMessageEntity.java`
3. `backend/src/main/java/com/example/backend/entity/ConversationStateEntity.java`
4. `backend/src/main/java/com/example/backend/entity/enums/ConversationState.java`
5. `backend/src/main/java/com/example/backend/repository/InboundMessageRepository.java`
6. `backend/src/main/java/com/example/backend/repository/ConversationStateRepository.java`
7. `backend/src/main/java/com/example/backend/service/ConversationStateManager.java`
8. `backend/src/main/java/com/example/backend/service/ConversationResponseService.java`
9. `backend/src/main/java/com/example/backend/service/ConversationExpirationScheduler.java`
10. `backend/src/main/java/com/example/backend/controller/ConversationController.java`
11. `backend/src/main/java/com/example/backend/controller/WhatsAppWebhookController.java`
12. `backend/src/main/java/com/example/backend/dto/InboundMessageRequest.java`
13. `backend/src/main/java/com/example/backend/dto/ConversationStateResponse.java`
14. `backend/src/test/java/com/example/backend/service/ConversationStateManagerTest.java`
15. `backend/docs/CONVERSATION_FLOW.md`
16. `CONVERSATION_FLOW_IMPLEMENTATION.md` (this file)

### Modified Files (3)
1. `backend/src/main/java/com/example/backend/entity/enums/ActivityType.java` - Added conversation activity types
2. `backend/src/main/java/com/example/backend/entity/enums/AppointmentStatus.java` - Added CONFIRMED, RESCHEDULED
3. `backend/src/main/java/com/example/backend/service/AppointmentReminderScheduler.java` - Added conversation initialization

## Next Steps (Optional Enhancements)

1. **ML-based Intent Classification**: Train model on historical conversation data
2. **Multi-turn Conversations**: Support follow-up questions for date selection
3. **Language Detection**: Auto-detect client language and respond accordingly
4. **Rich Media Support**: Handle images, location shares, interactive buttons
5. **Analytics Dashboard**: Track confirmation rates, response times, intent accuracy
6. **A/B Testing**: Test different response templates for optimization

## Security Notes

- Webhook signature validation should be implemented for production
- Rate limiting recommended on inbound message endpoint
- Phone number validation and sanitization in place
- Tenant isolation enforced via TenantContext and org_id filtering

## Implementation Complete ✅

All requested functionality has been fully implemented and is ready for testing.
