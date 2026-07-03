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

CONFIG.dataPath = new URL('./data/', resolveDataBaseUrl()).href;

// ============================================
// UTILITÁRIOS
// ============================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// helper: verifica flag de exibição no profile.show (default true)
function isShown(profile, key) {
  if (!profile || !profile.show) return true;
  return !(profile.show[key] === false);
}

// helper: retorna campo seguro ou ''
function safeGet(profile, key) {
  if (!profile) return '';
  return profile[key] || '';
}

// ============================================
// 1. CARREGAR DADOS DOS JSONS
// ============================================
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

async function fetchJSON(path) {
  const resource = path.replace(/^\.?\//, '');
  const candidates = [];

  if (CONFIG.dataPath) {
    candidates.push(new URL(resource, CONFIG.dataPath).toString());
  }

  candidates.push(new URL(`./data/${resource}`, window.location.href).toString());
  candidates.push(new URL(`../data/${resource}`, window.location.href).toString());

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      return await res.json();
    } catch (err) {
      console.warn(`⚠️ Falha ao carregar ${url}:`, err.message);
    }
  }

  console.error(`❌ Não foi possível carregar ${resource}`);
  return null;
}

// ============================================
// 2. RENDERIZAR FOOTER
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
// 3. RENDERIZAR SOBRE (About)
// ============================================
function renderAbout(profile) {
  // Texto do About (construído de forma declarativa, sem sobrescrita)
  const aboutText = $('#about-text');
  if (!aboutText) return;

  function flag(key) {
    // se não definido, assume true para compatibilidade
    return !(profile && profile.show && profile.show[key] === false);
  }

  function safeField(key) {
    if (!profile) return '';
    return profile[key] || '';
  }

  // montar conteúdo principal de forma única
  let aboutHtml = '';

  // se houver bio como array e flag habilitada, mostrar lista bonita
  if (flag('bio') && Array.isArray(profile?.bio) && profile.bio.length > 0) {
    aboutHtml = profile.bio.map(line => `<p>${interpolate(line, profile)}</p>`).join('');
  } else {
    // fallback: parágrafo condensado com campos disponíveis e respeitando flags
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

    const bioText = (typeof profile?.bio === 'string' && profile.bio) ? interpolate(profile.bio, profile) : '';
    if (bioText) parts.push(bioText);

    // hobbies/interests (opcionais)
    if (flag('hobbies') && Array.isArray(profile?.hobbies) && profile.hobbies.length > 0) {
      parts.push(`Por hobby, ${profile.hobbies.join(' e ')}.`);
    }
    if (flag('interests') && Array.isArray(profile?.interests) && profile.interests.length > 0) {
      parts.push(`Interesses: ${profile.interests.slice(0, 5).join(', ')}.`);
    }

    aboutHtml = `<p>${parts.join(' • ')}</p>`;
  }

  aboutText.innerHTML = aboutHtml;

  // Skills
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

  // esconder skills se flag desabilitada
  if (skillsContainer) {
    skillsContainer.style.display = flag('skills') ? '' : 'none';
  }
}

// ============================================
// 4. RENDERIZAR CONTATO (Contact)
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
// 5. RENDERIZAR GITHUB STATS
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
// 6. RENDERIZAR DISCORD PRESENCE
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
// 7. RENDERIZAR PROJETOS
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
// 8. RENDERIZAR CERTIFICADOS
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
// 9. RENDERIZAR CURSOS
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
// 10. ATUALIZAR ESTATÍSTICAS
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
// 11. HELPERS
// ============================================
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

