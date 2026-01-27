package com.example.backend.loadtest

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class SpikeLoadTest extends Simulation {

  val baseUrl = sys.props.getOrElse("base.url", "http://localhost:8080")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val listAnnonces = exec(
    http("List Annonces")
      .get("/api/v1/annonces?page=0&size=20")
      .check(status.is(200))
  )

  val listDossiers = exec(
    http("List Dossiers")
      .get("/api/v1/dossiers?page=0&size=20")
      .check(status.is(200))
  )

  val spikeScenario = scenario("Spike Test")
    .exec(listAnnonces)
    .pause(100.milliseconds)
    .exec(listDossiers)

  setUp(
    spikeScenario.inject(
      nothingFor(10.seconds),
      atOnceUsers(500),
      nothingFor(30.seconds),
      atOnceUsers(1000),
      nothingFor(30.seconds),
      atOnceUsers(1500)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(5000),
      global.successfulRequests.percent.gt(90.0)
    )
}
