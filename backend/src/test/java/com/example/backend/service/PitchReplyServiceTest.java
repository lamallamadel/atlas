package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.brain.BrainClientService;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;

class PitchReplyServiceTest {

    private AnnonceDossierMatchRepository matchRepository;
    private AppointmentRepository appointmentRepository;
    private BrainClientService brain;
    private NotificationService notifications;
    private PitchReplyService service;
    private AnnonceDossierMatch match;

    // jeudi 19 novembre 2026
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 19, 20, 0);

    @BeforeEach
    void setUp() {
        matchRepository = mock(AnnonceDossierMatchRepository.class);
        AnnonceRepository annonceRepository = mock(AnnonceRepository.class);
        DossierRepository dossierRepository = mock(DossierRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        brain = mock(BrainClientService.class);
        notifications = mock(NotificationService.class);
        service =
                new PitchReplyService(
                        matchRepository,
                        annonceRepository,
                        dossierRepository,
                        appointmentRepository,
                        brain,
                        notifications,
                        mock(AppointmentService.class),
                        45,
                        mock(PlatformTransactionManager.class));

        Annonce a = new Annonce();
        a.setId(1L);
        a.setOrgId("ORG");
        a.setTitle("Villa Achakar");
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(a));
        Dossier d = new Dossier();
        d.setId(10L);
        d.setOrgId("ORG");
        d.setLeadName("Youssef");
        d.setCreatedBy("agent-1");
        when(dossierRepository.findById(10L)).thenReturn(Optional.of(d));

        match = new AnnonceDossierMatch();
        match.setId(5L);
        match.setOrgId("ORG");
        match.setAnnonceId(1L);
        match.setDossierId(10L);
        match.setPitchedAt(LocalDateTime.now().minusHours(3));
        when(matchRepository.findFirstByOrgIdAndDossierIdAndPitchedAtIsNotNullOrderByPitchedAtDesc(
                        "ORG", 10L))
                .thenReturn(Optional.of(match));
        when(appointmentRepository.findOverlappingAppointments(
                        anyString(), any(), any(), anyLong()))
                .thenReturn(List.of());
    }

    private static LocalDateTime[] w(LocalDateTime a, LocalDateTime b) {
        return new LocalDateTime[] {a, b};
    }

    @Test
    void arrondi_a_la_demi_heure() {
        assertThat(PitchReplyService.roundUp(LocalDateTime.of(2026, 1, 1, 10, 0)))
                .isEqualTo(LocalDateTime.of(2026, 1, 1, 10, 0));
        assertThat(PitchReplyService.roundUp(LocalDateTime.of(2026, 1, 1, 10, 10)))
                .isEqualTo(LocalDateTime.of(2026, 1, 1, 10, 30));
        assertThat(PitchReplyService.roundUp(LocalDateTime.of(2026, 1, 1, 10, 30)))
                .isEqualTo(LocalDateTime.of(2026, 1, 1, 10, 30));
        assertThat(PitchReplyService.roundUp(LocalDateTime.of(2026, 1, 1, 10, 31)))
                .isEqualTo(LocalDateTime.of(2026, 1, 1, 11, 0));
    }

    @Test
    void creneau_dans_la_disponibilite_du_client_en_evitant_l_agenda() {
        LocalDateTime sat9 = LocalDateTime.of(2026, 11, 21, 9, 0);
        AppointmentEntity busy = new AppointmentEntity();
        busy.setStatus(AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findOverlappingAppointments(
                        eq("agent-1"), eq(sat9), any(), anyLong()))
                .thenReturn(List.of(busy));
        AppointmentEntity cancelled = new AppointmentEntity();
        cancelled.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findOverlappingAppointments(
                        eq("agent-1"), eq(sat9.plusMinutes(30)), any(), anyLong()))
                .thenReturn(List.of(cancelled));

        Optional<LocalDateTime[]> slot =
                service.findSlot(
                        java.util.Collections.singletonList(w(sat9, sat9.withHour(12))),
                        "agent-1",
                        NOW,
                        45);

        assertThat(slot).isPresent();
        assertThat(slot.get()[0])
                .isEqualTo(sat9.plusMinutes(30)); // 9 h occupé, 9 h 30 annulé = libre
        assertThat(slot.get()[1]).isEqualTo(sat9.plusMinutes(75));
    }

    @Test
    void creneau_trop_proche_decale_et_fenetre_trop_courte_ignoree() {
        // demande « ce soir 21h » reçue à 20 h : 21 h 45 dépasse 19 h, donc rien ce jour-là
        LocalDateTime tonight = NOW.withHour(21);
        assertThat(
                        service.findSlot(
                                java.util.Collections.singletonList(
                                        w(tonight, tonight.plusHours(1))),
                                "agent-1",
                                NOW,
                                45))
                .isEmpty();
        // demain 9 h–10 h, mais il est 8 h 10 : au plus tôt 10 h 30, hors fenêtre
        LocalDateTime morning = LocalDateTime.of(2026, 11, 20, 8, 10);
        LocalDateTime w9 = LocalDateTime.of(2026, 11, 20, 9, 0);
        assertThat(
                        service.findSlot(
                                java.util.Collections.singletonList(w(w9, w9.plusHours(1))),
                                "agent-1",
                                morning,
                                45))
                .isEmpty();
    }

    @Test
    void sans_disponibilite_prochain_jour_ouvre() {
        // samedi 21 novembre 18 h 30 : rien samedi, pas le dimanche, lundi 9 h
        LocalDateTime sat = LocalDateTime.of(2026, 11, 21, 18, 30);
        Optional<LocalDateTime[]> slot = service.findSlot(List.of(), "agent-1", sat, 45);
        assertThat(slot.get()[0]).isEqualTo(LocalDateTime.of(2026, 11, 23, 9, 0));
    }

    @Test
    void disponibilites_illisibles_ignorees() {
        List<LocalDateTime[]> out =
                PitchReplyService.windows(
                        List.of(
                                Map.of(
                                        "debut",
                                        "2026-11-21T10:00:00",
                                        "fin",
                                        "2026-11-21T11:00:00"),
                                Map.of("debut", "n'importe quoi", "fin", "2026-11-21T11:00:00"),
                                Map.of(
                                        "debut",
                                        "2026-11-21T12:00:00",
                                        "fin",
                                        "2026-11-21T11:00:00")));
        assertThat(out).hasSize(1);
    }

    @Test
    void demande_de_visite_creneau_et_notification() {
        LocalDateTime start =
                LocalDateTime.now()
                        .plusDays(2)
                        .withHour(10)
                        .withMinute(0)
                        .withSecond(0)
                        .withNano(0);
        when(brain.analyseReply(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "intention",
                                        "VISITE",
                                        "disponibilites",
                                        List.of(
                                                Map.of(
                                                        "debut", start.toString(),
                                                        "fin", start.plusHours(1).toString())))));

        Optional<AnnonceDossierMatch> out =
                service.onInboundMessage(
                        "ORG", 10L, 99L, "On peut visiter samedi 10h ?", LocalDateTime.now());

        assertThat(out).isPresent();
        assertThat(match.getReplyIntent()).isEqualTo("VISITE");
        assertThat(match.getReplyMessageId()).isEqualTo(99L);
        assertThat(match.getProposedStart()).isEqualTo(start);
        assertThat(match.getProposedEnd()).isEqualTo(start.plusMinutes(45));
        verify(notifications)
                .createInAppNotification(
                        eq("ORG"),
                        eq(10L),
                        eq("agent-1"),
                        eq("Youssef veut visiter — Villa Achakar"),
                        contains("Créneau libre proposé"),
                        eq("/annonces/1"));
    }

    @Test
    void merci_apres_une_demande_ne_l_efface_pas() {
        match.setReplyIntent("VISITE");
        match.setReplyExcerpt("samedi 10h");
        when(brain.analyseReply(any())).thenReturn(Optional.of(Map.of("intention", "AUTRE")));

        service.onInboundMessage("ORG", 10L, 100L, "Merci", LocalDateTime.now());

        assertThat(match.getReplyIntent()).isEqualTo("VISITE");
        assertThat(match.getReplyExcerpt()).isEqualTo("samedi 10h");
        verify(matchRepository, never()).save(any());
        verifyNoInteractions(notifications);
    }

    @Test
    void message_sans_proposition_recente_ignore() {
        match.setPitchedAt(LocalDateTime.now().minusDays(20));
        assertThat(service.onInboundMessage("ORG", 10L, 1L, "oui", LocalDateTime.now())).isEmpty();
        match.setPitchedAt(
                LocalDateTime.now().plusMinutes(5)); // proposition postérieure au message
        assertThat(service.onInboundMessage("ORG", 10L, 1L, "oui", LocalDateTime.now())).isEmpty();
        verifyNoInteractions(brain);
    }

    @Test
    void brain_indisponible_rien_ne_change() {
        when(brain.analyseReply(any())).thenReturn(Optional.empty());
        assertThat(service.onInboundMessage("ORG", 10L, 1L, "oui", LocalDateTime.now())).isEmpty();
        assertThat(match.getReplyIntent()).isNull();
    }

    @Test
    void intention_inconnue_devient_autre() {
        when(brain.analyseReply(any())).thenReturn(Optional.of(Map.of("intention", "PIRATE")));
        service.onInboundMessage("ORG", 10L, 1L, "???", LocalDateTime.now());
        assertThat(match.getReplyIntent()).isEqualTo("AUTRE");
        assertThat(match.getProposedStart()).isNull();
    }
}
