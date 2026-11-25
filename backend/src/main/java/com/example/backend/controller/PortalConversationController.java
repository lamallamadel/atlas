package com.example.backend.controller;

import com.example.backend.owner.LeadConversationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

/**
 * Conversation du prospect avec un propriétaire (cas d'usage n°1, UC-P4), sans compte : le jeton
 * reçu dans l'alerte est passé dans l'en-tête {@code X-Conversation-Token} (pas dans l'URL de
 * l'API, pour qu'il n'apparaisse pas dans les journaux du serveur).
 */
@RestController
@RequestMapping("/api/v1/portal/conversation")
@Tag(name = "Portal conversation", description = "Échanges du prospect avec l'annonceur")
public class PortalConversationController {

    static final String TOKEN_HEADER = "X-Conversation-Token";

    private final LeadConversationService conversations;

    public PortalConversationController(LeadConversationService conversations) {
        this.conversations = conversations;
    }

    public record MessageBody(String body) {}

    @GetMapping
    public LeadConversationService.ProspectConversation view(
            @RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return conversations.prospectView(token);
    }

    @PostMapping("/messages")
    public LeadConversationService.ProspectConversation send(
            @RequestHeader(value = TOKEN_HEADER, required = false) String token,
            @RequestBody MessageBody body) {
        return conversations.prospectSend(token, body == null ? null : body.body());
    }

    @PostMapping("/visit-proposals/{proposalId}/accept")
    public LeadConversationService.ProspectConversation accept(
            @RequestHeader(value = TOKEN_HEADER, required = false) String token,
            @PathVariable Long proposalId) {
        return conversations.prospectAccept(token, proposalId);
    }
}
