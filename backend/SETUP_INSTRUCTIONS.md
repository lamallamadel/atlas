# Backend Setup Instructions

## Quick Setup

This backend requires Java 17. Run **ONE** of these commands in a new terminal:

### PowerShell (Recommended)
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install -DskipTests
```

### Or use the helper script
```powershell
.\run-maven.ps1
```

### Or use Command Prompt
```cmd
setup.cmd
```

## That's it!

After Maven completes, you can run:
- `mvn test` - Run tests
- `mvn clean package` - Build
- `mvn spring-boot:run` - Start server (http://localhost:8080)

## Troubleshooting

**If Maven says "JAVA_HOME not defined":**
- You must set JAVA_HOME before running Maven
- Use one of the commands above in a fresh terminal window

**If you get Java version errors:**
- This project requires Java 17
- Java 17 is installed at: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- Make sure JAVA_HOME points to Java 17, not Java 8

## Using the Maven Wrapper

For convenience, use `mvn-java17.cmd` for any Maven command:
```cmd
mvn-java17.cmd clean install
mvn-java17.cmd test
mvn-java17.cmd spring-boot:run
```

This automatically sets Java 17 before running Maven.
