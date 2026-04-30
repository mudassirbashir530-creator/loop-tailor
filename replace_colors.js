import fs from 'fs';
import path from 'path';

const replacements = [
  { from: /#1B2B5E/ig, to: '#16A34A' },
  { from: /#0E1736/ig, to: '#15803D' },
  { from: /#2563EB/ig, to: '#16A34A' }, 
  { from: /rgba\(27,\s*43,\s*94/g, to: 'rgba(22, 163, 74' },
  { from: /rgba\(37,\s*99,\s*235/g, to: 'rgba(22, 163, 74' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
          content = content.replace(from, to);
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('src');
console.log('Done replacing colors');
