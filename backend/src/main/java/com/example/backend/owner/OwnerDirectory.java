package com.example.backend.owner;

/** Annuaire des comptes propriétaires (Keycloak en production). */
public interface OwnerDirectory {

    /**
     * Crée le compte de rôle {@code OWNER} rattaché à son organisation personnelle ; renvoie
     * l'identifiant du compte. Lève 409 si l'identifiant de connexion existe déjà.
     */
    String createOwner(OwnerAccount account);

    record OwnerAccount(
            String username,
            String phone,
            String email,
            String firstName,
            String lastName,
            String password,
            String orgId) {}
}
