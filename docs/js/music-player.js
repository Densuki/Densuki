import { $, CONFIG } from './core.js';
import { getPlaylist, normalizeMediaLibrary } from './media-library.js';

function normalizePlaylist(profile, musicData, mediaLibrary) {
  const libraryPlaylist = getPlaylist(normalizeMediaLibrary(mediaLibrary), 'default');
  const list = Array.isArray(profile?.music)
    ? profile.music
    : (Array.isArray(musicData?.tracks) ? musicData.tracks : libraryPlaylist);
  return list.length ? list : [{ title: 'Background', src: 'assets/audio/background.mp3', type: 'audio/mpeg' }];
}

export function initMusicPlayer(profile, musicData = null, mediaLibrary = null) {
  const audio = $('#bg-music');
  const toggle = $('#music-toggle');
  const volRange = $('#volume-range');
  const volDown = $('#vol-down');
  const volUp = $('#vol-up');
  const musicSelect = $('#music-select');
  const musicControls = $('#music-controls');
  const currentTrack = $('#current-track');
  const panelToggle = $('#music-panel-toggle');
  const playerUi = $('#music-player-ui');

  if (!audio || !toggle || !musicControls || !volRange || !musicSelect) return;
  if (profile?.show?.music === false) {
    [toggle, panelToggle, playerUi].forEach((el) => { if (el) el.hidden = true; });
    musicControls.hidden = true;
    return;
  }

  const playlist = normalizePlaylist(profile, musicData, mediaLibrary);
  let currentIndex = 0;
  let isPlaying = false;

  musicSelect.innerHTML = playlist.map((track, index) => `<option value="${index}">${track.title || track.src}</option>`).join('');

  const savedVol = parseFloat(localStorage.getItem('volume'));
  const initialVol = Number.isFinite(savedVol) ? savedVol : CONFIG.defaultVolume;
  audio.volume = initialVol;
  volRange.value = initialVol;

  const setTrackLabel = (track) => {
    if (currentTrack) currentTrack.textContent = track.title || track.src.split('/').pop();
    if (playerUi) playerUi.setAttribute('title', `Tocando: ${currentTrack?.textContent || 'música'}`);
  };

  const loadTrack = (index, shouldPlay = false) => {
    const track = playlist[index];
    if (!track) return;
    currentIndex = index;
    const source = audio.querySelector('source') || audio.appendChild(document.createElement('source'));
    source.src = track.src;
    source.type = track.type || 'audio/mpeg';
    audio.load();
    musicSelect.value = String(index);
    setTrackLabel(track);
    if (shouldPlay) audio.play().then(() => { isPlaying = true; toggle.innerHTML = '<i class="fas fa-pause"></i>'; }).catch(() => {});
  };

  toggle.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      toggle.innerHTML = '<i class="fas fa-music"></i>';
      isPlaying = false;
      return;
    }
    audio.play().then(() => {
      toggle.innerHTML = '<i class="fas fa-pause"></i>';
      isPlaying = true;
    }).catch(() => {});
  });

  musicSelect.addEventListener('change', (event) => loadTrack(parseInt(event.target.value, 10), isPlaying));
  volRange.addEventListener('input', (event) => {
    audio.volume = parseFloat(event.target.value);
    localStorage.setItem('volume', String(audio.volume));
  });
  volDown?.addEventListener('click', () => {
    audio.volume = Math.max(0, audio.volume - 0.1);
    volRange.value = audio.volume;
    localStorage.setItem('volume', String(audio.volume));
  });
  volUp?.addEventListener('click', () => {
    audio.volume = Math.min(1, audio.volume + 0.1);
    volRange.value = audio.volume;
    localStorage.setItem('volume', String(audio.volume));
  });
  panelToggle?.addEventListener('click', () => {
    const opened = musicControls.classList.toggle('open');
    musicControls.setAttribute('aria-hidden', (!opened).toString());
    panelToggle.setAttribute('aria-pressed', opened.toString());
  });
  audio.addEventListener('ended', () => loadTrack((currentIndex + 1) % playlist.length, true));

  loadTrack(0, false);
}
