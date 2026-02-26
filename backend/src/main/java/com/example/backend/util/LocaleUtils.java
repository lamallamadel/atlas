package com.example.backend.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;

public class LocaleUtils {

    private static final String DEFAULT_LOCALE = "fr_FR";

    public static Locale parseLocale(String localeString) {
        if (localeString == null || localeString.trim().isEmpty()) {
            return Locale.FRANCE;
        }

        String[] parts = localeString.split("_");
        if (parts.length == 2) {
            return new Locale(parts[0], parts[1]);
        }
        return Locale.FRANCE;
    }

    public static String formatDateForLocale(LocalDateTime dateTime, String localeString) {
        if (dateTime == null) {
            return "";
        }

        Locale locale = parseLocale(localeString);
        DateTimeFormatter formatter =
                DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale);
        return dateTime.format(formatter);
    }

    public static String formatTimeForLocale(LocalDateTime dateTime, String localeString) {
        if (dateTime == null) {
            return "";
        }

        Locale locale = parseLocale(localeString);
        DateTimeFormatter formatter =
                DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(locale);
        return dateTime.format(formatter);
    }

    public static String formatDateTimeForLocale(LocalDateTime dateTime, String localeString) {
        if (dateTime == null) {
            return "";
        }

        Locale locale = parseLocale(localeString);
        DateTimeFormatter formatter =
                DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM).withLocale(locale);
        return dateTime.format(formatter);
    }

    public static boolean isRtlLocale(String locale) {
        if (locale == null) {
            return false;
        }
        String lowerLocale = locale.toLowerCase();
        return lowerLocale.startsWith("ar_")
                || lowerLocale.startsWith("he_")
                || lowerLocale.startsWith("fa_")
                || lowerLocale.startsWith("ur_");
    }

    public static String getDefaultLocale() {
        return DEFAULT_LOCALE;
    }

    public static String normalizeLocale(String locale) {
        if (locale == null || locale.trim().isEmpty()) {
            return DEFAULT_LOCALE;
        }

        return switch (locale.toLowerCase()) {
            case "fr_fr", "fr_be", "fr_ch", "fr_ca", "fr" -> "fr_FR";
            case "en_us", "en_gb", "en_ca", "en_au", "en" -> "en_US";
            case "ar_ma", "ar_sa", "ar_ae", "ar_eg", "ar" -> "ar_MA";
            case "es_es", "es_mx", "es" -> "es_ES";
            case "de_de", "de_at", "de_ch", "de" -> "de_DE";
            case "it_it", "it" -> "it_IT";
            case "pt_pt", "pt_br", "pt" -> "pt_PT";
            default -> DEFAULT_LOCALE;
        };
    }

    public static String getLocalizedGreeting(String locale) {
        if (locale == null) {
            return "Bonjour";
        }
        return switch (locale.toLowerCase()) {
            case "fr_fr", "fr" -> "Bonjour";
            case "en_us", "en_gb", "en" -> "Hello";
            case "ar_ma", "ar_sa", "ar" -> "مرحبا";
            case "es_es", "es" -> "Hola";
            case "de_de", "de" -> "Guten Tag";
            case "it_it", "it" -> "Buongiorno";
            case "pt_pt", "pt" -> "Olá";
            default -> "Bonjour";
        };
    }

    public static String getLocalizedClientLabel(String locale) {
        if (locale == null) {
            return "Client";
        }
        return switch (locale.toLowerCase()) {
            case "fr_fr", "fr" -> "Client";
            case "en_us", "en_gb", "en" -> "Client";
            case "ar_ma", "ar_sa", "ar" -> "العميل";
            case "es_es", "es" -> "Cliente";
            case "de_de", "de" -> "Kunde";
            case "it_it", "it" -> "Cliente";
            case "pt_pt", "pt" -> "Cliente";
            default -> "Client";
        };
    }
}
