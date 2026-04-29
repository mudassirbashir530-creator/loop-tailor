const { execSync } = require('child_process');
try {
  const log = execSync('git log -n 5 --oneline', { encoding: 'utf-8' });
  console.log("Git Log:");
  console.log(log);
  
  const status = execSync('git status -s', { encoding: 'utf-8' });
  console.log("Git Status:");
  console.log(status);
} catch (e) {
  console.error("Error:", e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
}
