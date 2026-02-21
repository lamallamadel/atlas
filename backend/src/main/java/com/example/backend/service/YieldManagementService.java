package com.example.backend.service;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Profile("!test & !backend-e2e")
public class YieldManagementService {

    private static final Logger log = LoggerFactory.getLogger(YieldManagementService.class);

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final LeadActivityRepository leadActivityRepository;

    public YieldManagementService(
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            LeadActivityRepository leadActivityRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.leadActivityRepository = leadActivityRepository;
    }

    // Tâche CRON qui tourne à 2h du matin
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void evaluateYield() {
        log.info("Starting Yield Management job...");
        LocalDateTime thresholdDateWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime thresholdDateMonth = LocalDateTime.now().minusDays(30);

        List<Annonce> activeAnnonces = annonceRepository.findAll().stream()
                .filter(a -> AnnonceStatus.ACTIVE.equals(a.getStatus()))
                .toList();

        for (Annonce annonce : activeAnnonces) {
            try {
                Long dossierCount = dossierRepository.countByAnnonceIdAndCreatedAtAfter(annonce.getId(),
                        thresholdDateWeek);
                Long activityCount = leadActivityRepository.countActivitiesByAnnonceIdAndCreatedAtAfter(annonce.getId(),
                        thresholdDateWeek);

                Long dossierCountMonthly = dossierRepository.countByAnnonceIdAndCreatedAtAfter(annonce.getId(),
                        thresholdDateMonth);
                Long activityCountMonthly = leadActivityRepository
                        .countActivitiesByAnnonceIdAndCreatedAtAfter(annonce.getId(), thresholdDateMonth);

                dossierCount = dossierCount != null ? dossierCount : 0L;
                activityCount = activityCount != null ? activityCount : 0L;

                long totalInterestWeek = dossierCount * 3 + activityCount;
                long totalInterestMonth = (dossierCountMonthly != null ? dossierCountMonthly : 0L) * 3
                        + (activityCountMonthly != null ? activityCountMonthly : 0L);

                if (totalInterestWeek > 15) {
                    BigDecimal currentPrice = annonce.getPrice();
                    if (currentPrice != null) {
                        BigDecimal newPrice = currentPrice.multiply(BigDecimal.valueOf(1.02)); // +2%
                        annonce.setPrice(newPrice);
                        String aiMessage = "Yield Management: Fort intérêt (+2%)";
                        String currentDetails = annonce.getAiScoreDetails();
                        annonce.setAiScoreDetails(
                                currentDetails != null ? currentDetails + " | " + aiMessage : aiMessage);
                        annonceRepository.save(annonce);
                        log.info("Yield Mgt: Increased price for annonce {}", annonce.getId());
                    }
                } else if (totalInterestMonth < 3) {
                    String aiMessage = "Yield Management: Faible intérêt après 30 jours, envisagez une baisse de prix.";
                    String currentDetails = annonce.getAiScoreDetails();
                    if (currentDetails == null || !currentDetails.contains("Faible intérêt")) {
                        annonce.setAiScoreDetails(
                                currentDetails != null ? currentDetails + " | " + aiMessage : aiMessage);
                        annonceRepository.save(annonce);
                        log.info("Yield Mgt: Alert generated for annonce {}", annonce.getId());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to evaluate yield for annonce {}: {}", annonce.getId(), e.getMessage());
            }
        }
        log.info("Yield Management job completed.");
    }
}
