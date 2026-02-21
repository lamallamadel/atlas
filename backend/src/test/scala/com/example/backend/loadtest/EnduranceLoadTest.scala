package com.example.backend.loadtest

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.util.Random

class EnduranceLoadTest extends Simulation {

  val baseUrl = sys.props.getOrElse("base.url", "http://localhost:8080")
  val steadyUsers = sys.props.getOrElse("steady.users", "50").toInt
  val durationHours = sys.props.getOrElse("duration.hours", "4").toInt

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val cities = Array("Paris", "Lyon", "Marseille", "Toulouse", "Nice")

  val listAnnonces = exec(
    http("List Annonces")
      .get("/api/v1/annonces?page=0&size=20")
      .check(status.is(200))
  )

  val searchAnnonces = exec(
    http("Search Annonces")
      .get(s"/api/v1/annonces/search?city=${cities(Random.nextInt(cities.length))}")
      .check(status.is(200))
  )

  val listDossiers = exec(
    http("List Dossiers")
      .get("/api/v1/dossiers?page=0&size=20")
      .check(status.is(200))
  )

  val getDashboard = exec(
    http("Get Dashboard")
      .get("/api/v1/dashboard/summary")
      .check(status.is(200))
  )

  val enduranceScenario = scenario("Endurance Test - Sustained Load")
    .exec(listAnnonces)
    .pause(2.seconds, 5.seconds)
    .exec(searchAnnonces)
    .pause(1.seconds, 3.seconds)
    .exec(listDossiers)
    .pause(2.seconds, 4.seconds)
    .exec(getDashboard)
    .pause(3.seconds, 7.seconds)

  setUp(
    enduranceScenario.inject(
      rampUsers(steadyUsers).during(10.minutes),
      constantUsersPerSec(steadyUsers / 60.0).during(durationHours.hours)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(2000),
      global.responseTime.percentile4.lt(5000),
      global.successfulRequests.percent.gt(99.0)
    )
}
