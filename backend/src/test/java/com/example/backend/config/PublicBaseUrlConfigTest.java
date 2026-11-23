package com.example.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

/** Les liens envoyés aux clients ne doivent jamais pointer vers localhost en production. */
class PublicBaseUrlConfigTest {

    private static Object property(String file, String key) throws Exception {
        List<PropertySource<?>> sources =
                new YamlPropertySourceLoader().load(file, new ClassPathResource(file));
        return sources.get(0).getProperty(key);
    }

    @Test
    void production_pointe_vers_l_adresse_publique() throws Exception {
        assertThat(property("application-prod.yml", "atlas.consent.public-base-url"))
                .hasToString("${PUBLIC_BASE_URL:https://afroware.app}");
        assertThat(property("application-prod.yml", "customer-portal.base-url"))
                .hasToString("${PUBLIC_BASE_URL:https://afroware.app}");
    }

    @Test
    void par_defaut_le_poste_de_developpement() throws Exception {
        assertThat(property("application.yml", "atlas.consent.public-base-url"))
                .hasToString("${PUBLIC_BASE_URL:http://localhost:4200}");
    }
}
