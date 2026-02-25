package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.LeadScore;
import com.example.backend.entity.LeadScoringConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadScoreRepository;
import com.example.backend.repository.LeadScoringConfigRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailDigestService {

    private static final Logger log = LoggerFactory.getLogger(EmailDigestService.class);

    private final LeadScoreRepository leadScoreRepository;
    private final DossierRepository dossierRepository;
    private final LeadScoringConfigRepository configRepository;

    public EmailDigestService(
            LeadScoreRepository leadScoreRepository,
            DossierRepository dossierRepository,
            LeadScoringConfigRepository configRepository) {
        this.leadScoreRepository = leadScoreRepository;
        this.dossierRepository = dossierRepository;
        this.configRepository = configRepository;
    }

    @Scheduled(cron = "${lead.digest.cron:0 0 8 * * MON-FRI}")
    @Transactional(readOnly = true)
    public void sendDailyDigest() {
        log.info("Starting daily lead digest job");

        try {
            Map<String, List<Dossier>> dossiersByOrg = groupDossiersByOrganization();

            for (Map.Entry<String, List<Dossier>> entry : dossiersByOrg.entrySet()) {
                String orgId = entry.getKey();
                List<Dossier> dossiers = entry.getValue();

                try {
                    String originalOrgId = TenantContext.getOrgId();
                    TenantContext.setOrgId(orgId);

                    try {
                        sendDigestForOrganization(orgId, dossiers);
                    } finally {
                        TenantContext.setOrgId(originalOrgId);
                    }
                } catch (Exception e) {
                    log.error("Error sending digest for org {}: {}", orgId, e.getMessage(), e);
                }
            }

            log.info("Daily lead digest job completed");
        } catch (Exception e) {
            log.error("Error in daily digest job: {}", e.getMessage(), e);
        }
    }

    private Map<String, List<Dossier>> groupDossiersByOrganization() {
        Specification<Dossier> spec =
                (root, query, criteriaBuilder) ->
                        criteriaBuilder
                                .in(root.get("status"))
                                .value(
                                        List.of(
                                                DossierStatus.NEW,
                                                DossierStatus.QUALIFYING,
                                                DossierStatus.QUALIFIED));

        List<Dossier> allDossiers = dossierRepository.findAll(spec);

        return allDossiers.stream().collect(Collectors.groupingBy(Dossier::getOrgId));
    }

    private void sendDigestForOrganization(String orgId, List<Dossier> dossiers) {
        LeadScoringConfig config = configRepository.findActiveConfig(orgId).orElse(null);
        if (config == null) {
            log.debug("No active config for org {}, skipping digest", orgId);
            return;
        }

        List<Long> dossierIds = dossiers.stream().map(Dossier::getId).toList();

        List<LeadScore> scores = leadScoreRepository.findByDossierIdIn(dossierIds);
        Map<Long, LeadScore> scoreMap =
                scores.stream().collect(Collectors.toMap(LeadScore::getDossierId, s -> s));

        List<DossierWithScore> highPriorityLeads =
                dossiers.stream()
                        .filter(d -> scoreMap.containsKey(d.getId()))
                        .filter(
                                d ->
                                        scoreMap.get(d.getId()).getTotalScore()
                                                >= config.getAutoQualificationThreshold())
                        .map(d -> new DossierWithScore(d, scoreMap.get(d.getId())))
                        .sorted(
                                (a, b) ->
                                        Integer.compare(
                                                b.score.getTotalScore(), a.score.getTotalScore()))
                        .limit(20)
                        .toList();

        if (highPriorityLeads.isEmpty()) {
            log.debug("No high-priority leads for org {}, skipping digest", orgId);
            return;
        }

        String htmlContent = buildDigestHtml(highPriorityLeads, config);
        String textContent = buildDigestText(highPriorityLeads, config);

        String agentEmail = getAgentEmailForOrg(orgId);
        if (agentEmail == null || agentEmail.isEmpty()) {
            log.warn("No agent email configured for org {}, skipping digest", orgId);
            return;
        }

        try {
            log.info(
                    "Daily digest generated for {} high-priority leads for org {}",
                    highPriorityLeads.size(),
                    orgId);
            log.debug("Digest would be sent to: {}", agentEmail);
        } catch (Exception e) {
            log.error("Error generating digest for org {}: {}", orgId, e.getMessage(), e);
        }
    }

    private String buildDigestHtml(List<DossierWithScore> leads, LeadScoringConfig config) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append("h1 { color: #2c3e50; }");
        html.append(
                ".lead { border: 1px solid #e0e0e0; padding: 15px; margin: 10px 0; border-radius: 5px; }");
        html.append(".urgent { border-left: 4px solid #e74c3c; background-color: #fee; }");
        html.append(".high { border-left: 4px solid #f39c12; background-color: #fff3cd; }");
        html.append(".medium { border-left: 4px solid #3498db; background-color: #e8f4f8; }");
        html.append(".score { font-size: 24px; font-weight: bold; color: #2c3e50; }");
        html.append(".detail { color: #7f8c8d; font-size: 14px; }");
        html.append("</style></head><body>");

        html.append("<h1>Daily High-Priority Leads Digest</h1>");
        html.append("<p>Date: ")
                .append(LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                .append("</p>");
        html.append("<p>You have <strong>")
                .append(leads.size())
                .append("</strong> high-priority leads requiring attention.</p>");

        for (DossierWithScore dws : leads) {
            String urgencyClass =
                    getUrgencyClass(
                            dws.score.getTotalScore(), config.getAutoQualificationThreshold());
            html.append("<div class='lead ").append(urgencyClass).append("'>");
            html.append("<div class='score'>")
                    .append(dws.score.getTotalScore())
                    .append(" pts</div>");
            html.append("<h3>")
                    .append(
                            escapeHtml(
                                    dws.dossier.getLeadName() != null
                                            ? dws.dossier.getLeadName()
                                            : "Unknown Lead"))
                    .append("</h3>");
            html.append("<div class='detail'>");
            html.append("<strong>Status:</strong> ").append(dws.dossier.getStatus()).append("<br>");
            if (dws.dossier.getLeadPhone() != null) {
                html.append("<strong>Phone:</strong> ")
                        .append(escapeHtml(dws.dossier.getLeadPhone()))
                        .append("<br>");
            }
            if (dws.dossier.getLeadEmail() != null) {
                html.append("<strong>Email:</strong> ")
                        .append(escapeHtml(dws.dossier.getLeadEmail()))
                        .append("<br>");
            }
            if (dws.dossier.getSource() != null) {
                html.append("<strong>Source:</strong> ")
                        .append(dws.dossier.getSource().getValue())
                        .append("<br>");
            }
            html.append("<strong>Created:</strong> ")
                    .append(
                            dws.dossier
                                    .getCreatedAt()
                                    .format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")))
                    .append("<br>");
            html.append("</div>");
            html.append("</div>");
        }

        html.append("</body></html>");
        return html.toString();
    }

    private String buildDigestText(List<DossierWithScore> leads, LeadScoringConfig config) {
        StringBuilder text = new StringBuilder();
        text.append("Daily High-Priority Leads Digest\n");
        text.append("Date: ")
                .append(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE))
                .append("\n\n");
        text.append("You have ")
                .append(leads.size())
                .append(" high-priority leads requiring attention.\n\n");

        for (DossierWithScore dws : leads) {
            text.append("Score: ").append(dws.score.getTotalScore()).append(" pts\n");
            text.append("Lead: ")
                    .append(
                            dws.dossier.getLeadName() != null
                                    ? dws.dossier.getLeadName()
                                    : "Unknown")
                    .append("\n");
            text.append("Status: ").append(dws.dossier.getStatus()).append("\n");
            if (dws.dossier.getLeadPhone() != null) {
                text.append("Phone: ").append(dws.dossier.getLeadPhone()).append("\n");
            }
            if (dws.dossier.getLeadEmail() != null) {
                text.append("Email: ").append(dws.dossier.getLeadEmail()).append("\n");
            }
            if (dws.dossier.getSource() != null) {
                text.append("Source: ").append(dws.dossier.getSource().getValue()).append("\n");
            }
            text.append("Created: ")
                    .append(
                            dws.dossier
                                    .getCreatedAt()
                                    .format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")))
                    .append("\n");
            text.append("\n---\n\n");
        }

        return text.toString();
    }

    private String getUrgencyClass(int score, int threshold) {
        if (score >= threshold + 20) {
            return "urgent";
        } else if (score >= threshold + 10) {
            return "high";
        } else {
            return "medium";
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String getAgentEmailForOrg(String orgId) {
        return "agent@example.com";
    }

    private static class DossierWithScore {
        final Dossier dossier;
        final LeadScore score;

        DossierWithScore(Dossier dossier, LeadScore score) {
            this.dossier = dossier;
            this.score = score;
        }
    }
}
