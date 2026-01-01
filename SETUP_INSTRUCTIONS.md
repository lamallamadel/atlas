# Initial Setup Instructions

This repository has been prepared for initial setup. Due to security restrictions in the automated environment, please run the following commands manually to complete the setup.

## Prerequisites

Ensure you have:
- Java 17 (JDK 17.0.5.8 or later) installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- Maven 3.6+
- Node.js 16+ and npm

## Setup Steps

### Option 1: Using the Install Scripts (Recommended)

#### Backend Setup
```powershell
cd backend
node install.js
```

This will:
- Set JAVA_HOME to Java 17
- Run `mvn clean install -DskipTests`
- Download all Maven dependencies

#### Frontend Setup
```powershell
cd frontend
npm install
```

This will download all Node.js/Angular dependencies.

### Option 2: Manual Setup

If the install scripts don't work, run these commands:

#### Backend Setup
```powershell
# Set JAVA_HOME in your PowerShell session
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Navigate to backend and install
cd backend
mvn clean install -DskipTests
```

Or use the provided wrapper:
```powershell
cd backend
.\mvn-java17.cmd clean install -DskipTests
```

#### Frontend Setup
```powershell
cd frontend
npm install
```

## Verification

After setup, verify everything works:

### Backend
```powershell
cd backend
.\mvn-java17.cmd test
```

### Frontend
```powershell
cd frontend
npm test
```

## Next Steps

Once setup is complete:

1. **Start Infrastructure** (optional, for full-stack development):
   ```powershell
   cd infra
   docker-compose up -d
   ```

2. **Run Backend Dev Server**:
   ```powershell
   cd backend
   .\mvn-java17.cmd spring-boot:run
   ```

3. **Run Frontend Dev Server**:
   ```powershell
   cd frontend
   npm start
   ```

The backend will be available at http://localhost:8080
The frontend will be available at http://localhost:4200

## Troubleshooting

### JAVA_HOME Issues
If you get Java version errors, ensure JAVA_HOME points to Java 17:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Maven Issues
The project includes a `mvn-java17.cmd` wrapper that automatically sets the correct Java version. Use it instead of calling `mvn` directly.

### Frontend Issues
If npm install fails, try:
```powershell
cd frontend
npm cache clean --force
npm install
```
