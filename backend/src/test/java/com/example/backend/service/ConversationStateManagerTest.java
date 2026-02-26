package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.backend.entity.*;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConversationState;
import com.example.backend.repository.*;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConversationStateManagerTest {

    @Mock private ConversationStateRepository conversationStateRepository;
    @Mock private InboundMessageRepository inboundMessageRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private DossierRepository dossierRepository;
    @Mock private SmartSuggestionsService smartSuggestionsService;
    @Mock private ConversationResponseService conversationResponseService;

    @InjectMocks private ConversationStateManager conversationStateManager;

    private ConversationStateEntity mockConversation;
    private AppointmentEntity mockAppointment;
    private Dossier mockDossier;

    @BeforeEach
    void setUp() {
        mockConversation = new ConversationStateEntity();
        mockConversation.setId(1L);
        mockConversation.setOrgId("test-org");
        mockConversation.setPhoneNumber("+33612345678");
        mockConversation.setState(ConversationState.AWAITING_CONFIRMATION);
        mockConversation.setAppointmentId(100L);
        mockConversation.setDossierId(200L);
        mockConversation.setExpiresAt(LocalDateTime.now().plusHours(24));

        mockAppointment = new AppointmentEntity();
        mockAppointment.setId(100L);
        mockAppointment.setOrgId("test-org");
        mockAppointment.setStatus(AppointmentStatus.SCHEDULED);

        mockDossier = new Dossier();
        mockDossier.setId(200L);
        mockDossier.setOrgId("test-org");
    }

    @Test
    void testProcessInboundMessage_ConfirmationKeyword() {
        when(conversationStateRepository.findActiveConversation(anyString(), anyString(), any()))
                .thenReturn(Optional.of(mockConversation));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(mockAppointment));
        when(dossierRepository.findById(200L)).thenReturn(Optional.of(mockDossier));
        when(inboundMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(conversationStateRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(appointmentRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        conversationStateManager.processInboundMessage(
                "test-org", "+33612345678", "Oui", "msg-123");

        verify(conversationStateRepository)
                .save(argThat(conv -> conv.getState() == ConversationState.CONFIRMED));
        verify(appointmentRepository)
                .save(argThat(apt -> apt.getStatus() == AppointmentStatus.CONFIRMED));
        verify(conversationResponseService).sendConfirmationResponse(any());
    }

    @Test
    void testProcessInboundMessage_CancellationKeyword() {
        when(conversationStateRepository.findActiveConversation(anyString(), anyString(), any()))
                .thenReturn(Optional.of(mockConversation));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(mockAppointment));
        when(dossierRepository.findById(200L)).thenReturn(Optional.of(mockDossier));
        when(inboundMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(conversationStateRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(appointmentRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        conversationStateManager.processInboundMessage(
                "test-org", "+33612345678", "Annuler", "msg-124");

        verify(conversationStateRepository)
                .save(argThat(conv -> conv.getState() == ConversationState.CANCELLED));
        verify(appointmentRepository)
                .save(argThat(apt -> apt.getStatus() == AppointmentStatus.CANCELLED));
        verify(conversationResponseService).sendCancellationResponse(any());
    }

    @Test
    void testProcessInboundMessage_RescheduleKeyword() {
        when(conversationStateRepository.findActiveConversation(anyString(), anyString(), any()))
                .thenReturn(Optional.of(mockConversation));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(mockAppointment));
        when(dossierRepository.findById(200L)).thenReturn(Optional.of(mockDossier));
        when(inboundMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(conversationStateRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(appointmentRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        conversationStateManager.processInboundMessage(
                "test-org", "+33612345678", "Reporter", "msg-125");

        verify(conversationStateRepository)
                .save(argThat(conv -> conv.getState() == ConversationState.RESCHEDULED));
        verify(appointmentRepository)
                .save(argThat(apt -> apt.getStatus() == AppointmentStatus.RESCHEDULED));
        verify(conversationResponseService).sendRescheduleResponse(any());
    }

    @Test
    void testProcessInboundMessage_NoActiveConversation() {
        when(conversationStateRepository.findActiveConversation(anyString(), anyString(), any()))
                .thenReturn(Optional.empty());
        when(inboundMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        conversationStateManager.processInboundMessage(
                "test-org", "+33612345678", "Hello", "msg-126");

        verify(conversationStateRepository, never()).save(any());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void testInitializeConversation() {
        when(conversationStateRepository.findActiveConversation(anyString(), anyString(), any()))
                .thenReturn(Optional.empty());
        when(conversationStateRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(dossierRepository.findById(200L)).thenReturn(Optional.of(mockDossier));

        conversationStateManager.initializeConversation("test-org", "+33612345678", 100L, 200L);

        verify(conversationStateRepository)
                .save(
                        argThat(
                                conv ->
                                        conv.getState() == ConversationState.AWAITING_CONFIRMATION
                                                && conv.getAppointmentId().equals(100L)
                                                && conv.getDossierId().equals(200L)));
    }

    @Test
    void testExpireOldConversations() {
        when(conversationStateRepository.expireOldConversations(
                        eq(ConversationState.AWAITING_CONFIRMATION),
                        eq(ConversationState.EXPIRED),
                        any()))
                .thenReturn(5);

        conversationStateManager.expireOldConversations();

        verify(conversationStateRepository)
                .expireOldConversations(
                        eq(ConversationState.AWAITING_CONFIRMATION),
                        eq(ConversationState.EXPIRED),
                        any());
    }
}
