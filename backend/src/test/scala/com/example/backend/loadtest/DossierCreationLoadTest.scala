package com.example.backend.loadtest

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.util.Random

class DossierCreationLoadTest extends Simulation {

  val baseUrl = sys.props.getOrElse("base.url", "http://localhost:8080")
  val concurrentUsers = sys.props.getOrElse("concurrent.users", "100").toInt
  val dossiersPerHour = sys.props.getOrElse("dossiers.per.hour", "1000").toInt
  val durationMinutes = sys.props.getOrElse("duration.minutes", "60").toInt

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("Gatling-LoadTest/1.0")

  val cities = Array("Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux")
  val types = Array("SALE", "RENT")

  val annonceFeeder = Iterator.continually(Map(
    "title" -> s"Property ${java.util.UUID.randomUUID().toString.substring(0, 8)}",
    "description" -> "Beautiful property in excellent condition with modern amenities",
    "type" -> types(Random.nextInt(types.length)),
    "city" -> cities(Random.nextInt(cities.length)),
    "price" -> (200000 + Random.nextInt(500000)),
    "surface" -> (50.0 + Random.nextInt(150))
  ))

  val dossierFeeder = Iterator.continually(Map(
    "leadName" -> s"Lead ${java.util.UUID.randomUUID().toString.substring(0, 8)}",
    "leadEmail" -> s"lead${Random.nextInt(100000)}@example.com",
    "leadPhone" -> s"+336${"%08d".format(Random.nextInt(100000000))}"
  ))

  val createAnnonce = exec(
    feed(annonceFeeder)
  ).exec(
    http("Create Annonce")
      .post("/api/v1/annonces")
      .body(StringBody("""{"title":"${title}","description":"${description}","type":"${type}","city":"${city}","price":${price},"surface":${surface},"status":"ACTIVE"}""")).asJson
      .check(status.is(201))
      .check(jsonPath("$.id").saveAs("annonceId"))
  )

  val createDossier = exec(
    feed(dossierFeeder)
  ).exec(
    http("Create Dossier")
      .post("/api/v1/dossiers")
      .body(StringBody("""{"annonceId":${annonceId},"leadName":"${leadName}","leadEmail":"${leadEmail}","leadPhone":"${leadPhone}","status":"NEW","source":"WEB"}""")).asJson
      .check(status.is(201))
      .check(jsonPath("$.id").saveAs("dossierId"))
  )

  val getDossier = exec(
    http("Get Dossier")
      .get("/api/v1/dossiers/${dossierId}")
      .check(status.is(200))
  )

  val listAnnonces = exec(
    http("List Annonces")
      .get("/api/v1/annonces?page=0&size=20&status=ACTIVE")
      .check(status.is(200))
  )

  val listDossiers = exec(
    http("List Dossiers")
      .get("/api/v1/dossiers?page=0&size=20")
      .check(status.is(200))
  )

  val searchAnnonces = exec(
    http("Search Annonces")
      .get(s"/api/v1/annonces/search?city=${cities(Random.nextInt(cities.length))}")
      .check(status.is(200))
  )

  val updateDossierStatus = exec(
    http("Update Dossier Status")
      .patch("/api/v1/dossiers/${dossierId}/status")
      .body(StringBody("""{"status":"QUALIFIED"}""")).asJson
      .check(status.in(200, 204))
  )

  val dossierCreationScenario = scenario("Dossier Creation Workflow")
    .exec(createAnnonce)
    .pause(1.seconds, 3.seconds)
    .exec(createDossier)
    .pause(500.milliseconds, 2.seconds)
    .exec(getDossier)
    .pause(500.milliseconds, 1.second)
    .exec(updateDossierStatus)

  val browsingScenario = scenario("Browsing Annonces and Dossiers")
    .exec(listAnnonces)
    .pause(1.seconds, 3.seconds)
    .exec(searchAnnonces)
    .pause(1.seconds, 2.seconds)
    .exec(listDossiers)
    .pause(2.seconds, 5.seconds)

  setUp(
    dossierCreationScenario.inject(
      rampUsers(concurrentUsers / 2).during(5.minutes),
      constantUsersPerSec(dossiersPerHour / 3600.0).during((durationMinutes - 5).minutes)
    ),
    browsingScenario.inject(
      rampUsers(concurrentUsers / 2).during(5.minutes),
      constantUsersPerSec((concurrentUsers / 2) / 60.0).during((durationMinutes - 5).minutes)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(2000),
      global.responseTime.percentile4.lt(5000),
      global.successfulRequests.percent.gt(95.0)
    )
}
