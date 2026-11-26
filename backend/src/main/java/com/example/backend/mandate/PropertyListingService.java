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

    public PropertyListingService(
            AnnonceRepository annonces,
            MandateRepository mandates,
            AgencyDirectoryService agencies) {
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
}
