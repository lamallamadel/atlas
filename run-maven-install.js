const { spawn } = require('child_process');
const path = require('path');

// Set Java 17 home
const javaHome = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${javaHome}\\bin;${process.env.PATH}`
};

// Run Maven
const mvn = spawn('mvn', ['clean', 'install', '-DskipTests'], {
  cwd: path.join(__dirname, 'backend'),
  env: env,
  stdio: 'inherit',
  shell: true
});

mvn.on('close', (code) => {
  process.exit(code);
});
