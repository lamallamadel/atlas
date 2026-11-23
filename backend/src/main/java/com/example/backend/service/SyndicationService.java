package com.example.backend.service;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SyndicationService {

    private final AnnonceRepository annonceRepository;

    public SyndicationService(AnnonceRepository annonceRepository) {
        this.annonceRepository = annonceRepository;
    }

    @Transactional(readOnly = true)
    public String generateMubawabFeed(String orgId) {
        List<Annonce> activeAnnonces =
                annonceRepository.findByStatusAndOrgId(AnnonceStatus.PUBLISHED, orgId);

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<properties>\n");

        for (Annonce a : activeAnnonces) {
            xml.append("  <property>\n");
            xml.append("    <reference>")
                    .append(escapeXml(a.getId().toString()))
                    .append("</reference>\n");
            xml.append("    <title>").append(escapeXml(a.getTitle())).append("</title>\n");
            xml.append("    <description><![CDATA[")
                    .append(a.getDescription() != null ? a.getDescription() : "")
                    .append("]]></description>\n");
            xml.append("    <price>")
                    .append(a.getPrice() != null ? a.getPrice().toString() : "0")
                    .append("</price>\n");
            xml.append("    <currency>")
                    .append(escapeXml(a.getCurrency() != null ? a.getCurrency() : "MAD"))
                    .append("</currency>\n");
            xml.append("    <city>").append(escapeXml(a.getCity())).append("</city>\n");
            xml.append("    <address>").append(escapeXml(a.getAddress())).append("</address>\n");
            xml.append("    <category>").append(escapeXml(a.getCategory())).append("</category>\n");
            xml.append("    <type>")
                    .append(a.getType() != null ? escapeXml(a.getType().name()) : "")
                    .append("</type>\n");
            xml.append("    <surface>")
                    .append(a.getSurface() != null ? a.getSurface() : 0)
                    .append("</surface>\n");

            if (a.getPhotos() != null && !a.getPhotos().isEmpty()) {
                xml.append("    <pictures>\n");
                for (String photo : a.getPhotos()) {
                    xml.append("      <picture>").append(escapeXml(photo)).append("</picture>\n");
                }
                xml.append("    </pictures>\n");
            }
            xml.append("  </property>\n");
        }

        xml.append("</properties>");
        return xml.toString();
    }

    @Transactional(readOnly = true)
    public String generateAvitoFeed(String orgId) {
        // Avito format could be slightly different, but we'll use a standard XML approach here.
        // Similar to Mubawab but tailored to Avito's specific tags if needed.
        List<Annonce> activeAnnonces =
                annonceRepository.findByStatusAndOrgId(AnnonceStatus.PUBLISHED, orgId);

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<adverts>\n");

        for (Annonce a : activeAnnonces) {
            xml.append("  <advert>\n");
            xml.append("    <id>").append(escapeXml(a.getId().toString())).append("</id>\n");
            xml.append("    <subject>").append(escapeXml(a.getTitle())).append("</subject>\n");
            xml.append("    <body><![CDATA[")
                    .append(a.getDescription() != null ? a.getDescription() : "")
                    .append("]]></body>\n");
            xml.append("    <price>")
                    .append(a.getPrice() != null ? a.getPrice().toString() : "0")
                    .append("</price>\n");
            xml.append("    <location>").append(escapeXml(a.getCity())).append("</location>\n");

            if (a.getPhotos() != null && !a.getPhotos().isEmpty()) {
                xml.append("    <images>\n");
                for (String photo : a.getPhotos()) {
                    xml.append("      <image><url>")
                            .append(escapeXml(photo))
                            .append("</url></image>\n");
                }
                xml.append("    </images>\n");
            }
            xml.append("  </advert>\n");
        }

        xml.append("</adverts>");
        return xml.toString();
    }

    private String escapeXml(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
