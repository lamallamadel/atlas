# WhatsApp Conversation Flow Manager

## Overview

The WhatsApp Conversation Flow Manager enables interactive appointment confirmations through WhatsApp messaging. When appointment reminders are sent via WhatsApp, the system automatically initializes a conversation state machine that can process client responses and update appointment statuses accordingly.

## Architecture

### Components

1. **ConversationStateManager**: Core FSM that processes inbound messages and manages state transitions
2. **ConversationStateEntity**: Tracks active conversation state per phone number
3. **InboundMessageEntity**: Stores all incoming WhatsApp messages
4. **ConversationResponseService**: Sends automated responses back to clients
5. **ConversationExpirationScheduler**: Expires old conversations that haven't received responses

### State Machine

```
AWAITING_CONFIRMATION
    ├─> CONFIRMED (keywords: oui, yes, ok, confirme, d'accord)
    ├─> CANCELLED (keywords: annule, cancel, non, no, pas possible)
    ├─> RESCHEDULED (keywords: reprogrammer, reporter, décaler, changer)
    └─> EXPIRED (after 24 hours)
```

## Database Schema

### inbound_message

Stores all incoming WhatsApp messages for processing and audit trail.

```sql
CREATE TABLE inbound_message (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    provider_message_id VARCHAR(255),
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### conversation_state

Manages the FSM state for active conversations.

```sql
CREATE TABLE conversation_state (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,  -- AWAITING_CONFIRMATION, CONFIRMED, CANCELLED, RESCHEDULED, EXPIRED
    context_data JSONB,           -- Additional conversation context
    appointment_id BIGINT,        -- Link to appointment
    dossier_id BIGINT,            -- Link to dossier for activity logging
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation_state_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_state_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Ensure only one active conversation per phone number
CREATE UNIQUE INDEX idx_conversation_state_active_phone 
ON conversation_state(org_id, phone_number) 
WHERE expires_at > CURRENT_TIMESTAMP;
```

## Features

### 1. Automatic Conversation Initialization

When an appointment reminder is sent via WhatsApp, the system automatically initializes a conversation:

```java
// In AppointmentReminderScheduler
if (channel == MessageChannel.WHATSAPP) {
    conversationStateManager.initializeConversation(
        orgId, 
        phoneNumber, 
        appointment.getId(), 
        dossierId
    );
}
```

### 2. Intent Classification

The system uses a hybrid approach for intent classification:

1. **Keyword Matching**: Fast pattern matching for common phrases
2. **Semantic Similarity**: Calculates word overlap for ambiguous messages
3. **Fallback**: Sends clarification messages for unclear intents

### 3. Appointment Status Updates

When a client responds, the system automatically:
- Updates the conversation state
- Updates the appointment status (CONFIRMED, CANCELLED, RESCHEDULED)
- Logs activity to the dossier timeline
- Sends automated confirmation response

### 4. Activity Timeline Integration

All conversation turns are logged to the dossier activity timeline:

- `CONVERSATION_STARTED`: When reminder is sent and conversation initialized
- `CONVERSATION_REPLY`: For each inbound message received
- `APPOINTMENT_CONFIRMED`: When client confirms appointment
- `APPOINTMENT_CANCELLED_BY_CLIENT`: When client cancels
- `APPOINTMENT_RESCHEDULED_BY_CLIENT`: When client requests reschedule

### 5. Automated Responses

The system sends context-aware responses:

**Confirmation Response:**
```
✅ Parfait ! Votre rendez-vous du 15/01/2024 à 14:00 à notre agence est confirmé. 
Nous vous attendons !
```

**Cancellation Response:**
```
Votre rendez-vous du 15/01/2024 a bien été annulé. 
N'hésitez pas à nous recontacter pour fixer une nouvelle date.
```

**Reschedule Response:**
```
Nous avons bien noté votre demande de report. 
Un membre de notre équipe vous recontactera pour convenir d'une nouvelle date. Merci !
```

**Clarification Request:**
```
Je n'ai pas bien compris votre message concernant votre rendez-vous du 15/01/2024 à 14:00.

Pour confirmer, répondez 'OUI'
Pour annuler, répondez 'ANNULER'
Pour changer la date, répondez 'REPORTER'
```

### 6. Conversation Expiration

Conversations automatically expire after 24 hours:

- Scheduled task runs every hour (configurable)
- Transitions `AWAITING_CONFIRMATION` → `EXPIRED`
- Prevents stale conversation states from affecting new reminders

## API Endpoints

### Receive Inbound Message

Manual endpoint for testing or custom integrations:

```http
POST /api/conversations/inbound
Content-Type: application/json

{
  "phoneNumber": "+33612345678",
  "messageBody": "Oui",
  "providerMessageId": "wamid.xyz123"
}
```

### Get Active Conversation

```http
GET /api/conversations/phone/{phoneNumber}
```

Returns the active conversation state for a phone number.

### Get Conversation by Appointment

```http
GET /api/conversations/appointment/{appointmentId}
```

Returns the conversation associated with an appointment.

### Initialize Conversation

```http
POST /api/conversations/initialize?phoneNumber=+33612345678&appointmentId=123&dossierId=456
```

Manually initialize a conversation (normally done automatically).

## WhatsApp Webhook Integration

### Setup

The system provides a webhook endpoint for WhatsApp Cloud API:

```http
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=CHALLENGE_STRING
POST /api/webhooks/whatsapp
```

### Webhook Payload Processing

The webhook handler processes Meta's WhatsApp Cloud API format:

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "33612345678",
          "id": "wamid.xyz123",
          "type": "text",
          "text": {
            "body": "Oui"
          }
        }]
      }
    }]
  }]
}
```

## Configuration

### Application Properties

```yaml
# Conversation expiration scheduler
conversation.expiration.cron: 0 0 * * * ?  # Run every hour

# Appointment reminder integration
appointment.reminder.enabled: true
appointment.reminder.hours-ahead: 24
appointment.reminder.cron: 0 0/15 * * * ?  # Check every 15 minutes
```

### WhatsApp Webhook Verification

Update the verify token in `WhatsAppWebhookController`:

```java
if ("subscribe".equals(mode) && "your_verify_token".equals(token)) {
    // Replace "your_verify_token" with your actual token
    return ResponseEntity.ok(challenge);
}
```

## Intent Classification Keywords

### Confirmation Keywords (French & English)

- oui, yes, ok
- confirme, confirmer, confirmé
- d'accord, daccord, accord
- bien reçu, parfait, très bien

### Cancellation Keywords

- annule, annuler, annulé
- cancel, cancelled
- non, no
- pas possible, impossible
- ne peux pas, ne peut pas

### Reschedule Keywords

- reprogrammer, reporter
- décaler, decaler, changer
- reschedule
- autre date, autre jour, autre heure
- plus tard, plus tôt

## Activity Timeline Examples

```
[15/01/2024 09:00] CONVERSATION_STARTED
Conversation de confirmation de rendez-vous démarrée

[15/01/2024 09:15] CONVERSATION_REPLY
Client a répondu: Oui

[15/01/2024 09:15] APPOINTMENT_CONFIRMED
Le client a confirmé le rendez-vous
```

## Error Handling

- **Missing Context**: If dossier or appointment is missing, operations gracefully degrade
- **Intent Ambiguity**: Sends clarification message to client
- **Expired Conversations**: Automatically cleaned up by scheduler
- **Duplicate Messages**: Provider message ID prevents duplicate processing

## Testing

### Unit Tests

```bash
mvn test -Dtest=ConversationStateManagerTest
```

### Manual Testing

1. Create an appointment with reminder
2. Send reminder via WhatsApp
3. Send inbound message via API or webhook
4. Verify appointment status updated
5. Check activity timeline in dossier

### Example Test Scenarios

```bash
# Test confirmation
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Oui"}'

# Test cancellation
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Annuler"}'

# Test reschedule
curl -X POST http://localhost:8080/api/conversations/inbound \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33612345678","messageBody":"Reporter"}'
```

## Security Considerations

1. **Webhook Signature Validation**: Implement Meta's signature validation for production
2. **Rate Limiting**: Consider rate limiting on inbound message endpoint
3. **Phone Number Validation**: Validate phone number formats before processing
4. **Organization Context**: Ensure proper tenant isolation via TenantContext

## Future Enhancements

1. **Machine Learning Intent Classification**: Train ML model on historical conversation data
2. **Multi-turn Conversations**: Support follow-up questions for reschedule date selection
3. **Language Detection**: Auto-detect client language and respond accordingly
4. **Rich Message Support**: Handle images, location shares, buttons
5. **A/B Testing**: Test different response templates for optimization
6. **Analytics Dashboard**: Track confirmation rates, response times, intent accuracy
