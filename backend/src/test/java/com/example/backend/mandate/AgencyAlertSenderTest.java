package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.owner.PlatformAlert;
import com.example.backend.owner.PlatformAlertSender;
import com.example.backend.service.NotificationService;
import com.example.backend.service.TeamDirectoryService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** Destinataires et canaux des alertes aux agences (spec 13 § 13). */
class AgencyAlertSenderTest {

    private static TeamMemberResponse member(String id, String role, boolean enabled) {
        return new TeamMemberResponse(id, id, id + "@agence.ma", role, enabled);
    }

    @Test
    void adminsAndManagersFirst_otherwiseEveryActiveMember() {
        List<TeamMemberResponse> team =
                List.of(
                        member("a", "ADMIN", true),
                        member("m", "MANAGER", true),
                        member("g", "AGENT", true),
                        member("x", "MANAGER", false));
        assertThat(AgencyAlertSender.recipients(team))
                .extracting(TeamMemberResponse::userId)
                .containsExactly("a", "m");
        assertThat(
                        AgencyAlertSender.recipients(
                                List.of(member("g", "AGENT", true), member("h", null, true))))
                .extracting(TeamMemberResponse::userId)
                .containsExactly("g", "h");
        assertThat(AgencyAlertSender.recipients(List.of(member("x", "ADMIN", false)))).isEmpty();
    }

    @Test
    void notifiesInAppAndByEmail_withAnAbsoluteLink() {
        TeamDirectoryService team = mock(TeamDirectoryService.class);
        NotificationService notifications = mock(NotificationService.class);
        PlatformAlertSender mail = mock(PlatformAlertSender.class);
        AgencyAlertSender sender =
                new AgencyAlertSender(team, notifications, mail, "https://afroware.app");

        int sent =
                sender.send(
                        "ORG-A",
                        List.of(
                                member("a", "ADMIN", true),
                                new TeamMemberResponse("m", "M", null, "MANAGER", true)),
                        AgencyAlert.of(
                                "ORG-A",
                                "Un propriétaire vous invite",
                                "Texte",
                                "/pro/mandats/demandes/7"));

        assertThat(sent).isEqualTo(2);
        verify(notifications)
                .createInAppNotification(
                        "ORG-A",
                        null,
                        "a",
                        "Un propriétaire vous invite",
                        "Texte",
                        "/pro/mandats/demandes/7");
        verify(notifications)
                .createInAppNotification(eq("ORG-A"), any(), eq("m"), any(), any(), any());
        ArgumentCaptor<PlatformAlert> captor = ArgumentCaptor.forClass(PlatformAlert.class);
        verify(mail, times(1)).send(captor.capture());
        PlatformAlert email = captor.getValue();
        assertThat(email.audience()).isEqualTo(PlatformAlert.Audience.AGENCY);
        assertThat(email.email()).isEqualTo("a@agence.ma");
        assertThat(email.phone()).isNull();
        assertThat(email.linkUrl()).isEqualTo("https://afroware.app/pro/mandats/demandes/7");
    }

    @Test
    void oneFailingAgencyDoesNotStopTheOthers() {
        TeamDirectoryService team = mock(TeamDirectoryService.class);
        NotificationService notifications = mock(NotificationService.class);
        when(team.teams(List.of("ORG-A", "ORG-B")))
                .thenReturn(
                        java.util.Map.of(
                                "ORG-A",
                                new TeamDirectoryService.Team(
                                        List.of(member("a", "ADMIN", true)), true),
                                "ORG-B",
                                new TeamDirectoryService.Team(
                                        List.of(member("b", "ADMIN", true)), true)));
        when(notifications.createInAppNotification(
                        eq("ORG-A"), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalStateException("notification"));
        new AgencyAlertSender(team, notifications, mock(PlatformAlertSender.class), "")
                .onAlert(new AgencyAlert(List.of("ORG-A", "ORG-B"), "S", "M", "/pro/mandats"));
        verify(notifications)
                .createInAppNotification(eq("ORG-B"), any(), eq("b"), any(), any(), any());
    }
}
