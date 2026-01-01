#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const javaHome = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const mavenCmd = 'mvn';

console.log('Setting up backend with Java 17...');
console.log(`JAVA_HOME: ${javaHome}\n`);

const mvn = spawn(mavenCmd, ['clean', 'install', '-DskipTests'], {
  cwd: __dirname,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: `${javaHome}\\bin;${process.env.PATH}`
  },
  stdio: 'inherit',
  shell: true
});

mvn.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

mvn.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Backend setup complete!');
  } else {
    console.error(`\n✗ Backend setup failed with code ${code}`);
    process.exit(code);
  }
});
