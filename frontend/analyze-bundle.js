const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build', 'static', 'js');

// Get all JS files in the build directory
const files = fs.readdirSync(buildDir).filter(file => file.endsWith('.js') && !file.endsWith('.map'));

console.log('📊 Bundle Size Analysis');
console.log('========================\n');

let totalSize = 0;
const fileSizes = [];

files.forEach(file => {
  const filePath = path.join(buildDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  fileSizes.push({ name: file, size: stats.size, sizeKB, sizeMB });
  totalSize += stats.size;

  console.log(`${file}: ${sizeKB} KB (${sizeMB} MB)`);
});

console.log('\n========================');
console.log(`Total Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Number of chunks: ${files.length}`);

// Sort by size (largest first)
fileSizes.sort((a, b) => b.size - a.size);

console.log('\nLargest chunks:');
fileSizes.slice(0, 5).forEach((file, index) => {
  console.log(`${index + 1}. ${file.name}: ${file.sizeKB} KB`);
});

console.log('\n💡 Optimization Suggestions:');
console.log('- Consider lazy loading large components');
console.log('- Review and optimize FontAwesome icon imports');
console.log('- Consider using dynamic imports for heavy libraries');
console.log('- Implement code splitting for routes');
