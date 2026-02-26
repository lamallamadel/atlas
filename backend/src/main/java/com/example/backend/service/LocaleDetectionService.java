package com.example.backend.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LocaleDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(LocaleDetectionService.class);
    private static final String DEFAULT_LOCALE = "fr_FR";

    private final PhoneNumberUtil phoneNumberUtil;

    public LocaleDetectionService() {
        this.phoneNumberUtil = PhoneNumberUtil.getInstance();
    }

    public String detectLocaleFromPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return DEFAULT_LOCALE;
        }

        try {
            Phonenumber.PhoneNumber parsedNumber = phoneNumberUtil.parse(phoneNumber, null);
            String countryCode = phoneNumberUtil.getRegionCodeForNumber(parsedNumber);

            return mapCountryCodeToLocale(countryCode);
        } catch (NumberParseException e) {
            logger.debug(
                    "Failed to parse phone number '{}': {}. Using default locale.",
                    phoneNumber,
                    e.getMessage());
            return DEFAULT_LOCALE;
        }
    }

    private String mapCountryCodeToLocale(String countryCode) {
        if (countryCode == null) {
            return DEFAULT_LOCALE;
        }

        return switch (countryCode.toUpperCase()) {
            case "MA" -> "ar_MA";
            case "US", "GB", "CA", "AU", "NZ", "IE" -> "en_US";
            case "FR", "BE", "CH", "LU", "MC" -> "fr_FR";
            case "ES" -> "es_ES";
            case "DE", "AT" -> "de_DE";
            case "IT" -> "it_IT";
            case "PT" -> "pt_PT";
            case "SA",
                            "AE",
                            "EG",
                            "DZ",
                            "TN",
                            "LB",
                            "JO",
                            "IQ",
                            "KW",
                            "OM",
                            "QA",
                            "BH",
                            "YE",
                            "SY" ->
                    "ar_MA";
            default -> DEFAULT_LOCALE;
        };
    }

    public String getDefaultLocale() {
        return DEFAULT_LOCALE;
    }

    public boolean isRtlLocale(String locale) {
        if (locale == null) {
            return false;
        }
        return locale.startsWith("ar_") || locale.startsWith("he_");
    }
}
