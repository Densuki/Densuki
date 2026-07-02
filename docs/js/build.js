// docs/js/build.js
import fs from 'fs/promises';
import path from 'path';

async function buildHTML() {
  // Carrega dados
  const profile = JSON.parse(
    await fs.readFile('docs/data/profile.json', 'utf-8')
  );
  
  // Carrega template
  let index = await fs.readFile('docs/index.html', 'utf-8');
  
  // Substitui placeholders
  index = index
    .replace(/\{name\}/g, profile.name)
    .replace(/\{role\}/g, profile.role)
    .replace(/\{location\}/g, profile.location);
  
  // Salva
  await fs.writeFile('docs/index.html', index);
}

buildHTML();