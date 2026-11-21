package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.PitchDraftResponse;
import com.example.backend.dto.PitchPhotoResponse;
import com.example.backend.dto.PitchSendRequest;
import com.example.backend.dto.PitchSendResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Proposition d'un bien à un acheteur correspondant : brouillon rédigé par l'IA (ou par un modèle
 * sans IA), relu et validé par l'agent, puis envoyé par WhatsApp ou SMS via la file des messages
 * sortants (consentement vérifié, nouvelles tentatives, historique).
 */
@Service
public class PropertyPitchService {

    private static final Logger log = LoggerFactory.getLogger(PropertyPitchService.class);

    static final Set<String> LANGUAGES = Set.of("fr", "ar", "en");
    static final Map<MessageChannel, Integer> MAX_LENGTH =
            Map.of(MessageChannel.WHATSAPP, 1000, MessageChannel.SMS, 640);

    static final String BLOCKER_NO_PHONE = "Le dossier n'a pas de numéro de téléphone.";
    static final String BLOCKER_DISMISSED =
            "Cet acheteur a été écarté pour ce bien : rétablissez-le avant de lui proposer.";
    static final String BLOCKER_WINDOW =
            "Le client n'a pas écrit sur WhatsApp depuis plus de 24 h : WhatsApp n'accepte alors que"
                    + " des modèles de message validés par Meta. Envoyez par SMS, ou attendez qu'il vous"
                    + " écrive.";

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final AnnonceDossierMatchRepository matchRepository;
    private final ConsentementRepository consentementRepository;
    private final OutboundMessageService outboundMessageService;
    private final WhatsAppSessionWindowService sessionWindowService;
    private final BrainClientService brainClientService;
    private final ActivityService activityService;
    private final AnnonceMediaRepository mediaRepository;

    public PropertyPitchService(
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            AnnonceDossierMatchRepository matchRepository,
            ConsentementRepository consentementRepository,
            OutboundMessageService outboundMessageService,
            WhatsAppSessionWindowService sessionWindowService,
            BrainClientService brainClientService,
            @Nullable ActivityService activityService,
            AnnonceMediaRepository mediaRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.matchRepository = matchRepository;
        this.consentementRepository = consentementRepository;
        this.outboundMessageService = outboundMessageService;
        this.sessionWindowService = sessionWindowService;
        this.brainClientService = brainClientService;
        this.activityService = activityService;
        this.mediaRepository = mediaRepository;
    }

    /** Brouillon à relire : rien n'est envoyé ni enregistré. */
    @Transactional(readOnly = true)
    public PitchDraftResponse draft(
            Long annonceId, Long matchId, String language, String channelName) {
        return draft(annonceId, matchId, language, channelName, PURPOSE_PITCH);
    }

    public static final String PURPOSE_PITCH = "PITCH";
    public static final String PURPOSE_FOLLOW_UP = "FOLLOW_UP";

    static boolean isFollowUp(String purpose) {
        return purpose != null && PURPOSE_FOLLOW_UP.equalsIgnoreCase(purpose.strip());
    }

