import fs from "fs";
import path from "path";
const replacements = [
  { from: /#1A4A3A/g, to: "#1B2B5E" },
  { from: /#F2F4F0/g, to: "#F5F7FA" },
  { from: /#111C17/g, to: "#0F172A" },
  { from: /#8A9E94/g, to: "#64748B" },
  { from: /#4A5E54/g, to: "#334155" },
  { from: /#B8922A/g, to: "#2563EB" },
  { from: /#D4AA45/g, to: "#60A5FA" },
  { from: /#EDF0EC/g, to: "#F1F5F9" },
  { from: /#DDE3DC/g, to: "#E2E8F0" },
  { from: /#EEF1ED/g, to: "#F8FAFC" },
  { from: /#112D23/g, to: "#0E1736" },
  { from: /rgba\(26,\s*74,\s*58/g, to: "rgba(27, 43, 94" }
];
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      replacements.forEach(({ from, to }) => {
        content = content.replace(from, to);
      });
      fs.writeFileSync(fullPath, content);
    }
  }
}
processDir("src");
console.log("Done");
