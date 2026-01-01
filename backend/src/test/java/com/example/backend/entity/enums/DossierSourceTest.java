package com.example.backend.entity.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DossierSourceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("web", DossierSource.WEB.getValue());
        assertEquals("mobile", DossierSource.MOBILE.getValue());
        assertEquals("phone", DossierSource.PHONE.getValue());
        assertEquals("email", DossierSource.EMAIL.getValue());
        assertEquals("referral", DossierSource.REFERRAL.getValue());
        assertEquals("walk_in", DossierSource.WALK_IN.getValue());
        assertEquals("social_media", DossierSource.SOCIAL_MEDIA.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(DossierSource.WEB, DossierSource.fromValue("web"));
        assertEquals(DossierSource.MOBILE, DossierSource.fromValue("mobile"));
        assertEquals(DossierSource.PHONE, DossierSource.fromValue("phone"));
        assertEquals(DossierSource.EMAIL, DossierSource.fromValue("email"));
        assertEquals(DossierSource.REFERRAL, DossierSource.fromValue("referral"));
        assertEquals(DossierSource.WALK_IN, DossierSource.fromValue("walk_in"));
        assertEquals(DossierSource.SOCIAL_MEDIA, DossierSource.fromValue("social_media"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> DossierSource.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(DossierSource.WEB);
        assertEquals("\"WEB\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        DossierSource source = objectMapper.readValue("\"WEB\"", DossierSource.class);
        assertEquals(DossierSource.WEB, source);
    }
}
