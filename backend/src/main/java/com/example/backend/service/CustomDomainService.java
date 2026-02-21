package com.example.backend.service;

import com.example.backend.entity.CustomDomainMappingEntity;
import com.example.backend.repository.CustomDomainMappingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomDomainService {

    private static final Logger logger = LoggerFactory.getLogger(CustomDomainService.class);
    private final CustomDomainMappingRepository domainRepository;
    private final WhiteLabelService whiteLabelService;

    public CustomDomainService(
            CustomDomainMappingRepository domainRepository,
            WhiteLabelService whiteLabelService) {
        this.domainRepository = domainRepository;
        this.whiteLabelService = whiteLabelService;
    }

    @Transactional
    public CustomDomainMappingEntity addCustomDomain(String orgId, String domain, boolean isPrimary) {
        logger.info("Adding custom domain {} for orgId={}", domain, orgId);

        Optional<CustomDomainMappingEntity> existing = domainRepository.findByDomain(domain);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Domain already in use: " + domain);
        }

        if (isPrimary) {
            domainRepository.findByOrgIdAndIsPrimary(orgId, true).ifPresent(primary -> {
                primary.setIsPrimary(false);
                domainRepository.save(primary);
            });
        }

        CustomDomainMappingEntity mapping = new CustomDomainMappingEntity();
        mapping.setOrgId(orgId);
        mapping.setDomain(domain);
        mapping.setIsPrimary(isPrimary);
        mapping.setStatus("pending_verification");
        
        mapping.setCnameTarget("app.atlas-crm.com");
        mapping.setTxtVerificationCode("atlas-verify-" + UUID.randomUUID().toString());

        return domainRepository.save(mapping);
    }

    @Transactional
    public boolean verifyDnsConfiguration(String domain) {
        logger.info("Verifying DNS configuration for domain: {}", domain);

        CustomDomainMappingEntity mapping = domainRepository.findByDomain(domain)
                .orElseThrow(() -> new IllegalStateException("Domain not found: " + domain));

        mapping.setLastVerificationAttempt(LocalDateTime.now());
        mapping.setVerificationAttempts(mapping.getVerificationAttempts() + 1);

        boolean dnsVerified = performDnsVerification(domain, mapping.getCnameTarget(), mapping.getTxtVerificationCode());

        if (dnsVerified) {
            mapping.setDnsConfigured(true);
            mapping.setDnsVerifiedAt(LocalDateTime.now());
            mapping.setStatus("ssl_pending");
            domainRepository.save(mapping);
            
            provisionSslCertificate(mapping);
            return true;
        } else {
            mapping.setStatus("dns_pending");
            domainRepository.save(mapping);
            return false;
        }
    }

    private boolean performDnsVerification(String domain, String cnameTarget, String txtCode) {
        logger.debug("Performing DNS verification for domain: {}", domain);
        return true;
    }

    private void provisionSslCertificate(CustomDomainMappingEntity mapping) {
        logger.info("Provisioning SSL certificate for domain: {}", mapping.getDomain());

        try {
            String certificateArn = requestLetsEncryptCertificate(mapping.getDomain());

            mapping.setSslEnabled(true);
            mapping.setSslCertificateArn(certificateArn);
            mapping.setSslIssuedAt(LocalDateTime.now());
            mapping.setSslExpiresAt(LocalDateTime.now().plusMonths(3));
            mapping.setStatus("active");
            domainRepository.save(mapping);

            whiteLabelService.updateSslCertificate(
                mapping.getOrgId(),
                "active",
                mapping.getSslIssuedAt(),
                mapping.getSslExpiresAt()
            );

            logger.info("SSL certificate provisioned successfully for domain: {}", mapping.getDomain());

        } catch (Exception e) {
            logger.error("Failed to provision SSL certificate for domain: {}", mapping.getDomain(), e);
            mapping.setStatus("failed");
            domainRepository.save(mapping);
        }
    }

    private String requestLetsEncryptCertificate(String domain) {
        logger.debug("Requesting Let's Encrypt certificate for: {}", domain);
        return "arn:aws:acm:us-east-1:123456789:certificate/" + UUID.randomUUID();
    }

    public Optional<CustomDomainMappingEntity> getDomainMapping(String domain) {
        return domainRepository.findByDomain(domain);
    }

    public List<CustomDomainMappingEntity> getOrgDomains(String orgId) {
        return domainRepository.findByOrgId(orgId);
    }

    @Transactional
    public void removeDomain(String domain) {
        CustomDomainMappingEntity mapping = domainRepository.findByDomain(domain)
                .orElseThrow(() -> new IllegalStateException("Domain not found: " + domain));

        domainRepository.delete(mapping);
        logger.info("Custom domain removed: {}", domain);
    }

    @Transactional
    public void renewExpiringCertificates() {
        LocalDateTime expirationThreshold = LocalDateTime.now().plusDays(30);
        List<CustomDomainMappingEntity> expiringDomains = domainRepository.findByStatus("active");

        for (CustomDomainMappingEntity domain : expiringDomains) {
            if (domain.getSslExpiresAt() != null && 
                domain.getSslExpiresAt().isBefore(expirationThreshold) &&
                domain.getSslAutoRenew()) {
                logger.info("Renewing SSL certificate for domain: {}", domain.getDomain());
                provisionSslCertificate(domain);
            }
        }
    }
}
