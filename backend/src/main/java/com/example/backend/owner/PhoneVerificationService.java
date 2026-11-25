package com.example.backend.owner;

import com.example.backend.entity.PhoneVerificationEntity;
import com.example.backend.repository.PhoneVerificationRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Codes à usage unique (R-PROP-01) : 6 chiffres, valables 10 minutes, 5 essais. Limites contre
 * l'abus : 3 envois par numéro en 15 minutes, 10 par adresse IP en une heure.
 */
@Service
public class PhoneVerificationService {

    public static final String PURPOSE_OWNER_SIGNUP = "OWNER_SIGNUP";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final PhoneVerificationRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final OtpSender sender;
    private final int ttlMinutes;
    private final int maxAttempts;
    private final int maxPerPhone;
    private final int maxPerIp;

    public PhoneVerificationService(
            PhoneVerificationRepository repository,
            PasswordEncoder passwordEncoder,
            OtpSender sender,
            @Value("${atlas.owner.otp.ttl-minutes:10}") int ttlMinutes,
            @Value("${atlas.owner.otp.max-attempts:5}") int maxAttempts,
            @Value("${atlas.owner.otp.max-per-phone-15min:3}") int maxPerPhone,
            @Value("${atlas.owner.otp.max-per-ip-hour:10}") int maxPerIp) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.sender = sender;
        this.ttlMinutes = ttlMinutes;
        this.maxAttempts = maxAttempts;
        this.maxPerPhone = maxPerPhone;
        this.maxPerIp = maxPerIp;
    }

    /** Envoie un code ; renvoie le canal utilisé. */
    @Transactional
    public String send(String phone, String purpose, String ipAddress) {
        LocalDateTime now = LocalDateTime.now();
        if (repository.countByPhoneAndPurposeAndCreatedAtAfter(phone, purpose, now.minusMinutes(15))
                >= maxPerPhone) {
            throw tooMany();
        }
        if (ipAddress != null
                && repository.countByIpAddressAndCreatedAtAfter(ipAddress, now.minusHours(1))
                        >= maxPerIp) {
            throw tooMany();
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        PhoneVerificationEntity v = new PhoneVerificationEntity();
        v.setPhone(phone);
        v.setPurpose(purpose);
        v.setCodeHash(passwordEncoder.encode(code));
        v.setAttempts(0);
        v.setExpiresAt(now.plusMinutes(ttlMinutes));
        v.setIpAddress(ipAddress);
        v.setChannel(sender.send(phone, code));
        repository.save(v);
        return v.getChannel();
    }

    /**
     * Vérifie et consomme le code. Un essai raté est enregistré malgré l'erreur renvoyée ({@code
     * noRollbackFor}) : l'appelant ne doit pas l'envelopper dans sa propre transaction, pour que
     * les 5 essais ne se contournent pas.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void verify(String phone, String purpose, String code) {
        PhoneVerificationEntity v =
                repository
                        .findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                                phone, purpose)
                        .orElseThrow(PhoneVerificationService::invalid);
        if (v.getExpiresAt().isBefore(LocalDateTime.now()) || v.getAttempts() >= maxAttempts) {
            throw invalid();
        }
        if (code == null || !passwordEncoder.matches(code.trim(), v.getCodeHash())) {
            v.setAttempts(v.getAttempts() + 1);
            repository.save(v);
            throw invalid();
        }
        v.setConsumedAt(LocalDateTime.now());
        repository.save(v);
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "OTP_INVALID: code incorrect ou expiré.");
    }

    private static ResponseStatusException tooMany() {
        return new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "OTP_RATE_LIMITED: trop de codes demandés, réessayez plus tard.");
    }
}
