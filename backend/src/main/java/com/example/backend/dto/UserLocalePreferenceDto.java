package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UserLocalePreferenceDto {

    @NotBlank(message = "Locale is required")
    @Pattern(regexp = "^(fr|en|es|ar)$", message = "Locale must be one of: fr, en, es, ar")
    private String locale;

    private String dateFormat;
    private String timeFormat;
    private String numberFormat;
    private String currency;

    public UserLocalePreferenceDto() {}

    public UserLocalePreferenceDto(String locale) {
        this.locale = locale;
        this.dateFormat = getDefaultDateFormat(locale);
        this.timeFormat = getDefaultTimeFormat(locale);
        this.numberFormat = getDefaultNumberFormat(locale);
        this.currency = getDefaultCurrency(locale);
    }

    private String getDefaultDateFormat(String locale) {
        return switch (locale) {
            case "en" -> "MM/dd/yyyy";
            case "es" -> "dd/MM/yyyy";
            default -> "dd/MM/yyyy";
        };
    }

    private String getDefaultTimeFormat(String locale) {
        return switch (locale) {
            case "en" -> "hh:mm a";
            default -> "HH:mm";
        };
    }

    private String getDefaultNumberFormat(String locale) {
        return switch (locale) {
            case "en" -> "1,234.56";
            default -> "1 234,56";
        };
    }

    private String getDefaultCurrency(String locale) {
        return "EUR";
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    public void setTimeFormat(String timeFormat) {
        this.timeFormat = timeFormat;
    }

    public String getNumberFormat() {
        return numberFormat;
    }

    public void setNumberFormat(String numberFormat) {
        this.numberFormat = numberFormat;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
