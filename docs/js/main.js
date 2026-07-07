// ============================================
// IMPORTAÇÃO
// ============================================
import { terminalTexts } from './data/terminalTexts.js';
import { parseMarkdown, interpolate, processText } from './markdown.js';
import { checkAuth, login, logout, getCurrentUser, getCurrentToken, getApiBase, isAuthenticated } from './auth.js';

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  dataPath: '',
  terminalSpeed: 80,
  terminalDelay: 2000,
  scrollThreshold: 0.1,
  githubUsername: 'Densuki',
  discordId: '568923940768972808',
  defaultVolume: 0.5,
};

function resolveDataBaseUrl() {
  const scriptTag = document.querySelector('script[src*="main.js"]');
  if (scriptTag?.src) {
    return new URL('.', scriptTag.src).href;
  }
  return new URL('./', window.location.href).href;
}

// ============================================
// CARREGAR DADOS DOS JSONS
// ============================================
async function fetchJSON(path) {
  const resource = path.replace(/^\.?\//, '');
  const candidates = [];

  // Obter o caminho base da página atual
  const basePath = window.location.pathname;
  const isInSubdir = basePath.includes('/Densuki/') || basePath.includes('/Densuki');
  
  // Caminhos baseados na localização dos arquivos (docs/data/)
  if (isInSubdir) {
    candidates.push(new URL(`data/${resource}`, window.location.href).toString());
    candidates.push(new URL(`./data/${resource}`, window.location.href).toString());
    candidates.push(new URL(`../data/${resource}`, window.location.href).toString());
  } else {
    candidates.push(new URL(`data/${resource}`, window.location.href).toString());
    candidates.push(new URL(`./data/${resource}`, window.location.href).toString());
    candidates.push(new URL(`../data/${resource}`, window.location.href).toString());
  }
  
  candidates.push(new URL(`/Densuki/data/${resource}`, window.location.origin).toString());
  candidates.push(new URL(`/data/${resource}`, window.location.origin).toString());
  
  if (CONFIG.dataPath) {
    candidates.push(new URL(resource, CONFIG.dataPath).toString());
  }

  candidates.push(new URL(`./${resource}`, window.location.href).toString());

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      return data;
    } catch (err) {
      // Silenciosamente tenta o próximo
    }
  }

  console.warn(`⚠️ Não foi possível carregar ${resource}`);
  return null;
}

async function loadData() {
  try {
    const [books, cache, certificates, courses, current, games, music, profile, projects, statistics] = await Promise.all([
      fetchJSON('books.json'),
      fetchJSON('cache.json'),
      fetchJSON('certificates.json'),
      fetchJSON('courses.json'),
      fetchJSON('current.json').catch(() => null),
      fetchJSON('games.json'),
      fetchJSON('music.json'),
      fetchJSON('profile.json'),
      fetchJSON('projects.json'),
      fetchJSON('statistics.json'),
    ]);

    return { books, cache, certificates, courses, current, games, music, profile, projects, statistics };
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return null;
  }
}

// ============================================
// UTILITÁRIOS
// ============================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function isShown(profile, key) {
  if (!profile || !profile.show) return true;
  return !(profile.show[key] === false);
}

function safeGet(profile, key) {
  if (!profile) return '';
  return profile[key] || '';
}

function getStatusLabel(status) {
  const labels = {
    'completed': '✅ Concluído',
    'in-progress': '🔄 Em andamento',
    'planned': '📋 Planejado',
    'playing': '🎮 Jogando',
    'reading': '📖 Lendo',
    'watching': '👀 Assistindo',
  };
  return labels[status] || status;
}

// ============================================
// RENDERIZAR FOOTER
// ============================================
function renderFooter(profile) {
  const container = $('#footer-content');
  if (!container) return;

  const year = new Date().getFullYear();
  const name = profile?.name || 'João Gabriel';
  const quote = profile?.quote || '"É por isso que não sabem quem são. Nós sabemos quem somos e por isso não precisamos de nomes."';
  const quoteAuthor = profile?.quoteAuthor || 'gato, CORALINE';

  container.innerHTML = `
    <p>
      <i class="fas fa-crown"></i>
      Feito com <i class="fas fa-heart" style="color: #8b5cf6;"></i> 
      por <strong><em>${name}</em></strong> — ${year}
    </p>
    <p class="footer-quote">
      <em>"${quote}"</em> — ${quoteAuthor}
    </p>
    <div class="footer-links">
      <a href="#hero"><i class="fas fa-arrow-up"></i> Voltar ao topo</a>
    </div>
  `;
}

