package com.example.backend.owner;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Numéros de téléphone au format E.164 ; les numéros marocains locaux (06…, 07…, 05…) sont repris.
 */
public final class PhoneNumbers {

    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final Pattern MA_LOCAL = Pattern.compile("^0[5-7]\\d{8}$");

    private PhoneNumbers() {}

    public static Optional<String> normalize(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String s = raw.replaceAll("[\\s.\\-()]", "");
        if (s.startsWith("00")) {
            s = "+" + s.substring(2);
        }
        if (MA_LOCAL.matcher(s).matches()) {
            s = "+212" + s.substring(1);
        }
        if (s.startsWith("+2120")) {
            s = "+212" + s.substring(5);
        }
        return E164.matcher(s).matches() ? Optional.of(s) : Optional.empty();
    }

    /** Pour les journaux : +2126•••••34. */
    public static String mask(String phone) {
        if (phone == null || phone.length() < 6) {
            return "***";
        }
        return phone.substring(0, 5)
                + "•".repeat(phone.length() - 7)
                + phone.substring(phone.length() - 2);
    }
}
