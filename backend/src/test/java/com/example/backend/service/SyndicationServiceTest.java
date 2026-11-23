package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SyndicationServiceTest {

    @Mock private AnnonceRepository annonceRepository;

    @InjectMocks private SyndicationService syndicationService;

    private Annonce activeAnnonce;

    @BeforeEach
    void setUp() {
        activeAnnonce = new Annonce();
        activeAnnonce.setId(1L);
        activeAnnonce.setTitle("Test Title & Co");
        activeAnnonce.setDescription("A beautiful <house>");
        activeAnnonce.setPrice(new BigDecimal("100000"));
        activeAnnonce.setCity("Casablanca");
        activeAnnonce.setAddress("Street 1");
        activeAnnonce.setPhotos(Arrays.asList("url1.jpg", "url2.jpg"));
        activeAnnonce.setStatus(AnnonceStatus.PUBLISHED);
    }

    @Test
    void testGenerateMubawabFeed() {
        when(annonceRepository.findByStatusAndOrgId(AnnonceStatus.PUBLISHED, "org1"))
                .thenReturn(Arrays.asList(activeAnnonce));

        String xml = syndicationService.generateMubawabFeed("org1");

        assertThat(xml).contains("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        assertThat(xml).contains("<properties>");
        assertThat(xml).contains("<reference>1</reference>");
        assertThat(xml).contains("<title>Test Title &amp; Co</title>"); // check escaping
        assertThat(xml)
                .contains("<description><![CDATA[A beautiful <house>]]></description>"); // check
        // CDATA
        assertThat(xml).contains("<price>100000</price>");
        assertThat(xml).contains("<city>Casablanca</city>");
        assertThat(xml).contains("<picture>url1.jpg</picture>");
        assertThat(xml).contains("</properties>");
    }

    @Test
    void testGenerateAvitoFeed() {
        when(annonceRepository.findByStatusAndOrgId(AnnonceStatus.PUBLISHED, "org1"))
                .thenReturn(Arrays.asList(activeAnnonce));

        String xml = syndicationService.generateAvitoFeed("org1");

        assertThat(xml).contains("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        assertThat(xml).contains("<adverts>");
        assertThat(xml).contains("<id>1</id>");
        assertThat(xml).contains("<subject>Test Title &amp; Co</subject>");
        assertThat(xml).contains("<body><![CDATA[A beautiful <house>]]></body>");
        assertThat(xml).contains("<price>100000</price>");
        assertThat(xml).contains("<location>Casablanca</location>");
        assertThat(xml).contains("<image><url>url1.jpg</url></image>");
        assertThat(xml).contains("</adverts>");
    }

    @Test
    void testGenerateFeeds_EmptyList() {
        when(annonceRepository.findByStatusAndOrgId(AnnonceStatus.PUBLISHED, "org1"))
                .thenReturn(Collections.emptyList());

        String mubawabXml = syndicationService.generateMubawabFeed("org1");
        assertThat(mubawabXml).contains("<properties>\n</properties>");

        String avitoXml = syndicationService.generateAvitoFeed("org1");
        assertThat(avitoXml).contains("<adverts>\n</adverts>");
    }
}
