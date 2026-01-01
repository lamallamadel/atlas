package com.example.backend.entity.enums;

public enum PartiePrenanteRole {
    OWNER("owner"),
    BUYER("buyer"),
    SELLER("seller"),
    TENANT("tenant"),
    LANDLORD("landlord"),
    AGENT("agent"),
    NOTARY("notary"),
    BANK("bank"),
    ATTORNEY("attorney");

    private final String value;

    PartiePrenanteRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PartiePrenanteRole fromValue(String value) {
        for (PartiePrenanteRole role : PartiePrenanteRole.values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown PartiePrenanteRole value: " + value);
    }
}
