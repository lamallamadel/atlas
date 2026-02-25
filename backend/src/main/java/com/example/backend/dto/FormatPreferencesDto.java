package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Format preferences data transfer object")
public class FormatPreferencesDto {

    @Schema(description = "Date format pattern", example = "dd/MM/yyyy")
    @Pattern(
            regexp = "^(dd/MM/yyyy|MM/dd/yyyy|yyyy-MM-dd|dd-MM-yyyy|dd\\.MM\\.yyyy)$",
            message =
                    "Date format must be one of: dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd, dd-MM-yyyy, dd.MM.yyyy")
    private String dateFormat;

    @Schema(description = "Time format pattern (12h or 24h)", example = "24h")
    @Pattern(regexp = "^(12h|24h)$", message = "Time format must be either 12h or 24h")
    private String timeFormat;

    @Schema(description = "Currency code (ISO 4217)", example = "EUR")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a valid ISO 4217 three-letter code")
    private String currency;

    @Schema(description = "Number format pattern", example = "1 234,56")
    @Pattern(
            regexp = "^(1,234\\.56|1\\.234,56|1 234,56|1234\\.56|1234,56)$",
            message =
                    "Number format must be one of: 1,234.56, 1.234,56, 1 234,56, 1234.56, 1234,56")
    private String numberFormat;

    public FormatPreferencesDto() {}

    public FormatPreferencesDto(
            String dateFormat, String timeFormat, String currency, String numberFormat) {
        this.dateFormat = dateFormat;
        this.timeFormat = timeFormat;
        this.currency = currency;
        this.numberFormat = numberFormat;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getNumberFormat() {
        return numberFormat;
    }

    public void setNumberFormat(String numberFormat) {
        this.numberFormat = numberFormat;
    }
}
