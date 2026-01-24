package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.beans.factory.annotation.Value;

import java.util.Properties;

@Configuration
public class NotificationConfig {

    private static final Logger log = LoggerFactory.getLogger(NotificationConfig.class);

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private Integer mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private Boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private Boolean smtpStartTlsEnable;

    @Bean
    @ConditionalOnProperty(name = "spring.mail.enabled", havingValue = "true", matchIfMissing = true)
    public JavaMailSender javaMailSender() {
        log.info("Configuring JavaMailSender bean with host: {}, port: {}", mailHost, mailPort);
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        mailSender.setHost(mailHost);
        mailSender.setPort(mailPort);
        
        if (mailUsername != null && !mailUsername.isEmpty()) {
            mailSender.setUsername(mailUsername);
            log.info("JavaMailSender configured with username: {}", mailUsername);
        }
        
        if (mailPassword != null && !mailPassword.isEmpty()) {
            mailSender.setPassword(mailPassword);
            log.info("JavaMailSender configured with password (hidden)");
        }
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", smtpStartTlsEnable);
        props.put("mail.debug", "false");
        
        log.info("JavaMailSender bean created successfully with SMTP auth: {}, STARTTLS: {}", 
                smtpAuth, smtpStartTlsEnable);
        
        return mailSender;
    }
}
