package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Component
public class JavaMailEmailProvider implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(JavaMailEmailProvider.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String fromEmail;

    public JavaMailEmailProvider(
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            @Value("${spring.mail.from:noreply@example.com}") String fromEmail) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromEmail = fromEmail;
    }

    @Override
    public void send(NotificationEntity notification) throws Exception {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(notification.getRecipient());
            helper.setSubject(notification.getSubject() != null ? notification.getSubject() : "Notification");

            String htmlContent = renderTemplate(notification.getTemplateId(), notification.getVariables());
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", notification.getRecipient());
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", notification.getRecipient(), e);
            throw new Exception("Failed to send email", e);
        }
    }

    private String renderTemplate(String templateId, Map<String, Object> variables) {
        try {
            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            return templateEngine.process(templateId, context);
        } catch (Exception e) {
            log.warn("Failed to render template: {}, using fallback", templateId, e);
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
}
