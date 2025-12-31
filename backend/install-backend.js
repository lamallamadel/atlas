#!/usr/bin/env node
/**
 * Backend installation script using Node.js
 * This script sets up Java 17 environment and runs Maven
 */

const { spawn } = require('child_process');
const path = require('path');

const JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';

console.log('Setting up backend with Java 17...');
console.log(`JAVA_HOME: ${JAVA_HOME}`);

// Set up environment
const env = { ...process.env };
env.JAVA_HOME = JAVA_HOME;
env.PATH = `${JAVA_HOME}\\bin;${env.PATH}`;

// Run Maven
const maven = spawn('mvn', ['clean', 'install', '-DskipTests'], {
    env: env,
    stdio: 'inherit',
    shell: true
});

maven.on('close', (code) => {
    if (code === 0) {
        console.log('\n✓ Backend setup complete!');
        console.log('\nYou can now run:');
        console.log('  - mvn test (run tests)');
        console.log('  - mvn spring-boot:run (start dev server)');
    } else {
        console.error(`\n✗ Maven exited with code ${code}`);
        process.exit(code);
    }
});
