const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up backend with Java 17...\n');

// Set environment
const env = {
  ...process.env,
  JAVA_HOME: 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot',
  PATH: 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot\\bin;' + process.env.PATH
};

try {
  // Run Maven clean install with skip tests
  console.log('Running: mvn clean install -DskipTests\n');
  execSync('mvn --settings settings.xml clean install -DskipTests', {
    cwd: path.join(__dirname, 'backend'),
    env: env,
    stdio: 'inherit'
  });
  
  console.log('\n✓ Backend setup complete!');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Backend setup failed');
  process.exit(1);
}
