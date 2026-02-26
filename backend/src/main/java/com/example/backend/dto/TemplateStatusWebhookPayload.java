package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TemplateStatusWebhookPayload {

    @JsonProperty("object")
    private String object;

    @JsonProperty("entry")
    private List<Entry> entry;

    public String getObject() {
        return object;
    }

    public void setObject(String object) {
        this.object = object;
    }

    public List<Entry> getEntry() {
        return entry;
    }

    public void setEntry(List<Entry> entry) {
        this.entry = entry;
    }

    public static class Entry {
        @JsonProperty("id")
        private String id;

        @JsonProperty("time")
        private Long time;

        @JsonProperty("changes")
        private List<Change> changes;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public Long getTime() {
            return time;
        }

        public void setTime(Long time) {
            this.time = time;
        }

        public List<Change> getChanges() {
            return changes;
        }

        public void setChanges(List<Change> changes) {
            this.changes = changes;
        }
    }

    public static class Change {
        @JsonProperty("field")
        private String field;

        @JsonProperty("value")
        private Value value;

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public Value getValue() {
            return value;
        }

        public void setValue(Value value) {
            this.value = value;
        }
    }

    public static class Value {
        @JsonProperty("event")
        private String event;

        @JsonProperty("message_template_id")
        private String messageTemplateId;

        @JsonProperty("message_template_name")
        private String messageTemplateName;

        @JsonProperty("message_template_language")
        private String messageTemplateLanguage;

        @JsonProperty("reason")
        private String reason;

        public String getEvent() {
            return event;
        }

        public void setEvent(String event) {
            this.event = event;
        }

        public String getMessageTemplateId() {
            return messageTemplateId;
        }

        public void setMessageTemplateId(String messageTemplateId) {
            this.messageTemplateId = messageTemplateId;
        }

        public String getMessageTemplateName() {
            return messageTemplateName;
        }

        public void setMessageTemplateName(String messageTemplateName) {
            this.messageTemplateName = messageTemplateName;
        }

        public String getMessageTemplateLanguage() {
            return messageTemplateLanguage;
        }

        public void setMessageTemplateLanguage(String messageTemplateLanguage) {
            this.messageTemplateLanguage = messageTemplateLanguage;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
