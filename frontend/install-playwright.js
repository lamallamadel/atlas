#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('Installing Playwright browsers...');
console.log('');

try {
    execSync('npx -y playwright install', {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log('');
    console.log('✓ Playwright browsers installed successfully!');
} catch (error) {
    console.error('');
    console.error('✗ Failed to install Playwright browsers');
    console.error(error.message);
    process.exit(1);
}
