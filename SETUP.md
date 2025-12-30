# Initial Setup Instructions

## Prerequisites

- Java 17 (JDK 17.0.5.8 or later)
- Maven 3.6+

## Environment Configuration

### Setting JAVA_HOME

This project requires Java 17. Before running Maven commands, ensure JAVA_HOME points to Java 17:

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

**Windows (Command Prompt):**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
```

### Verify Java Version

```bash
java -version
# Should show: openjdk version "17.x.x" or similar
```

## Installation

Once JAVA_HOME is configured, install dependencies:

```bash
cd backend
mvn clean install
```

Or to skip tests:

```bash
mvn clean install -DskipTests
```

## Alternative: Using Maven Toolchains

If you have multiple Java versions and prefer not to change JAVA_HOME globally:

1. Create `~/.m2/toolchains.xml` (or `%USERPROFILE%\.m2\toolchains.xml` on Windows):

```xml
<?xml version="1.0" encoding="UTF8"?>
<toolchains>
    <toolchain>
        <type>jdk</type>
        <provides>
            <version>17</version>
            <vendor>openjdk</vendor>
        </provides>
        <configuration>
            <jdkHome>C:\Environement\Java\jdk-17.0.5.8-hotspot</jdkHome>
        </configuration>
    </toolchain>
</toolchains>
```

2. The project's `pom.xml` is already configured to use toolchains plugin.

3. Note: Maven itself still requires JAVA_HOME to be set to run, but it can compile with a different JDK version using toolchains.

## Build Commands

- **Clean and build:** `mvn clean package`
- **Run tests:** `mvn test`
- **Skip tests:** `mvn clean package -DskipTests`
- **Run application:** `mvn spring-boot:run`

## Infrastructure Setup

The `infra/` directory contains Docker Compose configuration for local infrastructure:

```bash
cd infra
docker-compose up -d
```

See `infra/README.md` for details on available services and configuration.
