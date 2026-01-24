const { execSync } = require('child_process');
const path = require('path');

// Set Java 17 environment
const originalEnv = { ...process.env };
process.env.JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
process.env.PATH = `${process.env.JAVA_HOME}\\bin;${originalEnv.PATH}`;

console.log('JAVA_HOME:', process.env.JAVA_HOME);
console.log('Running: mvn clean compile from backend directory');
console.log('');

try {
    execSync('C:\\Environement\\maven-3.8.6\\bin\\mvn.cmd clean compile', {
        stdio: 'inherit',
        cwd: path.join(process.cwd(), 'backend'),
        env: process.env
    });
    console.log('\n✓ Backend compilation completed successfully!');
    process.exit(0);
} catch (error) {
    console.error('\n✗ Backend compilation failed');
    process.exit(1);
}
