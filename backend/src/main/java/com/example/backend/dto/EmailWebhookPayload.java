package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class EmailWebhookPayload {

    private String provider;

    @JsonProperty("from")
    private String from;

    @JsonProperty("to")
    private String to;

    @JsonProperty("subject")
    private String subject;

    @JsonProperty("text")
    private String text;

    @JsonProperty("html")
    private String html;

    @JsonProperty("stripped-text")
    private String strippedText;

    @JsonProperty("stripped-html")
    private String strippedHtml;

    @JsonProperty("message-id")
    private String messageId;

    @JsonProperty("timestamp")
    private Long timestamp;

    @JsonProperty("attachments")
    private List<EmailAttachment> attachments;

    @JsonProperty("headers")
    private Map<String, String> headers;

    @JsonProperty("sender")
    private String sender;

    @JsonProperty("recipient")
    private String recipient;

    @JsonProperty("attachment-info")
    private Map<String, Object> attachmentInfo;

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getHtml() {
        return html;
    }

    public void setHtml(String html) {
        this.html = html;
    }

    public String getStrippedText() {
        return strippedText;
    }

    public void setStrippedText(String strippedText) {
        this.strippedText = strippedText;
    }

    public String getStrippedHtml() {
        return strippedHtml;
    }

    public void setStrippedHtml(String strippedHtml) {
        this.strippedHtml = strippedHtml;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public List<EmailAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<EmailAttachment> attachments) {
        this.attachments = attachments;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public Map<String, Object> getAttachmentInfo() {
        return attachmentInfo;
    }

    public void setAttachmentInfo(Map<String, Object> attachmentInfo) {
        this.attachmentInfo = attachmentInfo;
    }

    public static class EmailAttachment {
        @JsonProperty("filename")
        private String filename;

        @JsonProperty("content-type")
        private String contentType;

        @JsonProperty("size")
        private Long size;

        @JsonProperty("url")
        private String url;

        @JsonProperty("content-id")
        private String contentId;

        public String getFilename() {
            return filename;
        }

        public void setFilename(String filename) {
            this.filename = filename;
        }

        public String getContentType() {
            return contentType;
        }

        public void setContentType(String contentType) {
            this.contentType = contentType;
        }

        public Long getSize() {
            return size;
        }

        public void setSize(Long size) {
            this.size = size;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getContentId() {
            return contentId;
        }

        public void setContentId(String contentId) {
            this.contentId = contentId;
        }
    }
}
