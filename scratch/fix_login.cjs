const fs = require('fs');

let content = fs.readFileSync('src/app/pages/LoginPage.tsx', 'utf-8');

// Replace indigo with blue
content = content.replace(/indigo/g, 'blue');

// Remove inline fonts
content = content.replace(/style=\{\{\s*fontFamily:\s*[^}]+\}\}/g, '');
content = content.replace(/,?\s*fontFamily:\s*"[^"]+"/g, '');
content = content.replace(/style=\{\{\s*\}\}/g, '');

fs.writeFileSync('src/app/pages/LoginPage.tsx', content);
console.log('Login page styling updated.');
