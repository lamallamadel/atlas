package com.example.backend.entity.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PartiePrenanteRoleTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("owner", PartiePrenanteRole.OWNER.getValue());
        assertEquals("buyer", PartiePrenanteRole.BUYER.getValue());
        assertEquals("seller", PartiePrenanteRole.SELLER.getValue());
        assertEquals("tenant", PartiePrenanteRole.TENANT.getValue());
        assertEquals("landlord", PartiePrenanteRole.LANDLORD.getValue());
        assertEquals("agent", PartiePrenanteRole.AGENT.getValue());
        assertEquals("notary", PartiePrenanteRole.NOTARY.getValue());
        assertEquals("bank", PartiePrenanteRole.BANK.getValue());
        assertEquals("attorney", PartiePrenanteRole.ATTORNEY.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(PartiePrenanteRole.OWNER, PartiePrenanteRole.fromValue("owner"));
        assertEquals(PartiePrenanteRole.BUYER, PartiePrenanteRole.fromValue("buyer"));
        assertEquals(PartiePrenanteRole.SELLER, PartiePrenanteRole.fromValue("seller"));
        assertEquals(PartiePrenanteRole.TENANT, PartiePrenanteRole.fromValue("tenant"));
        assertEquals(PartiePrenanteRole.LANDLORD, PartiePrenanteRole.fromValue("landlord"));
        assertEquals(PartiePrenanteRole.AGENT, PartiePrenanteRole.fromValue("agent"));
        assertEquals(PartiePrenanteRole.NOTARY, PartiePrenanteRole.fromValue("notary"));
        assertEquals(PartiePrenanteRole.BANK, PartiePrenanteRole.fromValue("bank"));
        assertEquals(PartiePrenanteRole.ATTORNEY, PartiePrenanteRole.fromValue("attorney"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> PartiePrenanteRole.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(PartiePrenanteRole.OWNER);
        assertEquals("\"OWNER\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        PartiePrenanteRole role = objectMapper.readValue("\"OWNER\"", PartiePrenanteRole.class);
        assertEquals(PartiePrenanteRole.OWNER, role);
    }
}
