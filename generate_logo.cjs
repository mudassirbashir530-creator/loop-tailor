const fs = require('fs');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="30" ry="30" fill="#1d665b"/>
  <g transform="translate(24, 24) scale(3)" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" x2="8.12" y1="4" y2="15.88"/>
    <line x1="14.47" x2="20" y1="14.48" y2="20"/>
    <line x1="8.12" x2="12" y1="8.12" y2="12"/>
  </g>
</svg>
`.trim();


const b64 = Buffer.from(svg).toString('base64');
const dataUri = `data:image/svg+xml;base64,${b64}`;

console.log(dataUri);
