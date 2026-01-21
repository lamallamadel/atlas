package com.example.backend.service;

import com.example.backend.entity.EmailProviderConfig;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.repository.EmailProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.SendFailedException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

@Service
public class JavaMailEmailProvider implements OutboundMessageProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(JavaMailEmailProvider.class);
    private static final String EMAIL_CHANNEL = "EMAIL";
    private static final int MAX_MESSAGE_SIZE_MB = 25;
    
    private final EmailProviderConfigRepository providerConfigRepository;
    private final EmailErrorMapper errorMapper;
    private final ObjectMapper objectMapper;
    
    @Value("${email.default.timeout:30000}")
    private int defaultTimeout;
    
    @Value("${email.connection.pool.size:5}")
    private int connectionPoolSize;
    
    public JavaMailEmailProvider(
            EmailProviderConfigRepository providerConfigRepository,
            EmailErrorMapper errorMapper,
            ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.errorMapper = errorMapper;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        try {
            EmailProviderConfig config = providerConfigRepository.findByOrgId(message.getOrgId())
                .orElseThrow(() -> new IllegalStateException("Email provider config not found for org: " + message.getOrgId()));
            
            if (!config.isEnabled()) {
                return ProviderSendResult.failure("PROVIDER_DISABLED", "Email provider is disabled for this organization", false, null);
            }
            
            validateEmailMessage(message);
            
            Session session = createMailSession(config);
            MimeMessage mimeMessage = buildMimeMessage(session, message, config);
            
            String messageId = generateMessageId(message);
            mimeMessage.setHeader("Message-ID", "<" + messageId + "@" + extractDomain(config.getFromEmail()) + ">");
            mimeMessage.setHeader("X-Idempotency-Key", message.getIdempotencyKey());
            
            logger.info("Sending email: orgId={}, messageId={}, to={}, subject={}", 
                message.getOrgId(), message.getId(), message.getTo(), message.getSubject());
            
            Transport.send(mimeMessage);
            
            logger.info("Email sent successfully: messageId={}, providerMessageId={}", 
                message.getId(), messageId);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("messageId", messageId);
            responseData.put("timestamp", System.currentTimeMillis());
            
            return ProviderSendResult.success(messageId, responseData);
            
        } catch (SendFailedException e) {
            return handleSendFailedException(e, message);
        } catch (AuthenticationFailedException e) {
            logger.error("SMTP authentication failed for messageId={}: {}", message.getId(), e.getMessage());
            return ProviderSendResult.failure("AUTH_FAILED", "SMTP authentication failed", false, null);
        } catch (MessagingException e) {
            return handleMessagingException(e, message);
        } catch (Exception e) {
            logger.error("Unexpected error sending email: messageId={}", message.getId(), e);
            return ProviderSendResult.failure("UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);
        }
    }
    
    @Override
    public boolean supports(String channel) {
        return EMAIL_CHANNEL.equalsIgnoreCase(channel);
    }
    
    @Override
    public boolean isRetryableError(String errorCode) {
        return errorMapper.isRetryable(errorCode);
    }
    
    private Session createMailSession(EmailProviderConfig config) {
        Properties props = new Properties();
        
        props.put("mail.smtp.host", config.getSmtpHost());
        props.put("mail.smtp.port", config.getSmtpPort().toString());
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.timeout", String.valueOf(defaultTimeout));
        props.put("mail.smtp.connectiontimeout", String.valueOf(defaultTimeout));
        props.put("mail.smtp.writetimeout", String.valueOf(defaultTimeout));
        
        if (config.getUseTls()) {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }
        
        if (config.getUseSsl()) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", config.getSmtpPort().toString());
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        }
        
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.connectionpool", "true");
        props.put("mail.smtp.connectionpoolsize", String.valueOf(connectionPoolSize));
        
        return Session.getInstance(props, new jakarta.mail.Authenticator() {
            protected jakarta.mail.PasswordAuthentication getPasswordAuthentication() {
                return new jakarta.mail.PasswordAuthentication(
                    config.getSmtpUsername(), 
                    config.getSmtpPasswordEncrypted()
                );
            }
        });
    }
    
    private MimeMessage buildMimeMessage(Session session, OutboundMessageEntity message, EmailProviderConfig config) 
            throws MessagingException, UnsupportedEncodingException {
        MimeMessage mimeMessage = new MimeMessage(session);
        
        InternetAddress fromAddress = new InternetAddress(config.getFromEmail(), 
            config.getFromName() != null ? config.getFromName() : config.getFromEmail());
        mimeMessage.setFrom(fromAddress);
        
        mimeMessage.setRecipients(Message.RecipientType.TO, InternetAddress.parse(message.getTo()));
        
        if (config.getReplyToEmail() != null) {
            mimeMessage.setReplyTo(InternetAddress.parse(config.getReplyToEmail()));
        }
        
        if (message.getSubject() != null) {
            mimeMessage.setSubject(message.getSubject(), "UTF-8");
        }
        
        Map<String, Object> payload = message.getPayloadJson();
        if (payload != null) {
            if (payload.containsKey("cc")) {
                mimeMessage.setRecipients(Message.RecipientType.CC, 
                    InternetAddress.parse((String) payload.get("cc")));
            }
            
            if (payload.containsKey("bcc")) {
                mimeMessage.setRecipients(Message.RecipientType.BCC, 
                    InternetAddress.parse((String) payload.get("bcc")));
            }
            
            buildMessageContent(mimeMessage, payload);
        } else {
            mimeMessage.setText("", "UTF-8");
        }
        
        return mimeMessage;
    }
    
    private void buildMessageContent(MimeMessage mimeMessage, Map<String, Object> payload) throws MessagingException {
        String htmlBody = (String) payload.get("htmlBody");
        String textBody = (String) payload.get("textBody");
        
        if (htmlBody != null && textBody != null) {
            MimeMultipart multipart = new MimeMultipart("alternative");
            
            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText(textBody, "UTF-8");
            multipart.addBodyPart(textPart);
            
            MimeBodyPart htmlPart = new MimeBodyPart();
            htmlPart.setContent(htmlBody, "text/html; charset=UTF-8");
            multipart.addBodyPart(htmlPart);
            
            mimeMessage.setContent(multipart);
        } else if (htmlBody != null) {
            mimeMessage.setContent(htmlBody, "text/html; charset=UTF-8");
        } else if (textBody != null) {
            mimeMessage.setText(textBody, "UTF-8");
        } else {
            String body = (String) payload.getOrDefault("body", "");
            mimeMessage.setText(body, "UTF-8");
        }
    }
    
    private void validateEmailMessage(OutboundMessageEntity message) {
        if (message.getTo() == null || message.getTo().isEmpty()) {
            throw new IllegalArgumentException("Recipient email address is required");
        }
        
        try {
            InternetAddress.parse(message.getTo(), true);
        } catch (AddressException e) {
            throw new IllegalArgumentException("Invalid recipient email address: " + message.getTo(), e);
        }
        
        Map<String, Object> payload = message.getPayloadJson();
        if (payload != null) {
            Object htmlBody = payload.get("htmlBody");
            Object textBody = payload.get("textBody");
            Object body = payload.get("body");
            
            int estimatedSize = 0;
            if (htmlBody != null) estimatedSize += htmlBody.toString().length();
            if (textBody != null) estimatedSize += textBody.toString().length();
            if (body != null) estimatedSize += body.toString().length();
            
            if (estimatedSize > MAX_MESSAGE_SIZE_MB * 1024 * 1024) {
                throw new IllegalArgumentException("Message size exceeds limit of " + MAX_MESSAGE_SIZE_MB + "MB");
            }
        }
    }
    
    private ProviderSendResult handleSendFailedException(SendFailedException e, OutboundMessageEntity message) {
        logger.error("Email send failed for messageId={}: {}", message.getId(), e.getMessage());
        
        String errorCode = extractSmtpErrorCode(e);
        String errorMessage = e.getMessage();
        
        if (e.getInvalidAddresses() != null && e.getInvalidAddresses().length > 0) {
            return ProviderSendResult.failure("INVALID_EMAIL", "Invalid recipient email address", false, null);
        }
        
        if (e.getValidUnsentAddresses() != null && e.getValidUnsentAddresses().length > 0) {
            EmailErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCode);
            return ProviderSendResult.failure(
                errorCode != null ? errorCode : "SEND_FAILED",
                errorMessage != null ? errorMessage : "Email send failed",
                errorInfo.isRetryable(),
                null
            );
        }
        
        EmailErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCode);
        return ProviderSendResult.failure(
            errorCode != null ? errorCode : "SEND_FAILED",
            sanitizeErrorMessage(errorMessage),
            errorInfo.isRetryable(),
            null
        );
    }
    
    private ProviderSendResult handleMessagingException(MessagingException e, OutboundMessageEntity message) {
        logger.error("Messaging exception for messageId={}: {}", message.getId(), e.getMessage());
        
        Throwable cause = e.getCause();
        
        if (cause instanceof ConnectException) {
            return ProviderSendResult.failure("CONNECTION_FAILED", "Could not connect to SMTP server", true, null);
        }
        
        if (cause instanceof SocketTimeoutException) {
            return ProviderSendResult.failure("TIMEOUT", "Connection timeout", true, null);
        }
        
        String errorCode = extractSmtpErrorCode(e);
        String errorMessage = e.getMessage();
        
        if (errorMessage != null && errorMessage.toLowerCase().contains("tls")) {
            return ProviderSendResult.failure("TLS_FAILED", "TLS/SSL negotiation failed", true, null);
        }
        
        if (errorMessage != null && errorMessage.toLowerCase().contains("relay")) {
            return ProviderSendResult.failure("RELAY_DENIED", "Relay access denied", false, null);
        }
        
        EmailErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCode);
        
        if (errorInfo.isRateLimitError()) {
            logger.warn("Email rate limit error for orgId={}", message.getOrgId());
        }
        
        return ProviderSendResult.failure(
            errorCode != null ? errorCode : "MESSAGING_ERROR",
            sanitizeErrorMessage(errorMessage),
            errorInfo.isRetryable(),
            null
        );
    }
    
    private String extractSmtpErrorCode(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return null;
        }
        
        if (message.matches(".*\\b[45]\\d{2}\\b.*")) {
            String code = message.replaceAll(".*\\b([45]\\d{2})\\b.*", "$1");
            return "SMTP_" + code;
        }
        
        return null;
    }
    
    private String generateMessageId(OutboundMessageEntity message) {
        return message.getIdempotencyKey() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "localhost";
        }
        return email.substring(email.indexOf("@") + 1);
    }
    
    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }
        
        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }
        
        message = message.replaceAll("(?i)(password|secret|token|key)\\s*[:=]\\s*[^\\s,}]+", "$1=***");
        
        return message;
    }
}
