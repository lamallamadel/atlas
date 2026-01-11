# Manual Setup Instructions

Due to security restrictions, the automated setup cannot modify environment variables. Please follow these manual steps to complete the repository setup.

## Backend Setup

### Option 1: Using PowerShell (Recommended)

1. Open PowerShell and navigate to the repository root
2. Run the following commands:

```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

### Option 2: Using Command Prompt

1. Open Command Prompt and navigate to the repository root
2. Run the following commands:

```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -DskipTests
```

### Option 3: Using the Provided Wrapper Script

The repository includes a `mvn17.cmd` wrapper in the `backend` directory:

```cmd
cd backend
mvn17.cmd clean install -DskipTests
```

**Note:** You may need to allow script execution if prompted.

## Frontend Setup

After the backend is set up, install the frontend dependencies:

```powershell
cd frontend
npm install
npx playwright install
```

## Verification

After setup is complete, verify everything works:

### Backend Tests
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn test
```

### Frontend E2E Tests
```powershell
cd frontend
npm run e2e:fast
```

## Alternative: Maven Toolchains

If you prefer not to set JAVA_HOME each time, you can configure Maven toolchains:

1. Create or edit `%USERPROFILE%\.m2\toolchains.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
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

2. Note: Maven itself still needs JAVA_HOME set to run, but this allows it to compile with a different JDK.

## Quick Start After Setup

Once setup is complete:

- **Start backend dev server:** `cd backend && mvn spring-boot:run`
- **Run backend tests:** `cd backend && mvn test`
- **Run frontend E2E tests:** `cd frontend && npm run e2e`
- **Run all E2E configurations:** `cd frontend && npm run e2e:full`

See `AGENTS.md` for more command options and details.
