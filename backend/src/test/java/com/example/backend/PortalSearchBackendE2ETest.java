package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.loader.DemoSeedLoader;
import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;

/**
 * Recherche du portail : tous les critères s'appliquent en base, avant la pagination, si bien que
 * le total annoncé et les pages correspondent toujours à la recherche. Données : seed de démo,
 * chargé dans la transaction du test.
 */
@BackendE2ETest
class PortalSearchBackendE2ETest extends BaseBackendE2ETest {

    @Autowired private DataSource dataSource;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void seed() throws Exception {
        Connection c = DataSourceUtils.getConnection(dataSource);
        if (!DemoSeedLoader.alreadyLoaded(c)) {
            DemoSeedLoader.execute(c);
        }
    }

    private JsonNode search(String query) throws Exception {
        String body =
                mockMvc.perform(get("/api/v1/portal/annonces?" + query))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(body);
    }

    /** Toutes les pages d'une recherche, page de 2 pour traverser la pagination. */
    private List<JsonNode> allPages(String query) throws Exception {
        List<JsonNode> items = new ArrayList<>();
        JsonNode first = search(query + "&size=2&page=0");
        int pages = first.get("totalPages").asInt();
        first.get("content").forEach(items::add);
        for (int p = 1; p < pages; p++) {
            search(query + "&size=2&page=" + p).get("content").forEach(items::add);
        }
        assertThat(items).hasSize(first.get("totalElements").asInt());
        return items;
    }

    @Test
    void priceAndSurfaceFilters_applyBeforePagination() throws Exception {
        List<JsonNode> items = allPages("city=Tanger&priceMax=2000000&surfaceMin=40");
        assertThat(items).isNotEmpty();
        for (JsonNode a : items) {
            assertThat(a.get("city").asText()).isEqualTo("Tanger");
            assertThat(a.get("price").asDouble()).isLessThanOrEqualTo(2_000_000);
            assertThat(a.get("surface").asDouble()).isGreaterThanOrEqualTo(40);
        }
        long expected =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM annonce a WHERE a.status = 'PUBLISHED' AND a.city ="
                                + " 'Tanger' AND a.price <= 2000000 AND a.surface >= 40 AND"
                                + " (a.property_id IS NULL OR a.id = (SELECT MIN(o.id) FROM"
                                + " annonce o WHERE o.property_id = a.property_id AND o.status ="
                                + " 'PUBLISHED'))",
                        Long.class);
        assertThat(items).hasSize((int) expected);
    }

    @Test
    void categoryDistrictAndRooms() throws Exception {
        for (JsonNode a : allPages("category=villa")) {
            assertThat(a.get("category").asText()).isEqualTo("Villa");
        }
        List<JsonNode> malabata = allPages("city=Tanger&district=Malabata");
        assertThat(malabata)
                .extracting(a -> a.get("title").asText())
                .contains("Appartement 3 pièces vue mer");
        List<JsonNode> threeRooms = allPages("rooms=3");
        assertThat(threeRooms).isNotEmpty();
        assertThat(threeRooms).allSatisfy(a -> assertThat(a.get("rooms").asInt()).isEqualTo(3));
        assertThat(allPages("rooms=4"))
                .allSatisfy(a -> assertThat(a.get("rooms").asInt()).isGreaterThanOrEqualTo(4));
    }

    @Test
    void cardsNameTheAgency_andLeaveUnknownRoomsEmpty() throws Exception {
        List<JsonNode> items = allPages("city=Tanger");
        JsonNode agency =
                items.stream()
                        .filter(a -> a.get("title").asText().equals("Appartement 3 pièces vue mer"))
                        .findFirst()
                        .orElseThrow();
        assertThat(agency.get("publisherKind").asText()).isEqualTo("AGENCY");
        assertThat(agency.get("agencyName").asText()).isEqualTo("Agence du Détroit");
        JsonNode owner =
                items.stream()
                        .filter(a -> a.get("publisherKind").asText().equals("OWNER"))
                        .findFirst()
                        .orElseThrow();
        assertThat(owner.get("agencyName").isNull()).isTrue();
        assertThat(items)
                .allSatisfy(
                        a ->
                                assertThat(a.get("rooms").isNull() || a.get("rooms").asInt() > 0)
                                        .isTrue());
    }

    @Test
    void sortByPrice_andUnknownSortFallsBack() throws Exception {
        List<JsonNode> asc = allPages("city=Casablanca&sort=price,asc");
        for (int i = 1; i < asc.size(); i++) {
            assertThat(asc.get(i).get("price").asDouble())
                    .isGreaterThanOrEqualTo(asc.get(i - 1).get("price").asDouble());
        }
        search("sort=ownerPhone,asc");
    }

    @Test
    void facets_listOnlyWhatIsPublished() throws Exception {
        String body =
                mockMvc.perform(get("/api/v1/portal/facets?city=Tanger"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        JsonNode facets = objectMapper.readTree(body);
        List<String> cities = new ArrayList<>();
        facets.get("cities").forEach(c -> cities.add(c.asText()));
        List<String> districts = new ArrayList<>();
        facets.get("districts").forEach(d -> districts.add(d.asText()));
        List<String> categories = new ArrayList<>();
        facets.get("categories").forEach(c -> categories.add(c.asText()));
        assertThat(cities).contains("Tanger", "Casablanca", "Rabat", "Marrakech");
        assertThat(districts).contains("Malabata");
        assertThat(categories).contains("Appartement");
    }
}
