package com.example.backend.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class AnnonceTypeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("sale", AnnonceType.SALE.getValue());
        assertEquals("rent", AnnonceType.RENT.getValue());
        assertEquals("lease", AnnonceType.LEASE.getValue());
        assertEquals("exchange", AnnonceType.EXCHANGE.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(AnnonceType.SALE, AnnonceType.fromValue("sale"));
        assertEquals(AnnonceType.RENT, AnnonceType.fromValue("rent"));
        assertEquals(AnnonceType.LEASE, AnnonceType.fromValue("lease"));
        assertEquals(AnnonceType.EXCHANGE, AnnonceType.fromValue("exchange"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> AnnonceType.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(AnnonceType.SALE);
        assertEquals("\"SALE\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        AnnonceType type = objectMapper.readValue("\"SALE\"", AnnonceType.class);
        assertEquals(AnnonceType.SALE, type);
    }
}
