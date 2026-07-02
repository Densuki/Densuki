// generators/certificates.js
const fs = require('fs');
const path = require('path');

// Garante que o caminho está correto
const assetsPath = path.join(__dirname, '../assets');
const docsPath = path.join(__dirname, '../docs/data');

// Lê e processa
const certificates = JSON.parse(
  fs.readFileSync(path.join(assetsPath, 'certificates.json'), 'utf-8')
);

// Processa dados...

// Salva em ambos os lugares
fs.writeFileSync(
  path.join(assetsPath, 'certificates.json'),
  JSON.stringify(certificates, null, 2)
);

// Copia para docs/data
fs.writeFileSync(
  path.join(docsPath, 'certificates.json'),
  JSON.stringify(certificates, null, 2)
);