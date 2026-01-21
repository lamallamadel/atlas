/**
 * Setup script to create necessary test directories
 * Run before tests to ensure all output directories exist
 */

const fs = require('fs');
const path = require('path');

const dirs = [
  'test-results',
  'test-results/screenshots',
  'test-results/artifacts',
  'test-results/html-report',
  '.auth'
];

dirs.forEach(dir => {
  const dirPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

console.log('Test directories setup complete');
