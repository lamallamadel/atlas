package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainVisionClient;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

/** Photos d'annonce et analyse visuelle : import, lecture, analyse (brain simulé), description. */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AnnonceMediaBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";
    private static final String ORG2 = "ORG2";
    private static final byte[] JPEG = {
        (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3
    };

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private AnnonceMediaRepository mediaRepository;

    @MockitoBean private BrainVisionClient visionClient;

    private Long annonceId;

    @BeforeEach
    void setUp() {
        mediaRepository.deleteAll();
        annonceRepository.deleteAll();
        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Appartement avec piscine");
        a.setDescription("Ancienne description");
        a.setCategory("Appartement");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        a.setCity("Tanger");
        a.setSurface(85.0);
        a.setPhotos(List.of("https://cdn.exemple.ma/salon.jpg", "http://ancien.exemple.ma/x.jpg"));
        annonceId = annonceRepository.save(a).getId();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
    }

    private String base() {
        return "/api/v1/annonces/" + annonceId;
    }

    /** Les requêtes multipart ne passent pas par withTenantHeaders (autre type de builder). */
    private org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder
            upload(String org, MockMultipartFile file) {
        var builder = multipart(base() + "/media").file(file);
        builder.header(TENANT_HEADER, org)
                .header(CORRELATION_ID_HEADER, "media-test")
                .with(jwtWithRoles(org, e2eJwtRoles()));
        return builder;
    }

    private Long uploadJpeg() throws Exception {
        MvcResult res =
                mockMvc.perform(
                                upload(
                                        ORG1,
                                        new MockMultipartFile(
                                                "files", "cuisine.jpg", "image/jpeg", JPEG)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$", hasSize(1)))
                        .andExpect(jsonPath("$[0].source").value("UPLOAD"))
                        .andExpect(jsonPath("$[0].analysisStatus").value("PENDING"))
                        .andReturn();
        return objectMapper
                .readTree(res.getResponse().getContentAsString())
                .get(0)
                .get("id")
                .asLong();
    }

    @Test
    void import_lecture_et_suppression_d_une_photo() throws Exception {
        Long mediaId = uploadJpeg();

        mockMvc.perform(withTenantHeaders(get(base() + "/media/" + mediaId + "/content"), ORG1))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(JPEG));

        mockMvc.perform(withTenantHeaders(get(base() + "/media"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].url").value(base() + "/media/" + mediaId + "/content"));

        mockMvc.perform(withTenantHeaders(delete(base() + "/media/" + mediaId), ORG1))
                .andExpect(status().isNoContent());
        assertThat(mediaRepository.count()).isZero();
    }

    @Test
    void faux_fichier_image_refuse() throws Exception {
        mockMvc.perform(
                        upload(
                                ORG1,
                                new MockMultipartFile(
                                        "files", "x.jpg", "image/jpeg", "<html>".getBytes())))
                .andExpect(status().isBadRequest());
        assertThat(mediaRepository.count()).isZero();
    }

    @Test
    void autre_organisation_ne_voit_rien() throws Exception {
        Long mediaId = uploadJpeg();
        mockMvc.perform(withTenantHeaders(get(base() + "/media"), ORG2))
                .andExpect(status().isNotFound());
        mockMvc.perform(withTenantHeaders(get(base() + "/media/" + mediaId + "/content"), ORG2))
                .andExpect(status().isNotFound());
        mockMvc.perform(withTenantHeaders(post(base() + "/vision/analyze"), ORG2))
                .andExpect(status().isNotFound());
        mockMvc.perform(withTenantHeaders(delete(base() + "/media/" + mediaId), ORG2))
                .andExpect(status().isNotFound());
        assertThat(mediaRepository.count()).isEqualTo(1);
    }

    @Test
    void analyse_complete_puis_application_de_la_description() throws Exception {
        uploadJpeg();
        when(visionClient.analyzePhoto(any(), any(), any(), anyMap()))
                .thenReturn(
                        new BrainVisionClient.Result(
                                BrainVisionClient.Outcome.OK,
                                Map.of(
                                        "analysis",
                                        Map.of("is_property_photo", true, "room_type", "cuisine"),
                                        "engine",
                                        "openai"),
                                null));
        when(visionClient.buildProfile(anyList(), anyMap(), anyList()))
                .thenReturn(
                        new BrainVisionClient.Result(
                                BrainVisionClient.Outcome.OK,
                                Map.of(
                                        "profile", Map.of("photos_du_bien", 2),
                                        "inconsistencies",
                                                List.of(
                                                        "La description mentionne une piscine, non visible sur les photos."),
                                        "descriptions",
                                                Map.of("fr", "Appartement lumineux à Tanger."),
                                        "description_engine", "openai"),
                                null));

        // En test, @Async est désactivé : l'analyse s'exécute pendant la requête
        mockMvc.perform(withTenantHeaders(post(base() + "/vision/analyze"), ORG1))
                .andExpect(status().isAccepted());

        mockMvc.perform(withTenantHeaders(get(base() + "/vision"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                // photo importée + lien https importé depuis l'ancien champ photos ; lien http
                // refusé
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.done").value(2))
                .andExpect(jsonPath("$.rejected").value(1))
                .andExpect(
                        jsonPath("$.result.descriptions.fr")
                                .value("Appartement lumineux à Tanger."))
                .andExpect(
                        jsonPath("$.result.inconsistencies[0]")
                                .value(org.hamcrest.Matchers.containsString("piscine")));

        verify(visionClient).analyzePhoto(isNull(), any(), eq("image/jpeg"), anyMap());
        verify(visionClient)
                .analyzePhoto(eq("https://cdn.exemple.ma/salon.jpg"), isNull(), any(), anyMap());

        // Relancer sans nouveauté ne refait pas l'analyse
        mockMvc.perform(withTenantHeaders(post(base() + "/vision/analyze"), ORG1))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("DONE"));
        verify(visionClient, org.mockito.Mockito.times(1))
                .buildProfile(anyList(), anyMap(), anyList());

        mockMvc.perform(
                        withTenantHeaders(post(base() + "/vision/apply-description"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"description\":\"  Texte validé par l'agent.  \"}"))
                .andExpect(status().isNoContent());
        assertThat(annonceRepository.findById(annonceId).orElseThrow().getDescription())
                .isEqualTo("Texte validé par l'agent.");
    }

    @Test
    void brain_indisponible_les_photos_restent_reessayables() throws Exception {
        uploadJpeg();
        when(visionClient.analyzePhoto(any(), any(), any(), anyMap()))
                .thenReturn(
                        new BrainVisionClient.Result(
                                BrainVisionClient.Outcome.UNAVAILABLE,
                                null,
                                "Aucun moteur de vision activé"));

        mockMvc.perform(withTenantHeaders(post(base() + "/vision/analyze"), ORG1))
                .andExpect(status().isAccepted());
        mockMvc.perform(withTenantHeaders(get(base() + "/vision"), ORG1))
                .andExpect(jsonPath("$.failed").value(2))
                .andExpect(jsonPath("$.result").doesNotExist())
                .andExpect(
                        jsonPath("$.media[0].analysisError")
                                .value("Aucun moteur de vision activé"));
    }

    @Test
    void analyse_sans_photo_refusee() throws Exception {
        Annonce a = annonceRepository.findById(annonceId).orElseThrow();
        a.setPhotos(List.of());
        annonceRepository.save(a);
        mockMvc.perform(withTenantHeaders(post(base() + "/vision/analyze"), ORG1))
                .andExpect(status().isBadRequest());
    }

    @Test
    void description_vide_refusee() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/vision/apply-description"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"description\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }
}
