package com.example.backend.service;

import com.example.backend.entity.EmailProviderConfig;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.repository.EmailProviderConfigRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.*;

@Service
public class EmailProviderService implements OutboundMessageProvider {

    private static final Logger log = LoggerFactory.getLogger(EmailProviderService.class);
    private static final String EMAIL_CHANNEL = "EMAIL";
    private static final Set<String> NON_RETRYABLE_ERROR_CODES = Set.of(
        "550", // Mailbox unavailable
        "551", // User not local
        "552", // Exceeded storage allocation
        "553", // Mailbox name not allowed
        "554", // Transaction failed
        "INVALID_EMAIL"
    );

    private final EmailProviderConfigRepository configRepository;
    private final TemplateEngine templateEngine;

    public EmailProviderService(
            EmailProviderConfigRepository configRepository,
            TemplateEngine templateEngine) {
        this.configRepository = configRepository;
        this.templateEngine = templateEngine;
    }

    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        try {
            EmailProviderConfig config = configRepository.findByOrgId(message.getOrgId())
                .orElseThrow(() -> new IllegalStateException("Email provider config not found for org: " + message.getOrgId()));

            if (!config.isEnabled()) {
                return ProviderSendResult.failure("PROVIDER_DISABLED", "Email provider is disabled for this organization", false, null);
            }

            JavaMailSender mailSender = createMailSender(config);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String fromAddress = config.getFromEmail();
            if (config.getFromName() != null && !config.getFromName().isEmpty()) {
                helper.setFrom(fromAddress, config.getFromName());
            } else {
                helper.setFrom(fromAddress);
            }

            helper.setTo(message.getTo());

            String subject = message.getSubject();
            if (subject == null || subject.isEmpty()) {
                subject = "Notification";
            }
            helper.setSubject(subject);

            if (config.getReplyToEmail() != null && !config.getReplyToEmail().isEmpty()) {
                helper.setReplyTo(config.getReplyToEmail());
            }

            String htmlContent;
            if (message.getTemplateCode() != null && !message.getTemplateCode().isEmpty()) {
                htmlContent = renderTemplate(message.getTemplateCode(), message.getPayloadJson());
            } else if (message.getPayloadJson() != null && message.getPayloadJson().containsKey("htmlBody")) {
                htmlContent = (String) message.getPayloadJson().get("htmlBody");
            } else if (message.getSubject() != null) {
                htmlContent = generateSimpleHtmlContent(message.getSubject());
            } else {
                htmlContent = generateSimpleHtmlContent("Notification");
            }

            helper.setText(htmlContent, true);

            log.info("Sending email: orgId={}, messageId={}, to={}, subject={}", 
                message.getOrgId(), message.getId(), message.getTo(), subject);

            mailSender.send(mimeMessage);

            log.info("Email sent successfully: messageId={}", message.getId());

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("to", message.getTo());
            responseData.put("subject", subject);
            responseData.put("timestamp", System.currentTimeMillis());

            return ProviderSendResult.success(null, responseData);

        } catch (MessagingException e) {
            log.error("Messaging error sending email for messageId={}: {}", message.getId(), e.getMessage(), e);
            String errorCode = extractErrorCode(e);
            String errorMessage = sanitizeErrorMessage(e.getMessage());
            boolean retryable = isRetryableError(errorCode);
            return ProviderSendResult.failure(errorCode != null ? errorCode : "MESSAGING_ERROR", errorMessage, retryable, null);

        } catch (IllegalStateException e) {
            log.error("Configuration error for messageId={}: {}", message.getId(), e.getMessage());
            return ProviderSendResult.failure("CONFIG_ERROR", e.getMessage(), false, null);

        } catch (Exception e) {
            log.error("Unexpected error sending email: messageId={}", message.getId(), e);
            return ProviderSendResult.failure("UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);
        }
    }

    @Override
    public boolean supports(String channel) {
        return EMAIL_CHANNEL.equalsIgnoreCase(channel);
    }

    @Override
    public boolean isRetryableError(String errorCode) {
        if (errorCode == null) {
            return true;
        }
        return !NON_RETRYABLE_ERROR_CODES.contains(errorCode);
    }

    private JavaMailSender createMailSender(EmailProviderConfig config) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        if (config.getSmtpHost() != null && !config.getSmtpHost().isEmpty()) {
            mailSender.setHost(config.getSmtpHost());
            mailSender.setPort(config.getSmtpPort() != null ? config.getSmtpPort() : 587);
            mailSender.setUsername(config.getSmtpUsername());
            mailSender.setPassword(config.getSmtpPasswordEncrypted());

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            
            if (config.getUseTls()) {
                props.put("mail.smtp.starttls.enable", "true");
            }
            
            if (config.getUseSsl()) {
                props.put("mail.smtp.ssl.enable", "true");
            }
            
            props.put("mail.debug", "false");
        } else {
            throw new IllegalStateException("SMTP configuration is incomplete");
        }

        return mailSender;
    }

    private String renderTemplate(String templateCode, Map<String, Object> variables) {
        try {
            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            return templateEngine.process(templateCode, context);
        } catch (Exception e) {
            log.warn("Failed to render template: {}, using fallback", templateCode, e);
            return generateFallbackContent(variables);
        }
    }

    private String generateFallbackContent(Map<String, Object> variables) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>");
        html.append("<h2>Notification</h2>");
        if (variables != null && !variables.isEmpty()) {
            html.append("<div>");
            variables.forEach((key, value) -> 
                html.append("<p><strong>").append(key).append(":</strong> ")
                    .append(value != null ? value.toString() : "").append("</p>"));
            html.append("</div>");
        }
        html.append("</body></html>");
        return html.toString();
    }

    private String generateSimpleHtmlContent(String content) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>" +
               "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">" +
               "<p>" + content + "</p>" +
               "</div></body></html>";
    }

    private String extractErrorCode(Exception e) {
        try {
            String message = e.getMessage();
            if (message != null) {
                if (message.contains("550")) return "550";
                if (message.contains("551")) return "551";
                if (message.contains("552")) return "552";
                if (message.contains("553")) return "553";
                if (message.contains("554")) return "554";
                if (message.contains("invalid") && message.contains("email")) return "INVALID_EMAIL";
            }
        } catch (Exception ex) {
            log.debug("Could not extract error code from exception", ex);
        }
        return null;
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }

        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }

        message = message.replaceAll("(?i)(password|secret|token)\\s*[:=]\\s*[^\\s,}]+", "$1=***");

        return message;
    }
}
