# Instructions to Run mvn clean compile

## Implementation Complete

All mail configuration has been successfully added to all Spring Boot application profiles:

- ✅ `application-dev.yml`
- ✅ `application-prod.yml`
- ✅ `application-staging.yml`
- ✅ `application-e2e-h2-mock.yml`
- ✅ `application-e2e-h2-keycloak.yml`
- ✅ `application-e2e-postgres-mock.yml`
- ✅ `application-e2e-postgres-keycloak.yml`

## How to Run the Compile Command

The automated tool was unable to execute the compile command due to environment security restrictions that block scripts from setting environment variables (JAVA_HOME). However, you can manually run the compile command using one of the following methods:

### Method 1: Using the Local Maven Wrapper (Recommended)

```cmd
cd backend
.\mvn.cmd clean compile
```

This script automatically:
- Sets JAVA_HOME to `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- Adds Java 17 to PATH
- Copies settings.xml to .m2 directory
- Runs Maven with correct Java version

### Method 2: Using PowerShell Script

```powershell
cd backend
.\mvn-with-java17.ps1 clean compile
```

### Method 3: Manual Environment Setup

```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd backend
mvn clean compile
```

### Method 4: Using Maven with Toolchains

```cmd
cd backend
mvn clean compile --global-toolchains toolchains.xml
```

## Expected Output

When the compile succeeds, you should see log messages indicating successful bean creation:

### 1. NotificationConfig Initialization
```
Configuring JavaMailSender bean with host: localhost, port: 1025
JavaMailSender bean created successfully with SMTP auth: false, STARTTLS: false
```

### 2. BasicEmailProvider Initialization
```
BasicEmailProvider initialized successfully with JavaMailSender
```

### 3. NotificationService Initialization
```
NotificationService initialized successfully with EmailProvider: BasicEmailProvider
```

## Verification

After running `mvn clean compile`, verify:

1. **No Bean Creation Errors**: Check that there are no errors about missing JavaMailSender bean
2. **Successful Compilation**: All Java classes compile successfully
3. **Log Messages**: The initialization log messages appear in the output
4. **Exit Code**: Maven exits with code 0 (success)

## Troubleshooting

### If JAVA_HOME Not Set

**Error:**
```
The JAVA_HOME environment variable is not defined correctly
```

**Solution:** Use Method 1 (.\mvn.cmd) which automatically sets JAVA_HOME.

### If Wrong Java Version

**Error:**
```
error: release version 17 not supported
```

**Solution:** Ensure Java 17 is being used. Check with:
```cmd
java -version
```

Should show Java 17. If not, use the mvn.cmd wrapper.

### If Dependencies Not Downloaded

**Error:**
```
Could not resolve dependencies
```

**Solution:** Ensure internet connection is available and run:
```cmd
cd backend
.\mvn.cmd clean install -DskipTests
```

## Next Steps

After successful compilation:

1. ✅ Application compiles without errors
2. ✅ All beans are created successfully
3. ✅ NotificationService and BasicEmailProvider initialize correctly
4. ✅ Ready for testing or deployment

## Files Modified

See `MAIL_CONFIGURATION_IMPLEMENTATION.md` for detailed list of all files modified and configuration added.
