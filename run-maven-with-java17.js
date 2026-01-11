const { execSync } = require('child_process');
const path = require('path');

// Set Java 17 environment
process.env.JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
process.env.PATH = `${process.env.JAVA_HOME}\\bin;${process.env.PATH}`;

console.log('JAVA_HOME:', process.env.JAVA_HOME);
console.log('Running: mvn clean install -DskipTests');

try {
    execSync('mvn -f backend\\pom.xml clean install -DskipTests', {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env
    });
    console.log('\\nBackend build completed successfully!');
} catch (error) {
    console.error('Backend build failed');
    process.exit(1);
}
