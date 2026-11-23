package com.example.backend.service;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.repository.DossierRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Membres d'une agence. Source : Keycloak (utilisateurs dont l'attribut {@code orgId} vaut
 * l'agence). Si Keycloak ne répond pas (poste de dev, tests), repli sur les utilisateurs déjà vus
 * dans les dossiers de l'agence (assignés ou créateurs).
 */
@Service
public class TeamDirectoryService {

    private static final Logger log = LoggerFactory.getLogger(TeamDirectoryService.class);

    /** Résultat avec sa source : la vérification d'appartenance n'est fiable qu'avec Keycloak. */
    public record Team(List<TeamMemberResponse> members, boolean authoritative) {
        public Optional<TeamMemberResponse> find(String userId) {
            return members.stream().filter(m -> m.userId().equals(userId)).findFirst();
        }
    }

    private final ObjectProvider<Keycloak> keycloak;
    private final DossierRepository dossierRepository;
    private final String realm;

    public TeamDirectoryService(
            ObjectProvider<Keycloak> keycloak,
            DossierRepository dossierRepository,
            @Value("${keycloak.admin.realm:${keycloak.realm:myrealm}}") String realm) {
        this.keycloak = keycloak;
        this.dossierRepository = dossierRepository;
        this.realm = realm;
    }

    @Transactional(readOnly = true)
    public Team team(String orgId) {
        try {
            Keycloak client = keycloak.getIfAvailable();
            if (client != null) {
                List<UserRepresentation> users =
                        client.realm(realm).users().searchByAttributes("orgId:" + orgId);
                List<TeamMemberResponse> members =
                        users.stream()
                                .filter(u -> !Boolean.FALSE.equals(u.isEnabled()))
                                .map(
                                        u ->
                                                new TeamMemberResponse(
                                                        u.getId(), displayName(u), u.getEmail()))
                                .sorted(Comparator.comparing(TeamMemberResponse::name))
                                .toList();
                return new Team(members, true);
            }
        } catch (Exception e) {
            log.warn("Keycloak unavailable for team of org {}: {}", orgId, e.getMessage());
        }
        return new Team(localMembers(orgId), false);
    }

    private List<TeamMemberResponse> localMembers(String orgId) {
        Map<String, TeamMemberResponse> byId = new LinkedHashMap<>();
        for (Object[] row : dossierRepository.findDistinctAssigneesByOrgId(orgId)) {
            String id = (String) row[0];
            String name = row[1] != null ? (String) row[1] : id;
            byId.putIfAbsent(id, new TeamMemberResponse(id, name, null));
        }
        for (String creator : dossierRepository.findDistinctCreatorsByOrgId(orgId)) {
            if (!creator.isBlank()
                    && !"system".equals(creator)
                    && !"anonymousUser".equals(creator)) {
                byId.putIfAbsent(creator, new TeamMemberResponse(creator, creator, null));
            }
        }
        List<TeamMemberResponse> list = new ArrayList<>(byId.values());
        list.sort(Comparator.comparing(TeamMemberResponse::name));
        return list;
    }

    static String displayName(UserRepresentation u) {
        String full =
                ((u.getFirstName() == null ? "" : u.getFirstName())
                                + " "
                                + (u.getLastName() == null ? "" : u.getLastName()))
                        .trim();
        if (!full.isEmpty()) {
            return full;
        }
        return u.getEmail() != null ? u.getEmail() : u.getUsername();
    }
}
