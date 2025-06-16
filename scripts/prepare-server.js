import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Preparing server for deployment...');

// Copy server files to dist directory
const serverSource = path.join(__dirname, '../server');
const serverDest = path.join(__dirname, '../dist/server');

// Create dist/server directory
if (!fs.existsSync(serverDest)) {
  fs.mkdirSync(serverDest, { recursive: true });
}

// Copy server files
fs.copyFileSync(
  path.join(serverSource, 'stripe-server.js'),
  path.join(serverDest, 'stripe-server.js')
);

// Create a simple package.json for the server
const serverPackage = {
  "name": "francesco-fiori-server",
  "version": "1.0.0",
  "type": "module",
  "main": "stripe-server.js",
  "scripts": {
    "start": "node stripe-server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "stripe": "^14.21.0",
    "@supabase/supabase-js": "^2.39.3",
    "dotenv": "^16.4.5"
  }
};

fs.writeFileSync(
  path.join(serverDest, 'package.json'),
  JSON.stringify(serverPackage, null, 2)
);

// Create a Procfile for deployment
const procfile = 'web: node server/stripe-server.js\n';
fs.writeFileSync(
  path.join(__dirname, '../dist/Procfile'),
  procfile
);

console.log('✅ Server prepared for deployment');
console.log('📁 Server files copied to dist/server/');
console.log('📄 Procfile created');
console.log('🚀 Ready for deployment!');
