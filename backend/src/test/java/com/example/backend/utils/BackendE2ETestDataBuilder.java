package com.example.backend.utils;

import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class BackendE2ETestDataBuilder {

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;
    private final MessageRepository messageRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsentementRepository consentementRepository;
    private final NotificationRepository notificationRepository;

    private String defaultOrgId = "test-org-" + UUID.randomUUID().toString();
    private final Random random = new Random();

    private final List<Long> createdAnnonceIds = new ArrayList<>();
    private final List<Long> createdDossierIds = new ArrayList<>();
    private final List<Long> createdPartiePrenanteIds = new ArrayList<>();
    private final List<Long> createdMessageIds = new ArrayList<>();
    private final List<Long> createdAppointmentIds = new ArrayList<>();
    private final List<Long> createdConsentementIds = new ArrayList<>();
    private final List<Long> createdNotificationIds = new ArrayList<>();

    public BackendE2ETestDataBuilder(
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            PartiePrenanteRepository partiePrenanteRepository,
            MessageRepository messageRepository,
            AppointmentRepository appointmentRepository,
            ConsentementRepository consentementRepository,
            NotificationRepository notificationRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
        this.messageRepository = messageRepository;
        this.appointmentRepository = appointmentRepository;
        this.consentementRepository = consentementRepository;
        this.notificationRepository = notificationRepository;
    }

    public BackendE2ETestDataBuilder withOrgId(String orgId) {
        this.defaultOrgId = orgId;
        return this;
    }

    public AnnonceBuilder annonceBuilder() {
        return new AnnonceBuilder();
    }

    public DossierBuilder dossierBuilder() {
        return new DossierBuilder();
    }

    public PartiePrenanteBuilder partiePrenanteBuilder() {
        return new PartiePrenanteBuilder();
    }

    public MessageBuilder messageBuilder() {
        return new MessageBuilder();
    }

    public AppointmentBuilder appointmentBuilder() {
        return new AppointmentBuilder();
    }

    public ConsentementBuilder consentementBuilder() {
        return new ConsentementBuilder();
    }

    public NotificationBuilder notificationBuilder() {
        return new NotificationBuilder();
    }

    public void deleteAllTestData() {
        notificationRepository.deleteAllById(createdNotificationIds);
        consentementRepository.deleteAllById(createdConsentementIds);
        appointmentRepository.deleteAllById(createdAppointmentIds);
        messageRepository.deleteAllById(createdMessageIds);
        partiePrenanteRepository.deleteAllById(createdPartiePrenanteIds);
        dossierRepository.deleteAllById(createdDossierIds);
        annonceRepository.deleteAllById(createdAnnonceIds);

        createdNotificationIds.clear();
        createdConsentementIds.clear();
        createdAppointmentIds.clear();
        createdMessageIds.clear();
        createdPartiePrenanteIds.clear();
        createdDossierIds.clear();
        createdAnnonceIds.clear();
    }

    private String randomString(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String randomPhone() {
        return "+33" + (600000000 + random.nextInt(100000000));
    }

    private String randomEmail() {
        return "test-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    private <T extends Enum<?>> T randomEnum(Class<T> enumClass) {
        T[] values = enumClass.getEnumConstants();
        return values[random.nextInt(values.length)];
    }

    public class AnnonceBuilder {
        private Annonce annonce = new Annonce();
        private boolean withPhotos = false;
        private boolean withRulesJson = false;

        public AnnonceBuilder() {
            annonce.setOrgId(defaultOrgId);
            annonce.setTitle(randomString("Property"));
            annonce.setDescription("Beautiful property with great features");
            annonce.setCategory("Apartment");
            annonce.setType(randomEnum(AnnonceType.class));
            annonce.setAddress(random.nextInt(100) + " Test Street");
            annonce.setSurface(50.0 + random.nextDouble() * 150.0);
            annonce.setCity("Paris");
            annonce.setPrice(new BigDecimal(100000 + random.nextInt(900000)));
            annonce.setCurrency("EUR");
            annonce.setStatus(AnnonceStatus.PUBLISHED);
            annonce.setCreatedBy("test-user");
            annonce.setUpdatedBy("test-user");
        }

        public AnnonceBuilder withOrgId(String orgId) {
            annonce.setOrgId(orgId);
            return this;
        }

        public AnnonceBuilder withTitle(String title) {
            annonce.setTitle(title);
            return this;
        }

        public AnnonceBuilder withDescription(String description) {
            annonce.setDescription(description);
            return this;
        }

        public AnnonceBuilder withCategory(String category) {
            annonce.setCategory(category);
            return this;
        }

        public AnnonceBuilder withType(AnnonceType type) {
            annonce.setType(type);
            return this;
        }

        public AnnonceBuilder withAddress(String address) {
            annonce.setAddress(address);
            return this;
        }

        public AnnonceBuilder withSurface(Double surface) {
            annonce.setSurface(surface);
            return this;
        }

        public AnnonceBuilder withCity(String city) {
            annonce.setCity(city);
            return this;
        }

        public AnnonceBuilder withPrice(BigDecimal price) {
            annonce.setPrice(price);
            return this;
        }

        public AnnonceBuilder withCurrency(String currency) {
            annonce.setCurrency(currency);
            return this;
        }

        public AnnonceBuilder withStatus(AnnonceStatus status) {
            annonce.setStatus(status);
            return this;
        }

        public AnnonceBuilder withPhotos() {
            this.withPhotos = true;
            return this;
        }

        public AnnonceBuilder withPhotos(List<String> photos) {
            annonce.setPhotos(photos);
            return this;
        }

        public AnnonceBuilder withRulesJson() {
            this.withRulesJson = true;
            return this;
        }

        public AnnonceBuilder withRulesJson(Map<String, Object> rulesJson) {
            annonce.setRulesJson(rulesJson);
            return this;
        }

        public AnnonceBuilder withMeta(Map<String, Object> meta) {
            annonce.setMeta(meta);
            return this;
        }

        public AnnonceBuilder withCreatedBy(String createdBy) {
            annonce.setCreatedBy(createdBy);
            return this;
        }

        public Annonce build() {
            if (withPhotos && annonce.getPhotos() == null) {
                annonce.setPhotos(Arrays.asList(
                    "https://example.com/photo1.jpg",
                    "https://example.com/photo2.jpg",
                    "https://example.com/photo3.jpg"
                ));
            }

            if (withRulesJson && annonce.getRulesJson() == null) {
                Map<String, Object> rules = new HashMap<>();
                rules.put("petsAllowed", true);
                rules.put("smokingAllowed", false);
                rules.put("maxOccupants", 4);
                rules.put("quietHours", Map.of("start", "22:00", "end", "07:00"));
                annonce.setRulesJson(rules);
            }

            return annonce;
        }

        public Annonce persist() {
            Annonce saved = annonceRepository.save(build());
            createdAnnonceIds.add(saved.getId());
            return saved;
        }
    }

    public class DossierBuilder {
        private Dossier dossier = new Dossier();
        private boolean withInitialParty = false;
        private PartiePrenanteRole initialPartyRole = PartiePrenanteRole.BUYER;

        public DossierBuilder() {
            dossier.setOrgId(defaultOrgId);
            dossier.setLeadPhone(randomPhone());
            dossier.setLeadName(randomString("Lead"));
            dossier.setLeadSource("web");
            dossier.setNotes("Test notes for dossier");
            dossier.setStatus(DossierStatus.NEW);
            dossier.setScore(random.nextInt(100));
            dossier.setSource(randomEnum(DossierSource.class));
            dossier.setCreatedBy("test-user");
            dossier.setUpdatedBy("test-user");
        }

        public DossierBuilder withOrgId(String orgId) {
            dossier.setOrgId(orgId);
            return this;
        }

        public DossierBuilder withAnnonceId(Long annonceId) {
            dossier.setAnnonceId(annonceId);
            return this;
        }

        public DossierBuilder withLeadPhone(String phone) {
            dossier.setLeadPhone(phone);
            return this;
        }

        public DossierBuilder withLeadName(String name) {
            dossier.setLeadName(name);
            return this;
        }

        public DossierBuilder withLeadSource(String source) {
            dossier.setLeadSource(source);
            return this;
        }

        public DossierBuilder withNotes(String notes) {
            dossier.setNotes(notes);
            return this;
        }

        public DossierBuilder withStatus(DossierStatus status) {
            dossier.setStatus(status);
            return this;
        }

        public DossierBuilder withScore(Integer score) {
            dossier.setScore(score);
            return this;
        }

        public DossierBuilder withSource(DossierSource source) {
            dossier.setSource(source);
            return this;
        }

        public DossierBuilder withInitialParty() {
            this.withInitialParty = true;
            return this;
        }

        public DossierBuilder withInitialParty(PartiePrenanteRole role) {
            this.withInitialParty = true;
            this.initialPartyRole = role;
            return this;
        }

        public Dossier build() {
            return dossier;
        }

        public Dossier persist() {
            Dossier saved = dossierRepository.save(build());
            createdDossierIds.add(saved.getId());

            if (withInitialParty) {
                PartiePrenanteEntity party = partiePrenanteBuilder()
                    .withDossier(saved)
                    .withRole(initialPartyRole)
                    .persist();
            }

            return saved;
        }
    }

    public class PartiePrenanteBuilder {
        private PartiePrenanteEntity partiePrenante = new PartiePrenanteEntity();
        private Dossier dossier;

        public PartiePrenanteBuilder() {
            partiePrenante.setOrgId(defaultOrgId);
            partiePrenante.setRole(randomEnum(PartiePrenanteRole.class));
            partiePrenante.setFirstName(randomString("FirstName"));
            partiePrenante.setLastName(randomString("LastName"));
            partiePrenante.setEmail(randomEmail());
            partiePrenante.setPhone(randomPhone());
            partiePrenante.setAddress(random.nextInt(100) + " Test Avenue");
        }

        public PartiePrenanteBuilder withOrgId(String orgId) {
            partiePrenante.setOrgId(orgId);
            return this;
        }

        public PartiePrenanteBuilder withDossier(Dossier dossier) {
            this.dossier = dossier;
            partiePrenante.setDossier(dossier);
            partiePrenante.setOrgId(dossier.getOrgId());
            return this;
        }

        public PartiePrenanteBuilder withRole(PartiePrenanteRole role) {
            partiePrenante.setRole(role);
            return this;
        }

        public PartiePrenanteBuilder withFirstName(String firstName) {
            partiePrenante.setFirstName(firstName);
            return this;
        }

        public PartiePrenanteBuilder withLastName(String lastName) {
            partiePrenante.setLastName(lastName);
            return this;
        }

        public PartiePrenanteBuilder withEmail(String email) {
            partiePrenante.setEmail(email);
            return this;
        }

        public PartiePrenanteBuilder withPhone(String phone) {
            partiePrenante.setPhone(phone);
            return this;
        }

        public PartiePrenanteBuilder withAddress(String address) {
            partiePrenante.setAddress(address);
            return this;
        }

        public PartiePrenanteBuilder withMeta(Map<String, Object> meta) {
            partiePrenante.setMeta(meta);
            return this;
        }

        public PartiePrenanteEntity build() {
            return partiePrenante;
        }

        public PartiePrenanteEntity persist() {
            if (partiePrenante.getDossier() == null) {
                throw new IllegalStateException("PartiePrenanteEntity must have a Dossier set before persisting");
            }
            PartiePrenanteEntity saved = partiePrenanteRepository.save(build());
            createdPartiePrenanteIds.add(saved.getId());
            return saved;
        }
    }

    public class MessageBuilder {
        private MessageEntity message = new MessageEntity();
        private Dossier dossier;

        public MessageBuilder() {
            message.setOrgId(defaultOrgId);
            message.setDirection(randomEnum(MessageDirection.class));
            message.setChannel(randomEnum(MessageChannel.class));
            message.setContent("Test message content - " + UUID.randomUUID().toString());
            message.setTimestamp(LocalDateTime.now().minusHours(random.nextInt(24)));
            message.setProviderMessageId("msg-" + UUID.randomUUID().toString());
        }

        public MessageBuilder withOrgId(String orgId) {
            message.setOrgId(orgId);
            return this;
        }

        public MessageBuilder withDossier(Dossier dossier) {
            this.dossier = dossier;
            message.setDossier(dossier);
            message.setOrgId(dossier.getOrgId());
            return this;
        }

        public MessageBuilder withDirection(MessageDirection direction) {
            message.setDirection(direction);
            return this;
        }

        public MessageBuilder withChannel(MessageChannel channel) {
            message.setChannel(channel);
            return this;
        }

        public MessageBuilder withContent(String content) {
            message.setContent(content);
            return this;
        }

        public MessageBuilder withTimestamp(LocalDateTime timestamp) {
            message.setTimestamp(timestamp);
            return this;
        }

        public MessageBuilder withProviderMessageId(String providerId) {
            message.setProviderMessageId(providerId);
            return this;
        }

        public MessageEntity build() {
            return message;
        }

        public MessageEntity persist() {
            if (message.getDossier() == null) {
                throw new IllegalStateException("MessageEntity must have a Dossier set before persisting");
            }
            MessageEntity saved = messageRepository.save(build());
            createdMessageIds.add(saved.getId());
            return saved;
        }
    }

    public class AppointmentBuilder {
        private AppointmentEntity appointment = new AppointmentEntity();
        private Dossier dossier;

        public AppointmentBuilder() {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startTime = now.plusDays(1 + random.nextInt(7)).withHour(9 + random.nextInt(8)).withMinute(0).withSecond(0);
            LocalDateTime endTime = startTime.plusHours(1);

            appointment.setOrgId(defaultOrgId);
            appointment.setStatus(AppointmentStatus.SCHEDULED);
            appointment.setStartTime(startTime);
            appointment.setEndTime(endTime);
            appointment.setLocation(random.nextInt(100) + " Meeting Street, Paris");
            appointment.setAssignedTo("agent-" + random.nextInt(10));
            appointment.setNotes("Appointment notes - " + UUID.randomUUID().toString().substring(0, 8));
            appointment.setCreatedBy("test-user");
            appointment.setUpdatedBy("test-user");
        }

        public AppointmentBuilder withOrgId(String orgId) {
            appointment.setOrgId(orgId);
            return this;
        }

        public AppointmentBuilder withDossier(Dossier dossier) {
            this.dossier = dossier;
            appointment.setDossier(dossier);
            appointment.setOrgId(dossier.getOrgId());
            return this;
        }

        public AppointmentBuilder withStatus(AppointmentStatus status) {
            appointment.setStatus(status);
            return this;
        }

        public AppointmentBuilder withStartTime(LocalDateTime startTime) {
            appointment.setStartTime(startTime);
            return this;
        }

        public AppointmentBuilder withEndTime(LocalDateTime endTime) {
            appointment.setEndTime(endTime);
            return this;
        }

        public AppointmentBuilder withTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
            appointment.setStartTime(startTime);
            appointment.setEndTime(endTime);
            return this;
        }

        public AppointmentBuilder withLocation(String location) {
            appointment.setLocation(location);
            return this;
        }

        public AppointmentBuilder withAssignedTo(String assignedTo) {
            appointment.setAssignedTo(assignedTo);
            return this;
        }

        public AppointmentBuilder withNotes(String notes) {
            appointment.setNotes(notes);
            return this;
        }

        public AppointmentBuilder withCreatedBy(String createdBy) {
            appointment.setCreatedBy(createdBy);
            return this;
        }

        public AppointmentEntity build() {
            return appointment;
        }

        public AppointmentEntity persist() {
            if (appointment.getDossier() == null) {
                throw new IllegalStateException("AppointmentEntity must have a Dossier set before persisting");
            }
            AppointmentEntity saved = appointmentRepository.save(build());
            createdAppointmentIds.add(saved.getId());
            return saved;
        }
    }

    public class ConsentementBuilder {
        private ConsentementEntity consentement = new ConsentementEntity();
        private Dossier dossier;

        public ConsentementBuilder() {
            consentement.setOrgId(defaultOrgId);
            consentement.setChannel(randomEnum(ConsentementChannel.class));
            consentement.setStatus(randomEnum(ConsentementStatus.class));
        }

        public ConsentementBuilder withOrgId(String orgId) {
            consentement.setOrgId(orgId);
            return this;
        }

        public ConsentementBuilder withDossier(Dossier dossier) {
            this.dossier = dossier;
            consentement.setDossier(dossier);
            consentement.setOrgId(dossier.getOrgId());
            return this;
        }

        public ConsentementBuilder withChannel(ConsentementChannel channel) {
            consentement.setChannel(channel);
            return this;
        }

        public ConsentementBuilder withStatus(ConsentementStatus status) {
            consentement.setStatus(status);
            return this;
        }

        public ConsentementBuilder withMeta(Map<String, Object> meta) {
            consentement.setMeta(meta);
            return this;
        }

        public ConsentementEntity build() {
            return consentement;
        }

        public ConsentementEntity persist() {
            if (consentement.getDossier() == null) {
                throw new IllegalStateException("ConsentementEntity must have a Dossier set before persisting");
            }
            ConsentementEntity saved = consentementRepository.save(build());
            createdConsentementIds.add(saved.getId());
            return saved;
        }
    }

    public class NotificationBuilder {
        private NotificationEntity notification = new NotificationEntity();
        private Dossier dossier;

        public NotificationBuilder() {
            notification.setOrgId(defaultOrgId);
            notification.setType(randomEnum(NotificationType.class));
            notification.setStatus(NotificationStatus.PENDING);
            notification.setTemplateId("template-" + random.nextInt(10));
            notification.setRecipient(randomEmail());
            notification.setSubject("Test Notification - " + UUID.randomUUID().toString().substring(0, 8));
            notification.setRetryCount(0);
            notification.setMaxRetries(3);

            Map<String, Object> variables = new HashMap<>();
            variables.put("name", randomString("User"));
            variables.put("date", LocalDateTime.now().toString());
            variables.put("action", "test_action");
            notification.setVariables(variables);
        }

        public NotificationBuilder withOrgId(String orgId) {
            notification.setOrgId(orgId);
            return this;
        }

        public NotificationBuilder withDossier(Dossier dossier) {
            this.dossier = dossier;
            notification.setDossierId(dossier.getId());
            notification.setOrgId(dossier.getOrgId());
            return this;
        }

        public NotificationBuilder withDossierId(Long dossierId) {
            notification.setDossierId(dossierId);
            return this;
        }

        public NotificationBuilder withType(NotificationType type) {
            notification.setType(type);
            return this;
        }

        public NotificationBuilder withStatus(NotificationStatus status) {
            notification.setStatus(status);
            return this;
        }

        public NotificationBuilder withTemplateId(String templateId) {
            notification.setTemplateId(templateId);
            return this;
        }

        public NotificationBuilder withVariables(Map<String, Object> variables) {
            notification.setVariables(variables);
            return this;
        }

        public NotificationBuilder withRecipient(String recipient) {
            notification.setRecipient(recipient);
            return this;
        }

        public NotificationBuilder withSubject(String subject) {
            notification.setSubject(subject);
            return this;
        }

        public NotificationBuilder withErrorMessage(String errorMessage) {
            notification.setErrorMessage(errorMessage);
            return this;
        }

        public NotificationBuilder withRetryCount(Integer retryCount) {
            notification.setRetryCount(retryCount);
            return this;
        }

        public NotificationBuilder withMaxRetries(Integer maxRetries) {
            notification.setMaxRetries(maxRetries);
            return this;
        }

        public NotificationBuilder withSentAt(LocalDateTime sentAt) {
            notification.setSentAt(sentAt);
            return this;
        }

        public NotificationEntity build() {
            return notification;
        }

        public NotificationEntity persist() {
            NotificationEntity saved = notificationRepository.save(build());
            createdNotificationIds.add(saved.getId());
            return saved;
        }
    }
}
