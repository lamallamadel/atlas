const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'test-results'),
  path.join(__dirname, '..', 'test-results', 'screenshots'),
  path.join(__dirname, '..', 'test-results', 'artifacts'),
  path.join(__dirname, '..', 'test-results', 'html-report'),
  path.join(__dirname, '.auth'),
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('Test directories setup complete.');
