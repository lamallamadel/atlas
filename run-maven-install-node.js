const { execSync } = require('child_process');
const path = require('path');

// Set Java 17 for Maven
process.env.JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
process.env.PATH = `${process.env.JAVA_HOME}\\bin;${process.env.PATH}`;

console.log('JAVA_HOME set to:', process.env.JAVA_HOME);
console.log('Running Maven clean install...');

try {
  // Change to backend directory
  process.chdir(path.join(__dirname, 'backend'));
  
  // Run Maven command (skip tests for initial setup)
  execSync('mvn clean install -DskipTests -gs settings.xml -t toolchains.xml', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('\n✓ Backend Maven installation completed successfully!');
} catch (error) {
  console.error('\n✗ Maven installation failed:', error.message);
  process.exit(1);
}
