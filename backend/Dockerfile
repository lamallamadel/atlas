# syntax=docker/dockerfile:1.5

# -------------------------
# Build stage
# -------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy build descriptors first (best cache hit)
COPY pom.xml /app/pom.xml
COPY settings.xml /app/settings.xml

# Create toolchains inside the image layer (Linux-safe)
RUN mkdir -p /root/.m2 && \
    cat > /root/.m2/toolchains.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<toolchains>
  <toolchain>
    <type>jdk</type>
    <provides>
      <version>17</version>
    </provides>
    <configuration>
      <jdkHome>${JAVA_HOME}</jdkHome>
    </configuration>
  </toolchain>
</toolchains>
EOF

# Download dependencies (without cache mount for compatibility)
RUN mvn -ntp -s /app/settings.xml dependency:go-offline

# Copy sources and build
COPY src /app/src

RUN mvn -ntp -s /app/settings.xml clean package -Dmaven.test.skip=true


# -------------------------
# Runtime stage
# -------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Keep curl only if you actually use an HTTP healthcheck
RUN apk add --no-cache curl

# Copy the built jar (avoid hardcoded jar name when possible)
COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
