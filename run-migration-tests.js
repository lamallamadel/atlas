#!/usr/bin/env node

/**
 * Run migration verification tests for V15 and V102
 * This script sets JAVA_HOME and runs both H2 and PostgreSQL E2E tests
 */

const { spawn } = require('child_process');
const path = require('path');

const JAVA_HOME = 'C:\\Environement\\Java\\jdk-17.0.5.8-hotspot';
const BACKEND_DIR = path.join(__dirname, 'backend');

function runCommand(command, args, cwd, env) {
    return new Promise((resolve, reject) => {
        console.log(`\nRunning: ${command} ${args.join(' ')}`);
        console.log(`Working directory: ${cwd}`);
        console.log(`JAVA_HOME: ${env.JAVA_HOME}\n`);
        
        const proc = spawn(command, args, {
            cwd,
            env: { ...process.env, ...env },
            stdio: 'inherit',
            shell: true
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    const env = {
        JAVA_HOME,
        PATH: `${JAVA_HOME}\\bin;${process.env.PATH}`
    };

    try {
        console.log('='.repeat(60));
        console.log('Migration V15 & V102 Verification Tests');
        console.log('='.repeat(60));

        // Test 1: H2 Profile (V15 only)
        console.log('\n[1/2] Running H2 E2E Tests (V15 migration)...');
        await runCommand('mvn', ['verify', '-Pbackend-e2e-h2'], BACKEND_DIR, env);
        console.log('✅ H2 tests passed!');

        // Test 2: PostgreSQL Profile (V15 + V102)
        console.log('\n[2/2] Running PostgreSQL E2E Tests (V15 + V102 migrations)...');
        await runCommand('mvn', ['verify', '-Pbackend-e2e-postgres'], BACKEND_DIR, env);
        console.log('✅ PostgreSQL tests passed!');

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED - Migrations V15 & V102 verified successfully!');
        console.log('='.repeat(60));
        process.exit(0);

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED');
        console.error('='.repeat(60));
        console.error(error.message);
        process.exit(1);
    }
}

main();
