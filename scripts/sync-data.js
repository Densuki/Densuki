const fs = require('fs');
const path = require('path');

// Copiar dados atualizados para docs/data/
function syncData() {
  const assetsPath = './assets';
  const docsDataPath = './docs/data';
  
  ['books.json', 'certificates.json', 'courses.json', 
   'games.json', 'music.json', 'statistics.json'].forEach(file => {
    const source = path.join(assetsPath, file);
    const dest = path.join(docsDataPath, file);
    fs.copyFileSync(source, dest);
  });
}