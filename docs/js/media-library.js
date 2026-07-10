import { fetchJSON } from './core.js';

const EMPTY_LIBRARY = Object.freeze({ audio: [], images: [], videos: [] });
let cachedLibrary = null;

export async function loadMediaLibrary() {
  if (cachedLibrary) return cachedLibrary;
  const data = await fetchJSON('media-library.json');
  cachedLibrary = normalizeMediaLibrary(data);
  return cachedLibrary;
}

export function normalizeMediaLibrary(data) {
  return {
    audio: normalizeItems(data?.audio),
    images: normalizeItems(data?.images),
    videos: normalizeItems(data?.videos),
  };
}

export function getMediaByType(library = EMPTY_LIBRARY, type = 'images') {
  return Array.isArray(library?.[type]) ? library[type] : [];
}

export function getPlaylist(library = EMPTY_LIBRARY, playlist = 'default') {
  return getMediaByType(library, 'audio').filter((item) => (item.playlist || 'default') === playlist);
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.src)
    .map((item, index) => ({
      id: item.id || `media-${index}`,
      title: item.title || item.name || item.src.split('/').pop(),
      src: item.src,
      type: item.type || inferType(item.src),
      playlist: item.playlist || 'default',
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
}

function inferType(src) {
  const extension = src.split('.').pop()?.toLowerCase();
  const types = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };
  return types[extension] || 'application/octet-stream';
}
