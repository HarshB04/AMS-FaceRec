const fs = require('fs');

// Fix API file
const apiPath = 'src/app/lib/api.ts';
let apiCode = fs.readFileSync(apiPath, 'utf8');
apiCode = apiCode.replace(/make-server-803da240/g, 'server');
fs.writeFileSync(apiPath, apiCode);

// Fix server index file
const serverPath = 'supabase/functions/server/index.ts';
let serverCode = fs.readFileSync(serverPath, 'utf8');
serverCode = serverCode.replace(/\/make-server-803da240\//g, '/functions/v1/server/');
fs.writeFileSync(serverPath, serverCode);

console.log('Fixed URLs automatically!');
