package com.example.backend.loader;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

/**
 * Données de démonstration métier ({@code db/demo/demo-seed.sql}) : 10 agences avec leurs équipes,
 * 10 propriétaires, 20 biens et tout le cycle de la bourse aux mandats. Chargées une seule fois au
 * démarrage en profil {@code dev}, après {@link SeedDataLoader} (qui ne remplit qu'une base sans
 * annonce) ; désactivables avec {@code atlas.demo.seed-enabled=false}.
 *
 * <p>Les comptes démo se connectent avec des jetons {@code mock-demo-…} (page de connexion), donc
 * en mode mock uniquement.
 */
@Component
@Profile("dev")
@ConditionalOnProperty(
        name = "atlas.demo.seed-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class DemoSeedLoader {

    private static final Logger log = LoggerFactory.getLogger(DemoSeedLoader.class);
    static final String SCRIPT = "db/demo/demo-seed.sql";
    static final String MARKER_ORG = "DEMO-DETROIT";

    /** Les littéraux JSON du script sont suivis de ce marqueur (sans effet sous PostgreSQL). */
    static final String JSON_MARKER = "/*json*/";

    private final DataSource dataSource;

    public DemoSeedLoader(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        try (Connection c = dataSource.getConnection()) {
            if (alreadyLoaded(c)) {
                log.info("Données de démonstration déjà présentes ({}).", MARKER_ORG);
                return;
            }
            boolean autoCommit = c.getAutoCommit();
            c.setAutoCommit(false);
            try {
                execute(c);
                c.commit();
                log.info(
                        "Données de démonstration chargées : 10 agences, 10 propriétaires, 20"
                                + " biens. Comptes : page de connexion, « Comptes démo ».");
            } catch (RuntimeException | SQLException | IOException e) {
                c.rollback();
                log.error("Données de démonstration non chargées : {}", e.getMessage(), e);
            } finally {
                c.setAutoCommit(autoCommit);
            }
        } catch (SQLException e) {
            log.error("Données de démonstration non chargées : {}", e.getMessage(), e);
        }
    }

    public static boolean alreadyLoaded(Connection c) throws SQLException {
        try (PreparedStatement ps =
                c.prepareStatement("SELECT COUNT(*) FROM organization WHERE org_id = ?")) {
            ps.setString(1, MARKER_ORG);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getLong(1) > 0;
            }
        }
    }

    /** Exécute le script sur la connexion donnée, sans valider : l'appelant gère la transaction. */
    public static void execute(Connection c) throws SQLException, IOException {
        String sql;
        try (InputStream in = new ClassPathResource(SCRIPT).getInputStream()) {
            sql = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        boolean h2 = c.getMetaData().getDatabaseProductName().toLowerCase().contains("h2");
        sql = forDatabase(sql, h2);
        ScriptUtils.executeSqlScript(
                c,
                new EncodedResource(
                        new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)),
                        StandardCharsets.UTF_8));
    }

    /** H2 lit un littéral comme une chaîne JSON sans {@code FORMAT JSON} ; PostgreSQL convertit. */
    static String forDatabase(String sql, boolean h2) {
        return sql.replace(JSON_MARKER, h2 ? "FORMAT JSON" : "");
    }
}
