#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const MAVEN_HOME = 'C:\\Environement\\maven-3.8.6';

console.log('='.repeat(60));
console.log('Backend Installation');
console.log('='.repeat(60));
console.log(`JAVA_HOME: ${JAVA_HOME}`);
console.log(`MAVEN_HOME: ${MAVEN_HOME}`);
console.log('');

try {
    // Set up environment
    const env = { ...process.env };
    env.JAVA_HOME = JAVA_HOME;
    env.PATH = `${JAVA_HOME}\\bin;${MAVEN_HOME}\\bin;${env.PATH}`;
    
    console.log('Running: mvn clean install -DskipTests');
    console.log('');
    
    execSync('mvn clean install -DskipTests', {
        env: env,
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✓ Backend installation complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run tests: mvn test');
    console.log('  2. Start dev server: mvn spring-boot:run');
    console.log('');
} catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('✗ Installation failed');
    console.error('='.repeat(60));
    console.error(error.message);
    process.exit(1);
}
