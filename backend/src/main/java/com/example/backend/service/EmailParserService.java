package com.example.backend.service;

import com.example.backend.dto.EmailWebhookPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailParserService {

    private static final Logger log = LoggerFactory.getLogger(EmailParserService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("<([^>]+)>");
    private static final Pattern NAME_EMAIL_PATTERN = Pattern.compile("^(.+?)\\s*<([^>]+)>$");

    public ParsedEmail parseEmail(EmailWebhookPayload payload) {
        ParsedEmail parsed = new ParsedEmail();

        String fromRaw = payload.getFrom();
        if (fromRaw != null && !fromRaw.isEmpty()) {
            EmailAddress fromAddress = extractEmailAddress(fromRaw);
            parsed.setFromEmail(fromAddress.getEmail());
            parsed.setFromName(fromAddress.getName());
        }

        String toRaw = payload.getTo();
        if (toRaw != null && !toRaw.isEmpty()) {
            EmailAddress toAddress = extractEmailAddress(toRaw);
            parsed.setToEmail(toAddress.getEmail());
        }

        parsed.setSubject(payload.getSubject());

        String htmlContent = payload.getHtml();
        String textContent = payload.getText();
        
        if (payload.getStrippedHtml() != null && !payload.getStrippedHtml().isEmpty()) {
            htmlContent = payload.getStrippedHtml();
        }
        
        if (payload.getStrippedText() != null && !payload.getStrippedText().isEmpty()) {
            textContent = payload.getStrippedText();
        }

        parsed.setHtmlContent(htmlContent);
        parsed.setTextContent(textContent);

        if (payload.getAttachments() != null && !payload.getAttachments().isEmpty()) {
            List<Map<String, Object>> attachments = new ArrayList<>();
            for (EmailWebhookPayload.EmailAttachment attachment : payload.getAttachments()) {
                Map<String, Object> attachmentData = new HashMap<>();
                attachmentData.put("filename", attachment.getFilename());
                attachmentData.put("contentType", attachment.getContentType());
                attachmentData.put("size", attachment.getSize());
                attachmentData.put("url", attachment.getUrl());
                attachmentData.put("contentId", attachment.getContentId());
                attachments.add(attachmentData);
            }
            parsed.setAttachments(attachments);
        }

        parsed.setMessageId(payload.getMessageId());
        parsed.setTimestamp(payload.getTimestamp());

        return parsed;
    }

    private EmailAddress extractEmailAddress(String emailString) {
        if (emailString == null || emailString.isEmpty()) {
            return new EmailAddress(null, null);
        }

        emailString = emailString.trim();

        Matcher nameEmailMatcher = NAME_EMAIL_PATTERN.matcher(emailString);
        if (nameEmailMatcher.matches()) {
            String name = nameEmailMatcher.group(1).trim();
            String email = nameEmailMatcher.group(2).trim();
            name = name.replaceAll("^\"|\"$", "");
            return new EmailAddress(email, name);
        }

        Matcher emailMatcher = EMAIL_PATTERN.matcher(emailString);
        if (emailMatcher.find()) {
            String email = emailMatcher.group(1).trim();
            return new EmailAddress(email, null);
        }

        if (emailString.contains("@")) {
            return new EmailAddress(emailString, null);
        }

        return new EmailAddress(null, emailString);
    }

    public static class ParsedEmail {
        private String fromEmail;
        private String fromName;
        private String toEmail;
        private String subject;
        private String htmlContent;
        private String textContent;
        private List<Map<String, Object>> attachments;
        private String messageId;
        private Long timestamp;

        public String getFromEmail() {
            return fromEmail;
        }

        public void setFromEmail(String fromEmail) {
            this.fromEmail = fromEmail;
        }

        public String getFromName() {
            return fromName;
        }

        public void setFromName(String fromName) {
            this.fromName = fromName;
        }

        public String getToEmail() {
            return toEmail;
        }

        public void setToEmail(String toEmail) {
            this.toEmail = toEmail;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getHtmlContent() {
            return htmlContent;
        }

        public void setHtmlContent(String htmlContent) {
            this.htmlContent = htmlContent;
        }

        public String getTextContent() {
            return textContent;
        }

        public void setTextContent(String textContent) {
            this.textContent = textContent;
        }

        public List<Map<String, Object>> getAttachments() {
            return attachments;
        }

        public void setAttachments(List<Map<String, Object>> attachments) {
            this.attachments = attachments;
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

        public String getContentForStorage() {
            if (textContent != null && !textContent.isEmpty()) {
                return textContent;
            }
            if (htmlContent != null && !htmlContent.isEmpty()) {
                return stripHtmlTags(htmlContent);
            }
            return "";
        }

        private String stripHtmlTags(String html) {
            if (html == null) {
                return "";
            }
            return html.replaceAll("<[^>]*>", "").trim();
        }
    }

    private static class EmailAddress {
        private final String email;
        private final String name;

        public EmailAddress(String email, String name) {
            this.email = email;
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }
    }
}