// helper: interpolates {{key}} placeholders using profile fields
function interpolate(template, profile) {
  if (!template || typeof template !== 'string') return template;
  // supports nested paths like locations.city and optional modifier: {{path|escape}}
  function getByPath(obj, path) {
    return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), obj);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return template.replace(/{{\s*([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?}}/g, (match, path, modifier) => {
    const keyPath = path.trim();
    if (!profile) return '';
    const val = getByPath(profile, keyPath);
    if (val === undefined || val === null) return '';
    const out = Array.isArray(val) ? val.join(', ') : String(val);
    if (modifier && modifier.trim() === 'escape') return escapeHtml(out);
    return out; // default: raw (preserve HTML)
  });
}

// ============================================
// 12. TERMINAL TYPEWRITER
// ============================================
function typewriterEffect() {
  const terminalTexts = [
    '💻 Desenvolvedor Web ',
    '🎨 Artista Digital ',
    '🎨 Artista & Mangaká ',
    '🌍 Criador de Mundos ',
    '📖 Escritor de histórias ',
    '🎮 Amante de Games ',
    '💜 Amante da Cultura Japonesa ',
    '💜 Amante de Animes ',
    '📖 Seguidor da Palavra de Jeová ',
    '💻 Frontend & Backend ',
    '🌿 Prefiro perder pela verdade do que vencer pela mentira ',
    '🌟 Minha maior qualidade não é o que faço, mas como escolho agir ',
    '📖 A verdade guia minhas palavras; o caráter guia minhas escolhas ',
    '🌟 Que minhas atitudes falem tão alto quanto minhas palavras ',
    '🌟 Leal aos meus princípios. Verdadeiro com as pessoas ',
    '💜 A verdade guia minhas palavras; o caráter e a fé em Jeová guiam minhas escolhas ',
    '🌿 Lealdade começa onde a honestidade nunca termina ',
    '🌟 Transformando curiosidade em conhecimento ',
    '🎨 Expressando o que palavras não dizem ',
    '📖 Registrando mundos que só existem na imaginação ',
    '💻 Encontrando lógica no caos ',
    '🎹 Descobrindo emoções em cada nota ',
    '🌿 Prefiro perder pela verdade do que vencer pela mentira. Minha fé em Jeová vale mais que qualquer vitória ',
    '🌿 Lealdade começa onde a honestidade nunca termina — e minha fé em Jeová fortalece ambas ',
    '🌟 Minha maior qualidade não é o que faço, mas como escolho agir diante de Jeová e das pessoas ',
    '📖 A verdade guia minhas palavras; Jeová guia meu coração ',
    '📖 A verdade guia minhas palavras; o caráter e a fé em Jeová guiam minhas escolhas ',
    '📖 Que minhas atitudes honrem minha palavra e a Jeová ',
    '💜 Leal aos meus princípios, fiel a Jeová e verdadeiro com as pessoas ',
    '💜 Minha palavra é um compromisso; minha fé em Jeová, meu alicerce ',
    '💜 A verdade fortalece minha palavra; Jeová fortalece meu caráter ',
    '💜 Lealdade, honestidade e fé: valores que escolho viver diante de Jeová e das pessoas ',
    '💜 Que minha vida reflita a verdade que aprendo com Jeová ',
    '💜 Fiel à minha palavra, aos meus princípios e a Jeová ',
  ];

  const terminalElement = $('#terminal-text');
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
// 13. THEME TOGGLE
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
// 14. MUSIC TOGGLE
// ============================================
function initMusicToggle() {
  const toggle = $('#music-toggle');
  const audio = $('#bg-music');
  if (!toggle || !audio) return;

  let isPlaying = false;

  // Verifica se o áudio existe
  const source = audio.querySelector('source');
  if (source && source.src) {
    fetch(source.src)
      .then(res => {
        if (!res.ok) {
          toggle.style.display = 'none';
          console.log('ℹ️ Áudio não encontrado, botão oculto');
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
      audio.play().catch(() => {
        console.log('ℹ️ Áudio não disponível');
      });
      toggle.innerHTML = '<i class="fas fa-pause"></i>';
      isPlaying = true;
    }
  });
}

// ============================================
// 15. SCROLL ANIMATIONS
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
// 16. MOBILE NAVBAR
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
// 17. SMOOTH SCROLL
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
// 18. SCROLL INDICATOR
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
// 19. HERO - Status e Dados
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
// 20. INICIALIZAÇÃO PRINCIPAL
// ============================================
async function init() {
  console.log('🚀 Inicializando Densuki Portfolio...');

  // Carrega dados
  const data = await loadData();
  if (!data) {
    console.error('❌ Falha ao carregar dados');
    return;
  }

  const { profile, projects, certificates, courses, statistics, current } = data;

  // Renderiza tudo
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

  // aplica visibilidade das seções com base no profile.show
  applyVisibility(profile);

  // Inicia efeitos
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

// ============================================
// MUSIC PLAYER HANDLING
// ============================================
function initMusicPlayer(profile) {
  const audio = $('#bg-music');
  const volRange = $('#volume-range');
  const volDown = $('#vol-down');
  const volUp = $('#vol-up');
  const musicSelect = $('#music-select');
  const musicControls = $('#music-controls');
  const playerUI = $('#music-player-ui');
  const currentTrack = $('#current-track');
  const panelToggle = $('#music-panel-toggle');

  if (!audio || !musicControls || !volRange || !musicSelect) return;

  // populate playlist
  const playlist = (profile && Array.isArray(profile.music)) ? profile.music : [];
  musicSelect.innerHTML = playlist.map((t, i) => `<option value="${i}">${t.title || t.src}</option>`).join('');

  // set initial volume
  const savedVol = parseFloat(localStorage.getItem('volume'));
  const initialVol = !Number.isNaN(savedVol) ? savedVol : CONFIG.defaultVolume;
  audio.volume = initialVol;
  volRange.value = initialVol;

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    if (track.type === 'file' || !track.type) {
      audio.querySelector('source').src = track.src;
    } else if (track.type === 'link') {
      audio.querySelector('source').src = track.src;
    }
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

  // controls panel visibility behaviour (discreto)
  if (profile && profile.show && profile.show.music === false) {
    if (musicControls) musicControls.style.display = 'none';
    if (panelToggle) panelToggle.style.display = 'none';
  } else {
    // keep panel closed by default; allow toggle to open
    if (panelToggle) {
      panelToggle.addEventListener('click', () => {
        const opened = musicControls.classList.toggle('open');
        musicControls.setAttribute('aria-hidden', (!opened).toString());
        panelToggle.setAttribute('aria-pressed', opened.toString());
      });
    }
  }

  // load initial track if any
  if (playlist.length > 0) {
    const first = 0;
    musicSelect.value = String(first);
    loadTrack(first);
  }
}

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
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('error', (e) => {
  console.error('❌ Erro no portfolio:', e.message);
});