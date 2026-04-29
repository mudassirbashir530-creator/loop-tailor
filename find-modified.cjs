const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push({ file, mtime: stat.mtime });
    }
  });
  return results;
}

const files = walk('.');
files.sort((a, b) => b.mtime - a.mtime);
for (let i = 0; i < 20; i++) {
  console.log(`${files[i].mtime.toISOString()} - ${files[i].file}`);
}
