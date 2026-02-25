package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Service for triggering webhook events. Integrate this into existing services to send webhook
 * notifications.
 *
 * <p>Example integration in DossierService: @Autowired private WebhookEventService
 * webhookEventService;
 *
 * <p>// In createDossier method: public Dossier createDossier(...) { Dossier saved =
 * dossierRepository.save(dossier); webhookEventService.triggerDossierCreated(saved); return saved;
 * }
 */
@Service
public class WebhookEventService {

    private final WebhookService webhookService;

    public WebhookEventService(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    // Dossier Events

    public void triggerDossierCreated(Object dossier) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "dossier.created");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createDossierPayload(dossier));

        webhookService.triggerWebhook("dossier.created", payload);
    }

    public void triggerDossierUpdated(Object dossier) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "dossier.updated");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createDossierPayload(dossier));

        webhookService.triggerWebhook("dossier.updated", payload);
    }

    public void triggerDossierStatusChanged(Object dossier, String oldStatus, String newStatus) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "dossier.status_changed");
        payload.put("timestamp", LocalDateTime.now().toString());

        Map<String, Object> data = createDossierPayload(dossier);
        data.put("oldStatus", oldStatus);
        data.put("newStatus", newStatus);
        payload.put("data", data);

        webhookService.triggerWebhook("dossier.status_changed", payload);
    }

    // Message Events

    public void triggerMessageReceived(Object message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "message.received");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createMessagePayload(message));

        webhookService.triggerWebhook("message.received", payload);
    }

    public void triggerMessageSent(Object message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "message.sent");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createMessagePayload(message));

        webhookService.triggerWebhook("message.sent", payload);
    }

    // Appointment Events

    public void triggerAppointmentScheduled(Object appointment) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "appointment.scheduled");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createAppointmentPayload(appointment));

        webhookService.triggerWebhook("appointment.scheduled", payload);
    }

    public void triggerAppointmentUpdated(Object appointment) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "appointment.updated");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createAppointmentPayload(appointment));

        webhookService.triggerWebhook("appointment.updated", payload);
    }

    public void triggerAppointmentCancelled(Object appointment) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "appointment.cancelled");
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("data", createAppointmentPayload(appointment));

        webhookService.triggerWebhook("appointment.cancelled", payload);
    }

    // Payload Builders

    private Map<String, Object> createDossierPayload(Object dossier) {
        Map<String, Object> data = new HashMap<>();
        // Extract fields using reflection or cast to actual type
        // This is a simplified example
        data.put("id", getField(dossier, "id"));
        data.put("reference", getField(dossier, "reference"));
        data.put("status", getField(dossier, "status"));
        data.put("title", getField(dossier, "title"));
        data.put("createdAt", getField(dossier, "createdAt"));
        data.put("updatedAt", getField(dossier, "updatedAt"));
        return data;
    }

    private Map<String, Object> createMessagePayload(Object message) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", getField(message, "id"));
        data.put("dossierId", getField(message, "dossierId"));
        data.put("channel", getField(message, "channel"));
        data.put("from", getField(message, "from"));
        data.put("content", getField(message, "content"));
        data.put("receivedAt", getField(message, "receivedAt"));
        return data;
    }

    private Map<String, Object> createAppointmentPayload(Object appointment) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", getField(appointment, "id"));
        data.put("dossierId", getField(appointment, "dossierId"));
        data.put("title", getField(appointment, "title"));
        data.put("scheduledAt", getField(appointment, "scheduledAt"));
        data.put("duration", getField(appointment, "duration"));
        data.put("location", getField(appointment, "location"));
        return data;
    }

    private Object getField(Object obj, String fieldName) {
        try {
            var field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
