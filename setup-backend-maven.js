const { spawn } = require('child_process');
const path = require('path');

console.log('\n=== Backend Maven Setup ===\n');

const javaHome = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const mavenCmd = 'C:\\Environement\\maven-3.8.6\\bin\\mvn.cmd';
const backendDir = path.join(__dirname, 'backend');

const args = ['clean', 'install', '-DskipTests', '-s', 'settings.xml', '--global-toolchains', 'toolchains.xml'];

console.log('Running Maven install...');
console.log(`Command: mvn ${args.join(' ')}`);
console.log(`Directory: ${backendDir}`);
console.log(`JAVA_HOME: ${javaHome}\n`);

const mvn = spawn(mavenCmd, args, {
    cwd: backendDir,
    env: {
        ...process.env,
        JAVA_HOME: javaHome,
        PATH: `${javaHome}\\bin;${process.env.PATH}`
    },
    stdio: 'inherit',
    shell: true
});

mvn.on('close', (code) => {
    if (code === 0) {
        console.log('\n✓ Backend setup completed successfully!');
        process.exit(0);
    } else {
        console.error(`\n✗ Backend setup failed with exit code: ${code}`);
        process.exit(code);
    }
});

mvn.on('error', (err) => {
    console.error(`\n✗ Failed to start Maven process: ${err.message}`);
    process.exit(1);
});
