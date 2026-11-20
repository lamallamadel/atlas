package com.example.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;

/** Page « Mes relances » : sections, ordre d'urgence, exclusions, « mes clients ». */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class BuyerInboxBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private JdbcTemplate jdbc;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;

    private final LocalDateTime now = LocalDateTime.now();
    private Long annonceId;

    @BeforeEach
    void setUp() {
        annonceId = annonce(ORG1, "Villa Achakar");
    }

    private Long annonce(String org, String title) {
        Annonce a = new Annonce();
        a.setOrgId(org);
        a.setTitle(title);
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        return annonceRepository.save(a).getId();
    }

    private Dossier buyer(String org, String name, String agent) {
        Dossier d = new Dossier();
        d.setOrgId(org);
        d.setLeadName(name);
        d.setLeadPhone("+2126" + Math.abs(name.hashCode() % 100000000));
        d.setStatus(DossierStatus.QUALIFIED);
        d = dossierRepository.saveAndFlush(d);
        jdbc.update("UPDATE dossier SET created_by = ? WHERE id = ?", agent, d.getId());
        return d;
    }

    private AnnonceDossierMatch match(
            Long annonce,
            Dossier d,
            LocalDateTime pitchedAt,
            String intent,
            LocalDateTime replyAt) {
        AnnonceDossierMatch m = new AnnonceDossierMatch();
        m.setOrgId(d.getOrgId());
        m.setAnnonceId(annonce);
        m.setDossierId(d.getId());
        m.setScore(80);
        m.setReasons(List.of());
        m.setAlerts(List.of());
        m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
        m.setPitchedAt(pitchedAt);
        m.setReplyIntent(intent);
        m.setReplyAt(replyAt);
        m.setReplyExcerpt(intent != null ? "réponse de " + d.getLeadName() : null);
        return matchRepository.save(m);
    }

    private void followUp(AnnonceDossierMatch m, String kind) {
        m.setFollowUpKind(kind);
        m.setFollowUpNotifiedAt(now.minusHours(1));
        matchRepository.save(m);
    }

    private AppointmentEntity visit(Dossier d, LocalDateTime start, AppointmentStatus status) {
        AppointmentEntity a = new AppointmentEntity();
        a.setOrgId(d.getOrgId());
        a.setDossier(d);
        a.setStartTime(start);
        a.setEndTime(start.plusMinutes(45));
        a.setStatus(status);
        return appointmentRepository.save(a);
    }

    @Test
    void sections_et_urgence() throws Exception {
        // À relancer : client qui attend (avant le silence), le plus ancien d'abord
        followUp(
                match(
                        annonceId,
                        buyer(ORG1, "Attend-recent", "test-user"),
                        now.minusDays(3),
                        "QUESTION",
                        now.minusHours(26)),
                "AGENT_REPLY_DUE");
        followUp(
                match(
                        annonceId,
                        buyer(ORG1, "Attend-ancien", "test-user"),
                        now.minusDays(4),
                        "VISITE",
                        now.minusHours(50)),
                "AGENT_REPLY_DUE");
        followUp(
                match(
                        annonceId,
                        buyer(ORG1, "Silence", "autre-agent"),
                        now.minusDays(4),
                        null,
                        null),
                "CLIENT_SILENT");
        // Visite à planifier (dont une visite annulée)
        match(
                annonceId,
                buyer(ORG1, "Veut-visiter", "test-user"),
                now.minusDays(1),
                "VISITE",
                now.minusHours(3));
        Dossier annule = buyer(ORG1, "Visite-annulee", "test-user");
        AnnonceDossierMatch ma =
                match(annonceId, annule, now.minusDays(2), "VISITE", now.minusHours(20));
        ma.setVisitAppointmentId(
                visit(annule, now.plusDays(1), AppointmentStatus.CANCELLED).getId());
        matchRepository.save(ma);
        // Réponse récente
        match(
                annonceId,
                buyer(ORG1, "Negocie", "test-user"),
                now.minusDays(1),
                "NEGOCIATION",
                now.minusHours(2));
        // Visite prévue
        Dossier prevu = buyer(ORG1, "Visite-prevue", "test-user");
        AnnonceDossierMatch mv =
                match(annonceId, prevu, now.minusDays(2), "VISITE", now.minusDays(1));
        mv.setVisitAppointmentId(
                visit(prevu, now.plusDays(2), AppointmentStatus.SCHEDULED).getId());
        matchRepository.save(mv);
        // Exclus : a refusé, réponse ancienne, écarté, autre organisation, visite passée
        match(
                annonceId,
                buyer(ORG1, "Refus", "test-user"),
                now.minusDays(1),
                "PAS_INTERESSE",
                now.minusHours(2));
        match(
                annonceId,
                buyer(ORG1, "Vieille-reponse", "test-user"),
                now.minusDays(20),
                "INTERESSE",
                now.minusDays(10));
        AnnonceDossierMatch ecarte =
                match(
                        annonceId,
                        buyer(ORG1, "Ecarte", "test-user"),
                        now.minusDays(1),
                        "VISITE",
                        now.minusHours(1));
        ecarte.setStatus(AnnonceDossierMatch.STATUS_DISMISSED);
        matchRepository.save(ecarte);
        followUp(
                match(
                        annonce("ORG2", "Autre"),
                        buyer("ORG2", "Autre-org", "test-user"),
                        now.minusDays(4),
                        null,
                        null),
                "CLIENT_SILENT");
        Dossier passe = buyer(ORG1, "Visite-passee", "test-user");
        AnnonceDossierMatch mp =
                match(annonceId, passe, now.minusDays(9), "VISITE", now.minusDays(8));
        mp.setVisitAppointmentId(
                visit(passe, now.minusDays(2), AppointmentStatus.COMPLETED).getId());
        matchRepository.save(mp);

        em.flush();
        em.clear(); // l'agent des dossiers a été modifié en SQL
        mockMvc.perform(withTenantHeaders(get("/api/v1/buyer-inbox"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(7))
                .andExpect(jsonPath("$.counts.FOLLOW_UP").value(3))
                .andExpect(jsonPath("$.counts.VISIT_TO_PLAN").value(2))
                .andExpect(jsonPath("$.counts.RECENT_REPLY").value(1))
                .andExpect(jsonPath("$.counts.UPCOMING_VISIT").value(1))
                .andExpect(jsonPath("$.items[0].leadName").value("Attend-ancien"))
                .andExpect(jsonPath("$.items[1].leadName").value("Attend-recent"))
                .andExpect(jsonPath("$.items[2].leadName").value("Silence"))
                .andExpect(jsonPath("$.items[2].followUpKind").value("CLIENT_SILENT"))
                .andExpect(jsonPath("$.items[3].leadName").value("Visite-annulee"))
                .andExpect(jsonPath("$.items[4].leadName").value("Veut-visiter"))
                .andExpect(jsonPath("$.items[5].section").value("RECENT_REPLY"))
                .andExpect(jsonPath("$.items[5].answered").value(false))
                .andExpect(jsonPath("$.items[6].section").value("UPCOMING_VISIT"))
                .andExpect(jsonPath("$.items[6].visitStart").exists())
                .andExpect(jsonPath("$.items[6].annonceTitle").value("Villa Achakar"));

        // « mes clients » : sans le dossier de l'autre agent
        mockMvc.perform(withTenantHeaders(get("/api/v1/buyer-inbox?mine=true"), ORG1))
                .andExpect(jsonPath("$.items.length()").value(6))
                .andExpect(jsonPath("$.counts.FOLLOW_UP").value(2));
    }

    @Test
    void vide() throws Exception {
        mockMvc.perform(withTenantHeaders(get("/api/v1/buyer-inbox"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.counts.FOLLOW_UP").value(0));
    }
}
