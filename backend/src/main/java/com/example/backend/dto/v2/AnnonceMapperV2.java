package com.example.backend.dto.v2;

import com.example.backend.entity.Annonce;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneOffset;
import org.springframework.stereotype.Component;

@Component
public class AnnonceMapperV2 {

    public AnnonceResponseV2 toResponse(Annonce annonce) {
        AnnonceResponseV2 response = new AnnonceResponseV2();
        response.setId(annonce.getId());
        response.setOrgId(annonce.getOrgId());
        response.setTitle(annonce.getTitle());
        response.setDescription(annonce.getDescription());
        response.setCategory(annonce.getCategory());
        response.setType(annonce.getType());
        response.setStatus(annonce.getStatus());
        response.setPhotos(annonce.getPhotos());
        response.setRules(annonce.getRulesJson());
        response.setMetadata(annonce.getMeta());

        AnnonceResponseV2.LocationInfoV2 location = new AnnonceResponseV2.LocationInfoV2();
        location.setAddress(annonce.getAddress());
        location.setCity(annonce.getCity());
        response.setLocation(location);

        AnnonceResponseV2.PropertyDetailsV2 details = new AnnonceResponseV2.PropertyDetailsV2();
        details.setSurface(annonce.getSurface());
        response.setDetails(details);

        AnnonceResponseV2.PricingInfoV2 pricing = new AnnonceResponseV2.PricingInfoV2();
        pricing.setAmount(annonce.getPrice());
        pricing.setCurrency(annonce.getCurrency());
        if (annonce.getPrice() != null
                && annonce.getSurface() != null
                && annonce.getSurface() > 0) {
            BigDecimal pricePerSqm =
                    annonce.getPrice()
                            .divide(
                                    BigDecimal.valueOf(annonce.getSurface()),
                                    2,
                                    RoundingMode.HALF_UP);
            pricing.setPricePerSqm(pricePerSqm);
        }
        response.setPricing(pricing);

        AnnonceResponseV2.AuditInfoV2 audit = new AnnonceResponseV2.AuditInfoV2();
        if (annonce.getCreatedAt() != null) {
            audit.setCreatedAt(annonce.getCreatedAt().atZone(ZoneOffset.UTC).toInstant());
        }
        if (annonce.getUpdatedAt() != null) {
            audit.setUpdatedAt(annonce.getUpdatedAt().atZone(ZoneOffset.UTC).toInstant());
        }
        audit.setCreatedBy(annonce.getCreatedBy());
        audit.setUpdatedBy(annonce.getUpdatedBy());
        response.setAudit(audit);

        return response;
    }
}
