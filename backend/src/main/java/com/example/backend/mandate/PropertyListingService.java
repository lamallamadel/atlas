package com.example.backend.mandate;

import com.example.backend.dto.PublicAnnonceResponse.Publisher;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.MandateRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Le bien sur le portail, quel que soit le nombre d'annonceurs (R-PROP-06) : une fiche par bien
 * avec la liste des annonceurs, et redirection de l'annonce d'un propriétaire suspendue par un
 * mandat exclusif vers celle de l'agence (R-PROP-05). Lecture publique, sans organisation.
 */
@Service
public class PropertyListingService {

    private final AnnonceRepository annonces;
    private final MandateRepository mandates;
    private final AgencyDirectoryService agencies;
    private final com.example.backend.repository.PropertyRepository properties;

    public PropertyListingService(
            AnnonceRepository annonces,
            MandateRepository mandates,
            AgencyDirectoryService agencies,
            com.example.backend.repository.PropertyRepository properties) {
        this.properties = properties;
        this.annonces = annonces;
        this.mandates = mandates;
        this.agencies = agencies;
    }

    /** Annonceurs publiés du même bien, dans l'ordre de publication. */
    @Transactional(readOnly = true)
    public List<Publisher> publishers(Annonce a) {
        if (a.getPropertyId() == null) {
            return List.of();
        }
        List<Annonce> published =
                annonces.findByPropertyIdOrderByIdAsc(a.getPropertyId()).stream()
                        .filter(
                                x ->
                                        AnnonceStatus.normalize(x.getStatus())
                                                == AnnonceStatus.PUBLISHED)
                        .toList();
        if (published.size() < 2) {
            return List.of();
        }
        Map<String, String> names =
                agencies.names(
                        published.stream()
                                .filter(x -> !"OWNER".equals(x.getPublisherKind()))
                                .map(Annonce::getOrgId)
                                .distinct()
                                .toList());
        return published.stream()
                .map(
                        x ->
                                "OWNER".equals(x.getPublisherKind())
                                        ? new Publisher(x.getId(), "OWNER", "Particulier")
                                        : new Publisher(
                                                x.getId(), "AGENCY", names.get(x.getOrgId())))
                .toList();
    }

    /**
     * Pour l'annonce {@code id} d'un propriétaire suspendue sous mandat exclusif : l'annonce
     * publiée de l'agence mandatée.
     */
    @Transactional(readOnly = true)
    public Optional<Long> exclusiveReplacement(Long id) {
        Annonce a = annonces.findById(id).orElse(null);
        if (a == null || a.getPropertyId() == null || !"OWNER".equals(a.getPublisherKind())) {
            return Optional.empty();
        }
        return mandates
                .findByPropertyIdAndStatusIn(
                        a.getPropertyId(), MandateMarketplaceService.LIVE_MANDATE)
                .stream()
                .filter(m -> MandateEntity.EXCLUSIVE.equals(m.getMandateType()))
                .map(m -> annonces.findFirstByMandateIdOrderByIdAsc(m.getId()).orElse(null))
                .filter(
                        x ->
                                x != null
                                        && AnnonceStatus.normalize(x.getStatus())
                                                == AnnonceStatus.PUBLISHED)
                .map(Annonce::getId)
                .findFirst();
    }

    /** Badge « Bien vérifié » : le bien de l'annonce a un titre foncier contrôlé. */
    @Transactional(readOnly = true)
    public boolean propertyVerified(Annonce a) {
        return a.getPropertyId() != null
                && properties
                        .findById(a.getPropertyId())
                        .map(
                                p ->
                                        com.example.backend.entity.PropertyEntity
                                                .VERIFICATION_VERIFIED
                                                .equals(p.getVerificationStatus()))
                        .orElse(false);
    }

    /**
     * Cartes du portail, en deux requêtes pour toute la page : nom de l'agence qui publie et nombre
     * de pièces de la fiche du bien (pour les annonces dont la méta ne le donne pas).
     */
    @Transactional(readOnly = true)
    public Map<Long, ListingInfo> listingInfo(List<Annonce> page) {
        Map<String, String> names =
                agencies.names(
                        page.stream()
                                .filter(a -> !"OWNER".equals(a.getPublisherKind()))
                                .map(Annonce::getOrgId)
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .toList());
        Map<Long, Integer> rooms = new java.util.HashMap<>();
        properties
                .findAllById(
                        page.stream()
                                .map(Annonce::getPropertyId)
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .toList())
                .forEach(
                        p -> {
                            if (p.getRooms() != null && p.getRooms() > 0) {
                                rooms.put(p.getId(), p.getRooms());
                            }
                        });
        Map<Long, ListingInfo> out = new java.util.HashMap<>();
        for (Annonce a : page) {
            String agency = "OWNER".equals(a.getPublisherKind()) ? null : names.get(a.getOrgId());
            Integer r = a.getPropertyId() == null ? null : rooms.get(a.getPropertyId());
            out.put(a.getId(), new ListingInfo(agency, r));
        }
        return out;
    }

    /**
     * Nom de l'agence (null pour un particulier) et pièces de la fiche du bien (null si inconnu).
     */
    public record ListingInfo(String agencyName, Integer rooms) {}
}
