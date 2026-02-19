package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class SendGridWebhookPayload {

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

    @JsonProperty("email")
    private String email;

    @JsonProperty("headers")
    private String headers;

    @JsonProperty("envelope")
    private String envelope;

    @JsonProperty("charsets")
    private String charsets;

    @JsonProperty("SPF")
    private String spf;

    @JsonProperty("attachments")
    private String attachments;

    @JsonProperty("attachment-info")
    private Map<String, Object> attachmentInfo;

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getHeaders() {
        return headers;
    }

    public void setHeaders(String headers) {
        this.headers = headers;
    }

    public String getEnvelope() {
        return envelope;
    }

    public void setEnvelope(String envelope) {
        this.envelope = envelope;
    }

    public String getCharsets() {
        return charsets;
    }

    public void setCharsets(String charsets) {
        this.charsets = charsets;
    }

    public String getSpf() {
        return spf;
    }

    public void setSpf(String spf) {
        this.spf = spf;
    }

    public String getAttachments() {
        return attachments;
    }

    public void setAttachments(String attachments) {
        this.attachments = attachments;
    }

    public Map<String, Object> getAttachmentInfo() {
        return attachmentInfo;
    }

    public void setAttachmentInfo(Map<String, Object> attachmentInfo) {
        this.attachmentInfo = attachmentInfo;
    }
}
