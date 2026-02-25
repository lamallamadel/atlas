package com.example.backend.loadtest;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

/**
 * Gatling load test to validate rate limiting behavior under load.
 *
 * <p>This test simulates multiple organizations making concurrent requests to validate that rate
 * limits are properly enforced across instances.
 *
 * <p>Run with: mvn gatling:test
 * -Dgatling.simulationClass=com.example.backend.loadtest.RateLimitLoadTest
 */
public class RateLimitLoadTest extends Simulation {

    private static final String BASE_URL = System.getProperty("baseUrl", "http://localhost:8080");
    private static final String AUTH_TOKEN = System.getProperty("authToken", "mock-token-test");

    HttpProtocolBuilder httpProtocol =
            http.baseUrl(BASE_URL)
                    .acceptHeader("application/json")
                    .header("Authorization", "Bearer " + AUTH_TOKEN)
                    .contentTypeHeader("application/json");

    // Scenario 1: Standard tier organization (100 req/min)
    ScenarioBuilder standardTierScenario =
            scenario("Standard Tier Organization")
                    .exec(
                            http("Standard Tier Request")
                                    .get("/api/v1/annonces")
                                    .header("X-Org-Id", "standard-org")
                                    .check(status().in(200, 429)));

    // Scenario 2: Premium tier organization (1000 req/min)
    ScenarioBuilder premiumTierScenario =
            scenario("Premium Tier Organization")
                    .exec(
                            http("Premium Tier Request")
                                    .get("/api/v1/annonces")
                                    .header("X-Org-Id", "premium-org")
                                    .check(status().in(200, 429)));

    // Scenario 3: IP-based rate limiting (60 req/min per IP)
    ScenarioBuilder ipBasedScenario =
            scenario("IP-Based Rate Limiting")
                    .exec(
                            http("Webhook Request")
                                    .post("/api/v1/webhooks/test")
                                    .body(StringBody("{\"test\": \"data\"}"))
                                    .asJson()
                                    .check(status().in(200, 404, 429)));

    // Scenario 4: Rate limit recovery
    ScenarioBuilder recoveryScenario =
            scenario("Rate Limit Recovery")
                    .exec(
                            http("Initial Request")
                                    .get("/api/v1/annonces")
                                    .header("X-Org-Id", "recovery-test-org")
                                    .check(status().is(200)))
                    .pause(Duration.ofSeconds(65))
                    .exec(
                            http("Request After Recovery")
                                    .get("/api/v1/annonces")
                                    .header("X-Org-Id", "recovery-test-org")
                                    .check(status().is(200)));

    {
        setUp(
                        // Standard tier: 120 requests over 60 seconds (should get ~20 rejections)
                        standardTierScenario.injectOpen(
                                constantUsersPerSec(2).during(Duration.ofSeconds(60))),

                        // Premium tier: 1200 requests over 60 seconds (should get ~200 rejections)
                        premiumTierScenario.injectOpen(
                                constantUsersPerSec(20).during(Duration.ofSeconds(60))),

                        // IP-based: 80 requests over 60 seconds (should get ~20 rejections)
                        ipBasedScenario.injectOpen(
                                constantUsersPerSec(1.33).during(Duration.ofSeconds(60))),

                        // Recovery: Test that limits reset after 60 seconds
                        recoveryScenario.injectOpen(atOnceUsers(1)))
                .protocols(httpProtocol)
                .assertions(
                        // Standard tier assertions
                        details("Standard Tier Organization").requestsPerSec().lte(2.0),
                        details("Standard Tier Organization")
                                .successfulRequests()
                                .percent()
                                .gte(80.0),

                        // Premium tier assertions
                        details("Premium Tier Organization").requestsPerSec().lte(20.0),
                        details("Premium Tier Organization")
                                .successfulRequests()
                                .percent()
                                .gte(80.0),

                        // IP-based assertions
                        details("IP-Based Rate Limiting").requestsPerSec().lte(1.5),
                        details("IP-Based Rate Limiting").successfulRequests().percent().gte(70.0),

                        // Recovery assertions
                        details("Rate Limit Recovery").successfulRequests().percent().is(100.0),

                        // Global assertions
                        global().responseTime().max().lte(1000),
                        global().responseTime().percentile3().lte(200));
    }
}
