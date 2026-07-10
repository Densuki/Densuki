export const CONFIG = {
  dataPath: '',
  terminalSpeed: 80,
  terminalDelay: 2000,
  scrollThreshold: 0.1,
  githubUsername: 'Densuki',
  discordId: '568923940768972808',
  defaultVolume: 0.5,
};

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export async function fetchJSON(path) {
  const resource = path.replace(/^\.?\//, '');
  const candidates = [
    new URL(`data/${resource}`, window.location.href).toString(),
    new URL(`./data/${resource}`, window.location.href).toString(),
    new URL(`../data/${resource}`, window.location.href).toString(),
    new URL(`/Densuki/data/${resource}`, window.location.origin).toString(),
    new URL(`/data/${resource}`, window.location.origin).toString(),
  ];

  if (CONFIG.dataPath) candidates.push(new URL(resource, CONFIG.dataPath).toString());
  candidates.push(new URL(`./${resource}`, window.location.href).toString());

  for (const url of [...new Set(candidates)]) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return response.json();
    } catch (_err) {
      // tenta o próximo caminho
    }
  }

  console.warn(`⚠️ Não foi possível carregar ${resource}`);
  return null;
}

export async function loadData() {
  const [books, cache, certificates, courses, current, games, music, mediaLibrary, profile, projects, statistics] = await Promise.all([
    fetchJSON('books.json'),
    fetchJSON('cache.json'),
    fetchJSON('certificates.json'),
    fetchJSON('courses.json'),
    fetchJSON('current.json').catch(() => null),
    fetchJSON('games.json'),
    fetchJSON('music.json'),
    fetchJSON('media-library.json'),
    fetchJSON('profile.json'),
    fetchJSON('projects.json'),
    fetchJSON('statistics.json'),
  ]);
  return { books, cache, certificates, courses, current, games, music, mediaLibrary, profile, projects, statistics };
}
