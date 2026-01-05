const { spawn } = require('child_process');
const path = require('path');

const javaHome = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const mavenBin = 'C:\\Environement\\maven-3.8.6\\bin\\mvn.cmd';

const env = {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: `${path.join(javaHome, 'bin')};${process.env.PATH}`
};

console.log('Running Maven with Java 17...');
console.log(`JAVA_HOME: ${javaHome}`);

const mvn = spawn(mavenBin, ['clean', 'install', '-f', 'backend\\pom.xml'], {
    env: env,
    stdio: 'inherit',
    shell: true
});

mvn.on('close', (code) => {
    console.log(`Maven process exited with code ${code}`);
    process.exit(code);
});

mvn.on('error', (err) => {
    console.error('Failed to start Maven:', err);
    process.exit(1);
});