    /**
     * @param purpose PITCH (proposition) ou FOLLOW_UP (relance : répond au dernier message du
     *     client ou relance un client silencieux, avec le créneau de visite proposé s'il y en a un)
     */
    @Transactional(readOnly = true)
    public PitchDraftResponse draft(
            Long annonceId, Long matchId, String language, String channelName, String purpose) {
        Context ctx = load(annonceId, matchId);
        String lang = normalizeLanguage(language);
        MessageChannel channel = parseChannel(channelName);
        boolean followUp = isFollowUp(purpose);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("bien", fiche(ctx.annonce()));
        body.put("prenom", firstName(ctx.dossier().getLeadName()));
        body.put(
                "raisons", ctx.match().getReasons() != null ? ctx.match().getReasons() : List.of());
        body.put("langue", lang);
        body.put("canal", channel == MessageChannel.SMS ? "sms" : "whatsapp");
        if (followUp) {
            AnnonceDossierMatch m = ctx.match();
            body.put("objet", "relance");
            boolean replied =
                    m.getReplyAt() != null
                            && (m.getPitchedAt() == null
                                    || !m.getReplyAt().isBefore(m.getPitchedAt()));
            if (replied && m.getReplyExcerpt() != null) {
                body.put("reponse_client", m.getReplyExcerpt());
                body.put("intention_client", m.getReplyIntent());
            }
            if (m.getProposedStart() != null
                    && m.getVisitAppointmentId() == null
                    && m.getProposedStart().isAfter(LocalDateTime.now())) {
                body.put("creneau", m.getProposedStart().toString());
            }
        }

        String message;
        String engine;
        String aiRejection = null;
        Optional<Map<String, Object>> generated = brainClientService.generatePitch(body);
        if (generated.isPresent() && generated.get().get("message") instanceof String m) {
            message = m;
            engine = String.valueOf(generated.get().getOrDefault("moteur", "modele"));
            Object rej = generated.get().get("rejet_ia");
            aiRejection = rej != null ? rej.toString() : null;
        } else {
            message =
                    followUp
                            ? fallbackFollowUp(ctx.annonce(), ctx.dossier().getLeadName(), lang)
                            : fallbackMessage(ctx.annonce(), ctx.dossier().getLeadName(), lang);
            engine = "modele";
        }

        Checks checks = checks(ctx, channel, followUp);
        return new PitchDraftResponse(
                message,
                engine,
                aiRejection,
                lang,
                channel.name(),
                ctx.dossier().getLeadPhone(),
                checks.consentStatus(),
                checks.windowOpen(),
                checks.blockers(),
                checks.warnings(),
                MAX_LENGTH.get(channel),
                ctx.match().getPitchedAt(),
                ctx.match().getPitchChannel(),
                channel == MessageChannel.WHATSAPP ? photos(ctx.annonce().getId()) : List.of());
    }

    /** Photos envoyables par WhatsApp, les présélectionnées en premier. */
    private List<PitchPhotoResponse> photos(Long annonceId) {
        List<AnnonceMedia> eligible = eligiblePhotos(annonceId);
        List<Long> suggested = PitchPhotoSelector.suggest(eligible);
        List<PitchPhotoResponse> out = new ArrayList<>();
        for (AnnonceMedia m : eligible) {
            out.add(
                    new PitchPhotoResponse(
                            m.getId(),
                            m.getSource(),
                            AnnonceMedia.SOURCE_URL.equals(m.getSource())
                                    ? m.getExternalUrl()
                                    : "/api/v1/annonces/"
                                            + annonceId
                                            + "/media/"
                                            + m.getId()
                                            + "/content",
                            PitchPhotoSelector.roomType(m),
                            PitchPhotoSelector.caption(m),
                            suggested.contains(m.getId())));
        }
        out.sort(
                java.util.Comparator.comparing((PitchPhotoResponse p) -> !p.suggested())
                        .thenComparing(p -> suggested.indexOf(p.mediaId())));
        return out;
    }

