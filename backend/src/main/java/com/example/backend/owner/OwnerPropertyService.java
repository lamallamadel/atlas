package com.example.backend.owner;

import com.example.backend.entity.PropertyEntity;
import com.example.backend.repository.PropertyRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Biens du propriétaire connecté (UC-P2), toujours dans son organisation personnelle. */
@Service
public class OwnerPropertyService {

    static final Set<String> TRANSACTIONS = Set.of("SALE", "RENT");

    private final OwnerContext ownerContext;
    private final PropertyRepository properties;

    public OwnerPropertyService(OwnerContext ownerContext, PropertyRepository properties) {
        this.ownerContext = ownerContext;
        this.properties = properties;
    }

    public record PropertyRequest(
            String title,
            String propertyType,
            String transactionType,
            String city,
            String district,
            String address,
            Double surface,
            Integer rooms,
            BigDecimal expectedPrice,
            String description,
            String landTitleNumber) {}

    @Transactional(readOnly = true)
    public List<PropertyEntity> list() {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return properties.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> orgId.equals(p.getOrgId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PropertyEntity get(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return properties
                .findById(id)
                .filter(p -> orgId.equals(p.getOrgId()))
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Bien introuvable"));
    }

    @Transactional
    public PropertyEntity create(PropertyRequest request) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        PropertyEntity p = new PropertyEntity();
        p.setOrgId(orgId);
        apply(p, request);
        return properties.save(p);
    }

    @Transactional
    public PropertyEntity update(Long id, PropertyRequest request) {
        PropertyEntity p = get(id);
        apply(p, request);
        return properties.save(p);
    }

    private static void apply(PropertyEntity p, PropertyRequest r) {
        if (r.title() == null || r.title().isBlank()) {
            throw bad("TITLE_REQUIRED: donnez un titre au bien.");
        }
        if (r.city() == null || r.city().isBlank()) {
            throw bad("CITY_REQUIRED: indiquez la ville.");
        }
        String tx = r.transactionType() == null ? "" : r.transactionType().trim().toUpperCase();
        if (!TRANSACTIONS.contains(tx)) {
            throw bad("TRANSACTION_REQUIRED: vente (SALE) ou location (RENT).");
        }
        p.setTitle(r.title().trim());
        p.setPropertyType(trim(r.propertyType()));
        p.setTransactionType(tx);
        p.setCity(r.city().trim());
        p.setDistrict(trim(r.district()));
        p.setAddress(trim(r.address()));
        p.setSurface(r.surface());
        p.setRooms(r.rooms());
        p.setExpectedPrice(r.expectedPrice());
        p.setCurrency("MAD");
        p.setDescription(trim(r.description()));
        String landTitle = trim(r.landTitleNumber());
        if (!java.util.Objects.equals(landTitle, p.getLandTitleNumber())) {
            // Un autre titre foncier n'a pas été contrôlé : le badge « Bien vérifié » tombe.
            p.setVerificationStatus(PropertyEntity.VERIFICATION_NONE);
        }
        p.setLandTitleNumber(landTitle);
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
