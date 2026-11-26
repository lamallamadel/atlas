package com.example.backend.mandate;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Masque les coordonnées écrites dans un message de la bourse avant acceptation (R-PROP-08) :
 * adresses e-mail, numéros de téléphone (9 chiffres ou plus : une date ou un prix ne sont pas
 * masqués), liens WhatsApp et Telegram.
 */
public final class ContactMasker {

    public static final String MASK = "[coordonnées masquées]";

    private static final Pattern EMAIL =
            Pattern.compile(
                    "[A-Za-z0-9._%+-]+\\s*(@|\\(at\\)|\\[at\\])\\s*[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern LINK =
            Pattern.compile(
                    "(https?://)?(www\\.)?(wa\\.me|api\\.whatsapp\\.com|chat\\.whatsapp\\.com|t\\.me)\\S*",
                    Pattern.CASE_INSENSITIVE);

    /** Suite de chiffres avec séparateurs usuels ; retenue si elle compte 9 chiffres ou plus. */
    private static final Pattern PHONE = Pattern.compile("\\+?\\d[\\d\\s.\\-()]{7,}\\d");

    private ContactMasker() {}

    public static String mask(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String out = LINK.matcher(text).replaceAll(MASK);
        out = EMAIL.matcher(out).replaceAll(MASK);
        Matcher m = PHONE.matcher(out);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            long digits = m.group().chars().filter(Character::isDigit).count();
            m.appendReplacement(sb, Matcher.quoteReplacement(digits >= 9 ? MASK : m.group()));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
