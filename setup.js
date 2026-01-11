#!/usr/bin/env node
/**
 * Complete Initial Setup Script for Newly Cloned Repository
 * Run this script from the repository root directory
 * Usage: node setup.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const MAVEN_CMD = 'C:\\Environement\\maven-3.8.6\\bin\\mvn.cmd';

console.log('========================================');
console.log('  Repository Initial Setup');
console.log('========================================');
console.log('');

// Set environment for child processes
process.env.JAVA_HOME = JAVA_HOME;
process.env.PATH = `${JAVA_HOME}\\bin;${process.env.PATH}`;

// Helper function to run commands
function runCommand(command, cwd, description) {
    console.log(`\x1b[33m${description}...\x1b[0m`);
    try {
        execSync(command, {
            cwd: cwd || process.cwd(),
            stdio: 'inherit',
            env: process.env
        });
        console.log(`\x1b[32m✓ ${description} completed\x1b[0m`);
        console.log('');
        return true;
    } catch (error) {
        console.error(`\x1b[31m✗ ${description} failed!\x1b[0m`);
        return false;
    }
}

// Step 1: Verify Java 17
console.log('[1/4] Verifying Java 17...');
if (!fs.existsSync(JAVA_HOME)) {
    console.error(`\x1b[31mERROR: Java 17 not found at ${JAVA_HOME}\x1b[0m`);
    console.error('Please verify the Java 17 installation path.');
    process.exit(1);
}

if (!runCommand('java -version', null, 'Java version check')) {
    console.error('Please verify Java 17 is correctly installed.');
    process.exit(1);
}

// Step 2: Backend Maven install
console.log('[2/4] Installing backend dependencies (Maven)...');
console.log('This may take several minutes on first run...');
const backendDir = path.join(process.cwd(), 'backend');
if (!runCommand(`"${MAVEN_CMD}" clean install -DskipTests`, backendDir, 'Backend Maven install')) {
    console.error('\x1b[31mBackend setup failed! Please check the error messages above.\x1b[0m');
    process.exit(1);
}

// Step 3: Frontend npm install
console.log('[3/4] Installing frontend dependencies (npm)...');
console.log('This may take several minutes...');
const frontendDir = path.join(process.cwd(), 'frontend');
if (!runCommand('npm install', frontendDir, 'Frontend npm install')) {
    console.error('\x1b[31mFrontend setup failed! Please check the error messages above.\x1b[0m');
    process.exit(1);
}

// Step 4: Playwright browsers
console.log('[4/4] Installing Playwright browsers...');
if (!runCommand('npx playwright install', frontendDir, 'Playwright browsers install')) {
    console.warn('\x1b[33mWARNING: Playwright browser installation failed!\x1b[0m');
    console.warn('You can install them later with: cd frontend && npx playwright install');
} else {
    console.log('');
}

// Success message
console.log('========================================');
console.log('\x1b[32m  Setup Complete!\x1b[0m');
console.log('========================================');
console.log('');
console.log('\x1b[36mYou can now:\x1b[0m');
console.log('  • Build backend:     cd backend && mvn clean package');
console.log('  • Test backend:      cd backend && mvn test');
console.log('  • Run backend:       cd backend && mvn spring-boot:run');
console.log('  • Test frontend E2E: cd frontend && npm run e2e');
console.log('');
console.log('See AGENTS.md for more commands and options.');