// ============================================
// RENDERIZAR SOBRE (USANDO MARKDOWN)
// ============================================
function renderAbout(profile) {
  const aboutText = $('#about-text');
  if (!aboutText) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  function safeField(key) {
    if (!profile) return '';
    return profile[key] || '';
  }

  let aboutHtml = '';

  if (flag('bio') && Array.isArray(profile?.bio) && profile.bio.length > 0) {
    aboutHtml = profile.bio.map(line => `<p>${processText(line, profile)}</p>`).join('');
  } else {
    const parts = [];
    const name = safeField('name') || 'João Gabriel';
    parts.push(`Olá! 👋 Me chamo <strong>${name}</strong>`);

    if (flag('birthday') && safeField('birthday')) {
      parts.push(`nascido em ${safeField('birthday')}`);
    } else if (flag('age') && safeField('age')) {
      parts.push(`tenho <span id="age">${safeField('age')}</span> anos`);
    }

    if (flag('location') && safeField('location')) {
      parts.push(`e sou <strong>${safeField('location')}</strong>`);
    }

    const bioText = (typeof profile?.bio === 'string' && profile.bio) ? processText(profile.bio, profile) : '';
    if (bioText) parts.push(bioText);

    if (flag('hobbies') && Array.isArray(profile?.hobbies) && profile.hobbies.length > 0) {
      parts.push(`Por hobby, ${profile.hobbies.join(' e ')}.`);
    }
    if (flag('interests') && Array.isArray(profile?.interests) && profile.interests.length > 0) {
      parts.push(`Interesses: ${profile.interests.slice(0, 5).join(', ')}.`);
    }

    aboutHtml = `<p>${parts.join(' • ')}</p>`;
  }

  aboutText.innerHTML = aboutHtml;

  const skillsContainer = $('#skills-container');
  if (skillsContainer && profile?.skills) {
    skillsContainer.innerHTML = `
      <h3>⚡ Habilidades</h3>
      <div class="skills-grid">
        ${Object.entries(profile.skills).map(([category, items]) => `
          <div class="skill-category">
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="skill-tags">
              ${items.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (skillsContainer) {
    skillsContainer.style.display = flag('skills') ? '' : 'none';
  }
}

// ============================================
// RENDERIZAR CONTATO
// ============================================
function renderContact(profile) {
  const container = $('#contact-content');
  if (!container || !profile) return;

  const social = profile.social || {};
  const email = profile.email || 'joaogabriel4175@gmail.com';

  container.innerHTML = `
    <p class="contact-message">
      ✨ ${profile.contactMessage || 'Gosta de código, arte ou histórias? Vamos trocar uma ideia!'}
    </p>
    <div class="social-links">
      ${profile.show && profile.show.social === false ? '' : (social.github ? `<a href="${social.github}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub"><i class="fab fa-github"></i></a>` : '')}
      ${profile.show && profile.show.social === false ? '' : (social.linkedin ? `<a href="${social.linkedin}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>` : '')}
      ${profile.show && profile.show.social === false ? '' : (social.instagram ? `<a href="${social.instagram}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>` : '')}
      ${profile.show && profile.show.social === false ? '' : (social.discord ? `<a href="${social.discord}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Discord"><i class="fab fa-discord"></i></a>` : '')}
    </div>
    <div class="contact-email">
      <i class="fas fa-envelope"></i>
      ${profile.show && profile.show.email === false ? '' : `<a href="mailto:${email}">${email}</a>`}
    </div>
  `;
}

// ============================================
// RENDERIZAR GITHUB STATS
// ============================================
function renderGitHubStats() {
  const container = $('#github-stats');
  if (!container) return;

  const username = CONFIG.githubUsername;

  container.innerHTML = `
    <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">
      <img src="https://github-stats-extended.vercel.app/api?username=${username}&show_icons=true&locale=pt-br&show=discussions_started,discussions_answered&hide=prs,contribs&count_private=true&theme=aura&hide_border=true" alt="GitHub Stats">
    </a>
    <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">
      <img src="https://github-stats-extended.vercel.app/api/top-langs?username=${username}&layout=compact&langs_count=6&locale=pt-br&theme=aura&hide_border=true" alt="Top Languages">
    </a>
    <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">
      <img src="https://github-readme-streak-stats.herokuapp.com?user=${username}&locale=pt-br&theme=aura&hide_border=true" alt="Streak Stats">
    </a>
  `;
}

// ============================================
// RENDERIZAR DISCORD
// ============================================
function renderDiscord() {
  const container = $('#discord-container');
  if (!container) return;

  const discordId = CONFIG.discordId;

  container.innerHTML = `
<a href="https://discord.com/users/${discordId}"><img src="https://lanyard.kyrie25.dev/api/${discordId}?animatedDecoration=true&showDisplayName=true&forceGradient=false&showBanner=animated&imgStyle=circle&theme=dark&idleMessage=%F0%9F%8C%8C%20Nem%20toda%20aus%C3%AAncia%20%C3%A9%20dist%C3%A2ncia%3B%20%C3%A0s%20vezes%20%C3%A9%20apenas%20um%20momento%20de%20reflex%C3%A3o." /></a>
  `;
}

// ============================================
// RENDERIZAR PROJETOS
// ============================================
function renderProjects(projects) {
  const container = $('#project-list');
  if (!container) return;

  if (!projects || projects.length === 0) {
    container.innerHTML = `<p class="empty-message">📭 Nenhum projeto cadastrado ainda.</p>`;
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card glass-card">
      <div class="project-image">
        <img src="${project.image || 'assets/img/default-project.jpg'}" alt="${project.title}">
        <span class="project-status status-${project.status}">${getStatusLabel(project.status)}</span>
      </div>
      <div class="project-content">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-tech">
          ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        <div class="project-links">
          ${project.url && project.url !== '#' ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Ver Demo</a>` : ''}
          ${project.repo && project.repo !== '#' ? `<a href="${project.repo}" target="_blank" rel="noopener noreferrer" class="btn-small">📂 GitHub</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// RENDERIZAR CERTIFICADOS
// ============================================
function renderCertificates(certificates) {
  const container = $('#certificates-list');
  if (!container) return;

  if (!certificates || certificates.length === 0) {
    container.innerHTML = `<p class="empty-message">📭 Nenhum certificado cadastrado ainda.</p>`;
    return;
  }

  container.innerHTML = certificates.map(cert => `
    <div class="certificate-card glass-card">
      <div class="certificate-icon">🏆</div>
      <div class="certificate-content">
        <h4>${cert.name}</h4>
        <p class="cert-institution">${cert.institution}</p>
        <p class="cert-date">📅 ${cert.date}</p>
        ${cert.description ? `<p class="cert-description">${cert.description}</p>` : ''}
        ${cert.link && cert.link !== '#' ? `<a href="${cert.link}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Ver Certificado</a>` : ''}
      </div>
    </div>
  `).join('');
}

// ============================================
// RENDERIZAR CURSOS
// ============================================
function renderCourses(courses) {
  const container = $('#courses-list');
  if (!container) return;

  if (!courses || courses.length === 0) {
    container.innerHTML = `<p class="empty-message">📭 Nenhum curso cadastrado ainda.</p>`;
    return;
  }

  container.innerHTML = courses.map(course => `
    <div class="course-card glass-card">
      <div class="course-header">
        <span class="course-status status-${course.status}">${getStatusLabel(course.status)}</span>
        <span class="course-category">${course.category || 'Geral'}</span>
      </div>
      <div class="course-content">
        <h4>${course.name}</h4>
        <p class="course-platform">📚 ${course.platform} ${course.instructor ? `- ${course.instructor}` : ''}</p>
        ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
        ${course.progress !== undefined ? `
          <div class="course-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${course.progress}%"></div>
            </div>
            <span class="progress-text">${course.progress}%</span>
          </div>
        ` : ''}
        ${course.url && course.url !== '#' ? `<a href="${course.url}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Ver Curso</a>` : ''}
      </div>
    </div>
  `).join('');
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================
function updateStats(projects, certificates, courses) {
  const projectsCount = $('#projects-count');
  const certificatesCount = $('#certificates-count');
  const coursesCount = $('#courses-count');

  if (projectsCount) projectsCount.textContent = projects?.length || 0;
  if (certificatesCount) certificatesCount.textContent = certificates?.length || 0;
  if (coursesCount) coursesCount.textContent = courses?.length || 0;
}

// ============================================
// TYPEWRITER EFFECT
// ============================================
function typewriterEffect() {
  const terminalElement = $('#terminal-text');
  if (!terminalElement) return;
  
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let currentText = '';

  function type() {
    const fullText = terminalTexts[textIndex];

    if (!isDeleting) {
      currentText = fullText.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === fullText.length) {
        isDeleting = true;
        setTimeout(type, CONFIG.terminalDelay);
        return;
      }
    } else {
      currentText = fullText.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        textIndex = Math.floor(Math.random() * terminalTexts.length);
        setTimeout(type, 500);
        return;
      }
    }

    terminalElement.textContent = currentText;
    setTimeout(type, CONFIG.terminalSpeed);
  }

  type();
}

// ============================================
// THEME TOGGLE
// ============================================
function initThemeToggle() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    toggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.body.classList.remove('light-mode');
    toggle.innerHTML = '<i class="fas fa-moon"></i>';
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    toggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

// ============================================
// MUSIC TOGGLE
// ============================================
function initMusicToggle() {
  const toggle = $('#music-toggle');
  const audio = $('#bg-music');
  if (!toggle || !audio) return;

  let isPlaying = false;

  const source = audio.querySelector('source');
  if (source && source.src) {
    fetch(source.src)
      .then(res => {
        if (!res.ok) {
          toggle.style.display = 'none';
        }
      })
      .catch(() => {
        toggle.style.display = 'none';
      });
  }

  toggle.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      toggle.innerHTML = '<i class="fas fa-music"></i>';
      isPlaying = false;
    } else {
      audio.play().catch(() => {});
      toggle.innerHTML = '<i class="fas fa-pause"></i>';
      isPlaying = true;
    }
  });
}

// ============================================
// MUSIC PLAYER
// ============================================
function initMusicPlayer(profile) {
  const audio = $('#bg-music');
  const volRange = $('#volume-range');
  const volDown = $('#vol-down');
  const volUp = $('#vol-up');
  const musicSelect = $('#music-select');
  const musicControls = $('#music-controls');
  const currentTrack = $('#current-track');
  const panelToggle = $('#music-panel-toggle');

  if (!audio || !musicControls || !volRange || !musicSelect) return;

  const playlist = (profile && Array.isArray(profile.music)) ? profile.music : [];
  musicSelect.innerHTML = playlist.map((t, i) => `<option value="${i}">${t.title || t.src}</option>`).join('');

  const savedVol = parseFloat(localStorage.getItem('volume'));
  const initialVol = !Number.isNaN(savedVol) ? savedVol : CONFIG.defaultVolume;
  audio.volume = initialVol;
  volRange.value = initialVol;

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    audio.querySelector('source').src = track.src;
    audio.load();
    currentTrack.textContent = track.title || track.src.split('/').pop();
  }

  musicSelect.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    loadTrack(idx);
    audio.play().catch(() => {});
  });

  volRange.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    audio.volume = v;
    localStorage.setItem('volume', String(v));
  });

  volDown.addEventListener('click', () => {
    let v = Math.max(0, audio.volume - 0.1);
    audio.volume = v;
    volRange.value = v;
    localStorage.setItem('volume', String(v));
  });

  volUp.addEventListener('click', () => {
    let v = Math.min(1, audio.volume + 0.1);
    audio.volume = v;
    volRange.value = v;
    localStorage.setItem('volume', String(v));
  });

  if (profile && profile.show && profile.show.music === false) {
    if (musicControls) musicControls.style.display = 'none';
    if (panelToggle) panelToggle.style.display = 'none';
  } else {
    if (panelToggle) {
      panelToggle.addEventListener('click', () => {
        const opened = musicControls.classList.toggle('open');
        musicControls.setAttribute('aria-hidden', (!opened).toString());
        panelToggle.setAttribute('aria-pressed', opened.toString());
      });
    }
  }

  if (playlist.length > 0) {
    const first = 0;
    musicSelect.value = String(first);
    loadTrack(first);
  }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: CONFIG.scrollThreshold,
    rootMargin: '0px 0px -50px 0px',
  });

  const elements = $$('.glass-card, .project-card, .certificate-card, .course-card, .section');
  elements.forEach(el => {
    el.classList.add('fade-hidden');
    observer.observe(el);
  });
}

// ============================================
// MOBILE NAVBAR
// ============================================
function initMobileNav() {
  const hamburger = $('#hamburger');
  const navLinks = $('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

// ============================================
// SCROLL INDICATOR
// ============================================
function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      indicator.classList.add('hidden');
    } else {
      indicator.classList.remove('hidden');
    }
  });
}

// ============================================
// HERO
// ============================================
function renderHero(profile, current) {
  const nameEl = $('#name');
  const roleEl = $('#role');
  const statusEl = $('#status-text');

  if (nameEl) nameEl.textContent = profile?.name || 'João Gabriel';
  if (roleEl) roleEl.textContent = profile?.role || 'Desenvolvedor Full Stack & Artista';

  if (statusEl && current?.currentlyWorkingOn) {
    statusEl.textContent = `🚀 Trabalhando em: ${current.currentlyWorkingOn.project}`;
  } else if (statusEl) {
    statusEl.textContent = '✨ Disponível para novos projetos';
  }
}

// ============================================
// VISIBILIDADE
// ============================================
function applyVisibility(profile) {
  if (!profile || !profile.show) return;
  if (profile.show.projects === false) {
    const sec = document.getElementById('projects');
    if (sec) sec.style.display = 'none';
  }
  if (profile.show.certificates === false) {
    const sec = document.getElementById('certificates');
    if (sec) sec.style.display = 'none';
  }
  if (profile.show.courses === false) {
    const sec = document.getElementById('courses');
    if (sec) sec.style.display = 'none';
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function init() {
  console.log('🚀 Inicializando Densuki Portfolio...');

  const data = await loadData();
  if (!data) {
    console.error('❌ Falha ao carregar dados');
    return;
  }

  const { profile, projects, certificates, courses, statistics, current } = data;

  renderHero(profile, current);
  renderAbout(profile);
  renderFooter(profile);
  renderContact(profile);
  renderGitHubStats();
  renderDiscord();
  renderProjects(projects);
  renderCertificates(certificates);
  renderCourses(courses);
  updateStats(projects, certificates, courses);

  applyVisibility(profile);

  typewriterEffect();
  initThemeToggle();
  initMusicToggle();
  initMusicPlayer(profile);
  initScrollAnimations();
  initMobileNav();
  initSmoothScroll();
  initScrollIndicator();

  console.log('✅ Portfolio carregado com sucesso!');
}

async function initPageFooter() {
  try {
    const data = await loadData();
    if (data?.profile) {
      renderFooter(data.profile);
      initMusicPlayer(data.profile);
    }
    initThemeToggle();
    initMusicToggle();
    initMobileNav();
    initSmoothScroll();
  } catch (error) {
    console.error('❌ Erro ao carregar footer:', error);
  }
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('about-text')) {
    init();
  } else {
    initPageFooter();
  }
});

window.addEventListener('error', (e) => {
  console.error('❌ Erro no portfolio:', e.message);
});

// ============================================
// EXPORTAÇÕES PARA OUTROS MÓDULOS
// ============================================
export {
    CONFIG,
    $,
    $$,
    getStatusLabel,
    renderFooter,
    initThemeToggle,
    initMusicToggle,
    initMobileNav,
    initSmoothScroll,
    interpolate,
    parseMarkdown,
    processText
};