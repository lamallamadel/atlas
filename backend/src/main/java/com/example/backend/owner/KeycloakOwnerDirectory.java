package com.example.backend.owner;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Comptes propriétaires dans Keycloak : identifiant = téléphone, rôle {@code OWNER}, attribut
 * orgId.
 */
@Component
public class KeycloakOwnerDirectory implements OwnerDirectory {

    static final String OWNER_ROLE = "OWNER";
    private static final Logger log = LoggerFactory.getLogger(KeycloakOwnerDirectory.class);

    private final ObjectProvider<Keycloak> keycloak;
    private final String realm;

    public KeycloakOwnerDirectory(
            ObjectProvider<Keycloak> keycloak,
            @Value("${keycloak.admin.realm:${keycloak.realm:myrealm}}") String realm) {
        this.keycloak = keycloak;
        this.realm = realm;
    }

    @Override
    public String createOwner(OwnerAccount account) {
        Keycloak client = keycloak.getIfAvailable();
        if (client == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "DIRECTORY_UNAVAILABLE: annuaire indisponible.");
        }
        RealmResource realmResource = client.realm(realm);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(account.username());
        if (account.email() != null && !account.email().isBlank()) {
            user.setEmail(account.email());
            user.setEmailVerified(false);
        }
        user.setFirstName(account.firstName());
        user.setLastName(account.lastName());
        user.setEnabled(true);
        user.setAttributes(
                Map.of(
                        "orgId", List.of(account.orgId()),
                        "tenant_id", List.of(account.orgId()),
                        "phone", List.of(account.phone()),
                        "phone_verified", List.of("true")));
        CredentialRepresentation password = new CredentialRepresentation();
        password.setType(CredentialRepresentation.PASSWORD);
        password.setValue(account.password());
        password.setTemporary(false);
        user.setCredentials(List.of(password));

        String userId;
        try (Response response = realmResource.users().create(user)) {
            if (response.getStatus() == 409) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "ACCOUNT_EXISTS: un compte existe déjà pour ce numéro.");
            }
            if (response.getStatus() != 201) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY, "DIRECTORY_ERROR: création du compte impossible.");
            }
            String path = response.getLocation().getPath();
            userId = path.substring(path.lastIndexOf('/') + 1);
        }
        try {
            realmResource
                    .users()
                    .get(userId)
                    .roles()
                    .realmLevel()
                    .add(List.of(ownerRole(realmResource)));
        } catch (RuntimeException e) {
            log.error("Rôle OWNER non attribué à {}, compte supprimé", userId, e);
            try {
                realmResource.users().get(userId).remove();
            } catch (RuntimeException cleanup) {
                log.warn("Compte {} à moitié créé non supprimé", userId, cleanup);
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "DIRECTORY_ERROR: création du compte impossible.");
        }
        return userId;
    }

    private static RoleRepresentation ownerRole(RealmResource realm) {
        try {
            return realm.roles().get(OWNER_ROLE).toRepresentation();
        } catch (NotFoundException e) {
            RoleRepresentation created = new RoleRepresentation();
            created.setName(OWNER_ROLE);
            realm.roles().create(created);
            return realm.roles().get(OWNER_ROLE).toRepresentation();
        }
    }
}
