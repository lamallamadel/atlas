package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.LeadActivity;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadActivityRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadActivityService {

    private final LeadActivityRepository leadActivityRepository;
    private final DossierRepository dossierRepository;

    public LeadActivityService(LeadActivityRepository leadActivityRepository, DossierRepository dossierRepository) {
        this.leadActivityRepository = leadActivityRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional
    public LeadActivity logActivity(Long dossierId, String activityType, String description, Integer scoreImpact) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier not found: " + dossierId));

        LeadActivity activity = new LeadActivity();
        activity.setDossier(dossier);
        activity.setActivityType(activityType);
        activity.setDescription(description);
        activity.setScoreImpact(scoreImpact);

        activity = leadActivityRepository.save(activity);

        // Update Dossier total score
        if (scoreImpact != null && scoreImpact != 0) {
            int currentScore = dossier.getScore() != null ? dossier.getScore() : 0;
            dossier.setScore(currentScore + scoreImpact);
            dossierRepository.save(dossier);
        }

        return activity;
    }

    @Transactional(readOnly = true)
    public List<LeadActivity> getActivitiesForDossier(Long dossierId) {
        return leadActivityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);
    }
}
