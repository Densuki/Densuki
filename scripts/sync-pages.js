const fs = require('fs');
const path = require('path');

// Sincroniza assets com docs/data
const assetsDir = path.join(__dirname, '../assets');
const docsDataDir = path.join(__dirname, '../docs/data');

// Garante que docs/data existe
if (!fs.existsSync(docsDataDir)) {
  fs.mkdirSync(docsDataDir, { recursive: true });
}

// Copia todos os JSONs
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.json'));
files.forEach(file => {
  const source = path.join(assetsDir, file);
  const dest = path.join(docsDataDir, file);
  fs.copyFileSync(source, dest);
  console.log(`✅ Copiado: ${file}`);
});