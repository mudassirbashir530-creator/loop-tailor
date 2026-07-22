const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically target navigation and links
      let newContent = content
        .replace(/\/dashboard\/customers/g, '/app/clients')
        .replace(/\/dashboard\/orders\/new/g, '/app/new-order')
        .replace(/\/dashboard\/orders/g, '/app/orders')
        .replace(/\/dashboard\/settings/g, '/app/settings')
        .replace(/\/dashboard\/staff/g, '/app/staff')
        .replace(/\/dashboard\/reminders/g, '/app/reminders')
        .replace(/\/dashboard\/notifications/g, '/app/notifications')
        .replace(/\/dashboard/g, '/app');
      
      // Target auth routes if they are exactly /login or /signup
      // We must be careful not to break other URLs
      newContent = newContent
        .replace(/to="\/login"/g, 'to="/auth/login"')
        .replace(/to="\/signup"/g, 'to="/auth/signup"')
        .replace(/navigate\('\/login'\)/g, 'navigate(\'/auth/login\')')
        .replace(/navigate\('\/signup'\)/g, 'navigate(\'/auth/signup\')')
        .replace(/navigate\("\/login"\)/g, 'navigate("/auth/login")')
        .replace(/navigate\("\/signup"\)/g, 'navigate("/auth/signup")');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('src');
