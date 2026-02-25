package com.example.backend.service;

import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

@Service
public class I18nService {

    private final MessageSource messageSource;

    public I18nService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String getMessage(String code) {
        return getMessage(code, null);
    }

    public String getMessage(String code, Object[] args) {
        return getMessage(code, args, LocaleContextHolder.getLocale());
    }

    public String getMessage(String code, Object[] args, Locale locale) {
        return messageSource.getMessage(code, args, locale);
    }

    public String getMessageOrDefault(String code, String defaultMessage) {
        return getMessageOrDefault(code, null, defaultMessage);
    }

    public String getMessageOrDefault(String code, Object[] args, String defaultMessage) {
        return getMessageOrDefault(code, args, defaultMessage, LocaleContextHolder.getLocale());
    }

    public String getMessageOrDefault(
            String code, Object[] args, String defaultMessage, Locale locale) {
        return messageSource.getMessage(code, args, defaultMessage, locale);
    }

    public Locale getCurrentLocale() {
        return LocaleContextHolder.getLocale();
    }

    public String getErrorMessage(String entityType, String errorType, Object... args) {
        String code = String.format("error.%s.%s", errorType, entityType);
        return getMessage(code, args);
    }

    public String getSuccessMessage(String operation, String entityType) {
        return getMessage("success." + operation, new Object[] {entityType});
    }

    public String getEmailSubject(String emailType) {
        return getMessage("email.subject." + emailType);
    }

    public String getEmailTemplate(String templateName, Locale locale) {
        return String.format("emails/%s_%s", templateName, locale.getLanguage());
    }

    public String getEmailTemplate(String templateName) {
        Locale locale = getCurrentLocale();
        return getEmailTemplate(templateName, locale);
    }

    public boolean isRTLLocale(Locale locale) {
        String language = locale.getLanguage();
        return "ar".equals(language) || "he".equals(language) || "fa".equals(language);
    }

    public boolean isRTL() {
        return isRTLLocale(getCurrentLocale());
    }
}
