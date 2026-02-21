package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Primary
public class BasicEmailProvider implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(BasicEmailProvider.class);

    private final JavaMailSender javaMailSender;

    public BasicEmailProvider(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
        log.info("BasicEmailProvider initialized successfully with JavaMailSender");
    }

    @Override
    public void send(NotificationEntity notification) throws Exception {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(notification.getRecipient());
            helper.setSubject(notification.getSubject());

            String body = extractBody(notification);
            helper.setText(body, true);

            javaMailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException(
                    "Failed to send email notification to "
                            + notification.getRecipient()
                            + ": "
                            + e.getMessage(),
                    e);
        }
    }

    private String extractBody(NotificationEntity notification) {
        if (notification.getVariables() != null
                && notification.getVariables().containsKey("body")) {
            Object bodyObj = notification.getVariables().get("body");
            return bodyObj != null ? bodyObj.toString() : "";
        }
        return "";
    }
}
