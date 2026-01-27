package com.example.backend.loadtest

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class StressLoadTest extends Simulation {

  val baseUrl = sys.props.getOrElse("base.url", "http://localhost:8080")
  val maxUsers = sys.props.getOrElse("max.users", "500").toInt

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val listAnnonces = exec(
    http("List Annonces")
      .get("/api/v1/annonces?page=0&size=20")
      .check(status.is(200))
  )

  val getDashboard = exec(
    http("Get Dashboard")
      .get("/api/v1/dashboard/summary")
      .check(status.is(200))
  )

  val stressScenario = scenario("Stress Test - Gradual Increase")
    .exec(listAnnonces)
    .pause(500.milliseconds)
    .exec(getDashboard)

  setUp(
    stressScenario.inject(
      rampUsers(maxUsers / 4).during(2.minutes),
      rampUsers(maxUsers / 2).during(3.minutes),
      rampUsers((maxUsers * 3) / 4).during(3.minutes),
      rampUsers(maxUsers).during(2.minutes),
      constantUsersPerSec(maxUsers / 60.0).during(10.minutes)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(3000),
      global.responseTime.percentile4.lt(8000),
      global.successfulRequests.percent.gt(85.0)
    )
}