    private List<AnnonceMedia> eligiblePhotos(Long annonceId) {
        return mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId).stream()
                .filter(m -> PitchPhotoSelector.ineligibility(m) == null)
                .toList();
    }

    /** Envoi du message validé par l'agent. */
    @Transactional
    public PitchSendResponse send(Long annonceId, Long matchId, PitchSendRequest request) {
        Context ctx = load(annonceId, matchId);
        MessageChannel channel = parseChannel(request.channel());
        String message = request.message() == null ? "" : request.message().strip();
        if (message.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message est vide.");
        }
        if (message.length() > MAX_LENGTH.get(channel)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message trop long pour "
                            + label(channel)
                            + " ("
                            + MAX_LENGTH.get(channel)
                            + " caractères maximum).");
        }
        List<Long> mediaIds =
                request.mediaIds() == null
                        ? List.of()
                        : request.mediaIds().stream()
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .toList();
        if (!mediaIds.isEmpty() && channel != MessageChannel.WHATSAPP) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Les photos ne peuvent être envoyées que par WhatsApp.");
        }
        if (mediaIds.size() > PitchPhotoSelector.MAX_PHOTOS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    PitchPhotoSelector.MAX_PHOTOS + " photos au plus par proposition.");
        }
        Set<Long> eligibleIds =
                mediaIds.isEmpty()
                        ? Set.of()
                        : eligiblePhotos(ctx.annonce().getId()).stream()
                                .map(AnnonceMedia::getId)
                                .collect(java.util.stream.Collectors.toSet());
        for (Long id : mediaIds) {
            if (!eligibleIds.contains(id)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La photo " + id + " ne peut pas être envoyée par WhatsApp.");
            }
        }

        Checks checks = checks(ctx, channel);
        // Le consentement est vérifié par la file des messages sortants (422 si absent).
        List<String> blocking =
                checks.blockers().stream().filter(b -> !b.startsWith(CONSENT_PREFIX)).toList();
        if (!blocking.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, blocking.get(0));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("body", message);
        payload.put("kind", "PROPERTY_PITCH");
        payload.put("annonceId", ctx.annonce().getId());
        payload.put("matchId", ctx.match().getId());
        if (request.language() != null) {
            payload.put("language", normalizeLanguage(request.language()));
        }
        OutboundMessageEntity outbound =
                outboundMessageService.createOutboundMessage(
                        ctx.dossier().getId(),
                        channel,
                        ctx.dossier().getLeadPhone(),
                        null,
                        "Proposition : " + safeTitle(ctx.annonce()),
                        payload,
                        idempotencyKey(ctx.match().getId(), channel, message),
                        ConsentementType.MARKETING);

        // Photos : un message WhatsApp par photo, créés après le texte (envoyés dans cet ordre).
        // Si une photo échoue, le texte est parti quand même.
        int photosQueued = 0;
        for (Long mediaId : mediaIds) {
            Map<String, Object> photo = new LinkedHashMap<>();
            photo.put("type", "image");
            photo.put("kind", "PROPERTY_PITCH_PHOTO");
            photo.put("annonceId", ctx.annonce().getId());
            photo.put("mediaId", mediaId);
            photo.put("matchId", ctx.match().getId());
            outboundMessageService.createOutboundMessage(
                    ctx.dossier().getId(),
                    channel,
                    ctx.dossier().getLeadPhone(),
                    null,
                    "Photo : " + safeTitle(ctx.annonce()),
                    photo,
                    idempotencyKey(ctx.match().getId(), channel, message) + "-photo-" + mediaId,
                    ConsentementType.MARKETING);
            photosQueued++;
        }

        LocalDateTime now = LocalDateTime.now();
        AnnonceDossierMatch m = ctx.match();
        m.setPitchedAt(now);
        m.setPitchChannel(channel.name());
        m.setPitchMessageId(outbound.getId());
        m.closeFollowUp(now);
        if (AnnonceDossierMatch.STATUS_NEW.equals(m.getStatus())) {
            m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
        }
        matchRepository.save(m);

        if (activityService != null) {
            try {
                Map<String, Object> meta = new LinkedHashMap<>();
                meta.put("annonceId", ctx.annonce().getId());
                meta.put("matchId", m.getId());
                meta.put("outboundMessageId", outbound.getId());
                meta.put("channel", channel.name());
                meta.put("score", m.getScore());
                meta.put("photos", mediaIds);
                activityService.logActivity(
                        ctx.dossier().getId(),
                        ActivityType.MESSAGE_SENT,
                        (isFollowUp(request.purpose())
                                        ? "Relance envoyée par "
                                        : "Bien proposé par ")
                                + label(channel)
                                + " : "
                                + safeTitle(ctx.annonce())
                                + " (correspondance "
                                + m.getScore()
                                + "/100"
                                + (photosQueued > 0 ? ", " + photosQueued + " photo(s)" : "")
                                + ")",
                        meta);
            } catch (Exception e) {
                log.warn("Activité de proposition non enregistrée : {}", e.getMessage());
            }
        }
        return new PitchSendResponse(
                outbound.getId(),
                outbound.getStatus() != null ? outbound.getStatus().name() : null,
                channel.name(),
                now,
                photosQueued);
    }

    // ---------- vérifications ----------

    static final String CONSENT_PREFIX = "Consentement : ";

    record Checks(
            String consentStatus,
            Boolean windowOpen,
            List<String> blockers,
            List<String> warnings) {}

    private Checks checks(Context ctx, MessageChannel channel) {
        return checks(ctx, channel, false);
    }

    private Checks checks(Context ctx, MessageChannel channel, boolean followUp) {
        List<String> blockers = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Dossier d = ctx.dossier();
        String phone = d.getLeadPhone();
        if (phone == null || phone.isBlank()) {
            blockers.add(BLOCKER_NO_PHONE);
        }
        if (AnnonceDossierMatch.STATUS_DISMISSED.equals(ctx.match().getStatus())) {
            blockers.add(BLOCKER_DISMISSED);
        }

        String consent = consentStatus(d.getId(), channel);
        if ("UNCONFIRMED".equals(consent)) {
            blockers.add(
                    CONSENT_PREFIX
                            + "l'accord du client a été noté par un agent, mais les propositions par "
                            + label(channel)
                            + " exigent qu'il le confirme lui-même. Envoyez-lui le lien de"
                            + " confirmation depuis l'onglet Consentements du dossier.");
        } else if (!"GRANTED".equals(consent)) {
            blockers.add(
                    CONSENT_PREFIX
                            + "le client n'a pas donné son accord pour recevoir des propositions par "
                            + label(channel)
                            + " ("
                            + consentLabel(consent)
                            + "). Envoyez-lui le lien de confirmation depuis l'onglet Consentements"
                            + " du dossier.");
        }

        Boolean windowOpen = null;
        if (channel == MessageChannel.WHATSAPP && phone != null && !phone.isBlank()) {
            windowOpen = sessionWindowService.isWithinSessionWindow(d.getOrgId(), phone);
            if (!windowOpen) {
                blockers.add(BLOCKER_WINDOW);
            }
        }

        if (d.getStatus() == DossierStatus.WON || d.getStatus() == DossierStatus.LOST) {
            warnings.add("Ce dossier est clôturé (" + d.getStatus().name() + ").");
        }
        if (ctx.match().getPitchedAt() != null && !followUp) {
            warnings.add(
                    "Ce bien a déjà été proposé le "
                            + ctx.match()
                                    .getPitchedAt()
                                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"))
                            + " par "
                            + label(parseChannelOrNull(ctx.match().getPitchChannel()))
                            + ".");
        }
        return new Checks(consent, windowOpen, blockers, warnings);
    }

    private String consentStatus(Long dossierId, MessageChannel channel) {
        ConsentementChannel cc =
                channel == MessageChannel.SMS
                        ? ConsentementChannel.SMS
                        : ConsentementChannel.WHATSAPP;
        List<ConsentementEntity> consents =
                consentementRepository.findByDossierIdAndChannelAndConsentTypeOrderByUpdatedAtDesc(
                        dossierId, cc, ConsentementType.MARKETING);
        if (consents.isEmpty()) {
            return "MISSING";
        }
        ConsentementEntity latest = consents.get(0);
        if (latest.getStatus() == ConsentementStatus.GRANTED
                && latest.getExpiresAt() != null
                && latest.getExpiresAt().isBefore(LocalDateTime.now())) {
            return "EXPIRED";
        }
        if (latest.getStatus() == ConsentementStatus.GRANTED && !clientConfirmed(latest)) {
            return "UNCONFIRMED";
        }
        return latest.getStatus() != null ? latest.getStatus().name() : "MISSING";
    }

    /** Preuve du double opt-in exigée pour la prospection (voir OutboundMessageService). */
    static boolean clientConfirmed(ConsentementEntity consent) {
        Map<String, Object> meta = consent.getMeta();
        if (meta == null) {
            return false;
        }
        Object confirmed = meta.get("doubleOptInConfirmed");
        return meta.get("optInTimestamp") != null
                && meta.get("ipAddress") != null
                && (Boolean.TRUE.equals(confirmed)
                        || "true".equalsIgnoreCase(String.valueOf(confirmed)));
    }

    private static String consentLabel(String status) {
        return switch (status) {
            case "DENIED" -> "refusé";
            case "REVOKED" -> "retiré";
            case "EXPIRED" -> "expiré";
            case "PENDING" -> "en attente";
            default -> "aucun accord enregistré";
        };
    }

    // ---------- chargement ----------

    record Context(Annonce annonce, AnnonceDossierMatch match, Dossier dossier) {}

    private Context load(Long annonceId, Long matchId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Annonce annonce =
                annonceRepository
                        .findById(annonceId)
                        .filter(a -> orgId.equals(a.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + annonceId));
        AnnonceDossierMatch match =
                matchRepository
                        .findById(matchId)
                        .filter(x -> x.getAnnonceId().equals(annonceId))
                        .filter(x -> orgId.equals(x.getOrgId()))
                        .orElseThrow(
                                () -> new EntityNotFoundException("Match not found: " + matchId));
        Dossier dossier =
                dossierRepository
                        .findById(match.getDossierId())
                        .filter(d -> orgId.equals(d.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: "
                                                        + match.getDossierId()));
        return new Context(annonce, match, dossier);
    }

    // ---------- contenu ----------

    /** Faits du bien transmis à l'IA : jamais de coordonnées ni d'adresse précise. */
    static Map<String, Object> fiche(Annonce a) {
        Map<String, Object> bien = DossierMatchingService.toBien(a);
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("titre", a.getTitle());
        f.put("categorie", a.getCategory());
        f.put("type", a.getType() != null ? a.getType().name() : null);
        f.put("ville", a.getCity());
        f.put("prix", a.getPrice() != null ? a.getPrice().doubleValue() : null);
        f.put("devise", a.getCurrency() != null ? a.getCurrency() : "MAD");
        f.put("surface", a.getSurface());
        String desc = a.getDescription();
        f.put("description", desc != null && desc.length() > 4000 ? desc.substring(0, 4000) : desc);
        f.put("meuble", bien.get("vision_meuble"));
        f.put("etat", bien.get("vision_etat"));
        f.put("equipements", bien.getOrDefault("vision_equipements", List.of()));
        f.put("vues", bien.getOrDefault("vision_vues", List.of()));
        f.put("pieces", bien.getOrDefault("vision_pieces", List.of()));
        return f;
    }

    static String firstName(String leadName) {
        if (leadName == null || leadName.isBlank()) {
            return null;
        }
        String first = leadName.strip().split("\\s+")[0];
        return first.length() > 80 ? first.substring(0, 80) : first;
    }

    /** Relance minimale quand le brain est injoignable. */
    static String fallbackFollowUp(Annonce a, String leadName, String lang) {
        String name = firstName(leadName);
        String city = a.getCity();
        return switch (lang) {
            case "en" ->
                    (name != null ? "Hello " + name + "," : "Hello,")
                            + "\nFollowing up about the property"
                            + (city != null ? " in " + city : "")
                            + ".\nWould you like more photos or to arrange a viewing?";
            case "ar" ->
                    (name != null ? "السلام " + name + "،" : "السلام،")
                            + "\nكنرجع ليك على العقار"
                            + (city != null ? " ف" + city : "")
                            + ".\nبغيتي تصاور كثر ولا نديرو زيارة؟";
            default ->
                    (name != null ? "Bonjour " + name + "," : "Bonjour,")
                            + "\nJe reviens vers vous au sujet du bien"
                            + (city != null ? " à " + city : "")
                            + ".\nSouhaitez-vous plus de photos ou organiser une visite ?";
        };
    }

    /** Modèle minimal quand le brain est injoignable. */
    static String fallbackMessage(Annonce a, String leadName, String lang) {
        String name = firstName(leadName);
        String price =
                a.getPrice() != null
                        ? String.format(Locale.FRANCE, "%,.0f", a.getPrice().doubleValue())
                                        .replace(' ', ' ')
                                        .replace(' ', ' ')
                                + " "
                                + (a.getCurrency() != null ? a.getCurrency() : "MAD")
                        : null;
        String surface = a.getSurface() != null ? String.format("%.0f m²", a.getSurface()) : null;
        String details =
                String.join(
                        " · ",
                        java.util.stream.Stream.of(surface, price).filter(s -> s != null).toList());
        String city = a.getCity();
        return switch (lang) {
            case "en" ->
                    (name != null ? "Hello " + name + "," : "Hello,")
                            + "\nA new property"
                            + (city != null ? " in " + city : "")
                            + " matching your search has just come in."
                            + (details.isEmpty() ? "" : "\n" + details)
                            + "\nWould you like more photos or a viewing?";
            case "ar" ->
                    (name != null ? "السلام " + name + "،" : "السلام،")
                            + "\nعندنا عقار جديد"
                            + (city != null ? " ف" + city : "")
                            + " كيناسب داكشي اللي كتقلب عليه."
                            + (details.isEmpty() ? "" : "\n" + details)
                            + "\nبغيتي نصيفط ليك تصاور كثر ولا نديرو زيارة؟";
            default ->
                    (name != null ? "Bonjour " + name + "," : "Bonjour,")
                            + "\nUn bien"
                            + (city != null ? " à " + city : "")
                            + " vient d'entrer chez nous et correspond à votre recherche."
                            + (details.isEmpty() ? "" : "\n" + details)
                            + "\nSouhaitez-vous plus de photos ou une visite ?";
        };
    }

    // ---------- utilitaires ----------

    static String normalizeLanguage(String language) {
        String l = language == null ? "fr" : language.strip().toLowerCase(Locale.ROOT);
        return LANGUAGES.contains(l) ? l : "fr";
    }

    static MessageChannel parseChannel(String name) {
        MessageChannel c = parseChannelOrNull(name);
        if (c == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Canal non pris en charge : utilisez WHATSAPP ou SMS.");
        }
        return c;
    }

    private static MessageChannel parseChannelOrNull(String name) {
        if (name == null) {
            return null;
        }
        return switch (name.strip().toUpperCase(Locale.ROOT)) {
            case "WHATSAPP" -> MessageChannel.WHATSAPP;
            case "SMS" -> MessageChannel.SMS;
            default -> null;
        };
    }

    private static String label(MessageChannel c) {
        if (c == null) {
            return "message";
        }
        return c == MessageChannel.SMS ? "SMS" : "WhatsApp";
    }

    private static String safeTitle(Annonce a) {
        return a.getTitle() != null ? a.getTitle() : "annonce #" + a.getId();
    }

    /** Même message envoyé deux fois (double clic) : un seul envoi. */
    static String idempotencyKey(Long matchId, MessageChannel channel, String message) {
        try {
            byte[] h =
                    MessageDigest.getInstance("SHA-256")
                            .digest(message.getBytes(StandardCharsets.UTF_8));
            return "pitch-"
                    + matchId
                    + "-"
                    + channel.name()
                    + "-"
                    + HexFormat.of().formatHex(h).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
