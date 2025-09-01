#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively process files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

// Function to process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace @shared imports with relative paths
  content = content.replace(/from ['"]@shared\/([^'"]+)['"]/g, (match, importPath) => {
    // Calculate relative path from current file to src/shared
    const relativePath = path.relative(path.dirname(filePath), path.join('src', 'shared', importPath));
    return `from '${relativePath}'`;
  });
  
  fs.writeFileSync(filePath, content);
}

// Start processing from dist directory
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('Processing compiled files for production...');
  processDirectory(distPath);
  console.log('Production build complete!');
} else {
  console.log('Dist directory not found. Run npm run build first.');
}
