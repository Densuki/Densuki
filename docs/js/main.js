// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  dataPath: 'data/',
  terminalSpeed: 80,
  terminalDelay: 2000,
  scrollThreshold: 0.1,
  githubUsername: 'Densuki',
  discordId: '568923940768972808',
};

// ============================================
// UTILITÁRIOS
// ============================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ============================================
// 1. CARREGAR DADOS DOS JSONS
// ============================================
async function loadData() {
  try {
    const [profile, projects, certificates, courses, statistics, current] = await Promise.all([
      fetch(`${CONFIG.dataPath}profile.json`).then(r => r.json()),
      fetch(`${CONFIG.dataPath}projects.json`).then(r => r.json()),
      fetch(`${CONFIG.dataPath}certificates.json`).then(r => r.json()),
      fetch(`${CONFIG.dataPath}courses.json`).then(r => r.json()),
      fetch(`${CONFIG.dataPath}statistics.json`).then(r => r.json()),
      fetch(`${CONFIG.dataPath}current.json`).then(r => r.json()).catch(() => null),
    ]);

    return { profile, projects, certificates, courses, statistics, current };
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return null;
  }
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
      por <strong>${name}</strong> — ${year}
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
  // Texto do About
  const aboutText = $('#about-text');
  if (aboutText && profile) {
    aboutText.innerHTML = `
      <p>
        Olá! 👋 Me chamo <strong>${profile.name || 'João Gabriel'}</strong>, 
        tenho <span id="age">${profile.age || '26'}</span> anos 
        e sou <strong>${profile.location || 'Brasileiro'}</strong>. 
        ${profile.bio || 'Sou uma pessoa animada, um pouco introvertida 😅, mas muito comunicativa quando me acostumo com o ambiente.'}
      </p>
      <p>
        ${profile.hobbies ? `Por hobby, ${profile.hobbies.join(' e ')}.` : 'Por hobby, costumo escrever e desenhar.'}
      </p>
      <p>
        ${profile.interests ? `Amante de ${profile.interests.slice(0, 3).join(', ')} e também tenho grande interesse em mais áreas.` : 'Amante de Games e Animes, também tenho grande interesse em I.A. e tecnologias.'}
      </p>
    `;
  }

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
      ${social.github ? `<a href="${social.github}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub"><i class="fab fa-github"></i></a>` : ''}
      ${social.linkedin ? `<a href="${social.linkedin}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>` : ''}
      ${social.instagram ? `<a href="${social.instagram}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>` : ''}
      ${social.discord ? `<a href="${social.discord}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Discord"><i class="fab fa-discord"></i></a>` : ''}
    </div>
    <div class="contact-email">
      <i class="fas fa-envelope"></i>
      <a href="mailto:${email}">${email}</a>
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
      <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&locale=pt-br&show=discussions_started,discussions_answered&hide=prs,contribs&count_private=true&theme=aura&hide_border=true" alt="GitHub Stats">
    </a>
    <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">
      <img src="https://github-readme-stats.vercel.app/api/top-langs?username=${username}&layout=compact&langs_count=6&locale=pt-br&theme=aura&hide_border=true" alt="Top Languages">
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
    <a href="https://discord.com/users/${discordId}" target="_blank" rel="noopener noreferrer">
      <img src="https://lanyard.kyrie25.me/api/${discordId}?useDisplayName=true&imgStyle=square&imgBorderRadius=15px&waveColor=8b5cf6&waveSpotifyColor=6d28d9" alt="Discord Presence">
    </a>
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

// ============================================
// 12. TERMINAL TYPEWRITER
// ============================================
function typewriterEffect() {
  const terminalTexts = [
    'Full Stack Developer',
    'Artista & Mangaká',
    'Criador de Mundos',
    'Amante de Games',
    'Frontend & Backend'
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
        textIndex = (textIndex + 1) % terminalTexts.length;
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

  // Inicia efeitos
  typewriterEffect();
  initThemeToggle();
  initMusicToggle();
  initScrollAnimations();
  initMobileNav();
  initSmoothScroll();
  initScrollIndicator();

  console.log('✅ Portfolio carregado com sucesso!');
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('error', (e) => {
  console.error('❌ Erro no portfolio:', e.message);
});