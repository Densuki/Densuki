// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  dataPath: 'data/',
  terminalSpeed: 80,
  terminalDelay: 2000,
  scrollThreshold: 0.1,
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
// 2. PREENCHER HERO SECTION
// ============================================
function renderHero(profile, current) {
  // Nome
  $('#name').textContent = profile.name || 'João Gabriel';
  
  // Role (descrição)
  $('#role').textContent = profile.role || 'Desenvolvedor Full Stack & Artista';
  
  // Status Badge
  if (current?.currentlyWorkingOn) {
    $('#status-text').textContent = `🚀 Trabalhando em: ${current.currentlyWorkingOn.project}`;
  }
  
  // Idade (se tiver no profile)
  if (profile.age) {
    const ageElements = document.querySelectorAll('#age');
    ageElements.forEach(el => el.textContent = profile.age);
  }
}

// ============================================
// 3. TERMINAL TYPEWRITER EFFECT
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
// 4. RENDERIZAR PROJETOS
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
// 5. RENDERIZAR CERTIFICADOS
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
// 6. RENDERIZAR CURSOS
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
// 7. ATUALIZAR ESTATÍSTICAS (About Section)
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
// 8. HELPER - Status Labels
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
// 9. THEME TOGGLE (Dark/Light)
// ============================================
function initThemeToggle() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;
  
  // Verifica preferência salva
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
// 10. MUSIC TOGGLE
// ============================================
function initMusicToggle() {
  const toggle = $('#music-toggle');
  const audio = $('#bg-music');
  if (!toggle || !audio) return;
  
  let isPlaying = false;
  
  // Verifica se o áudio existe
  fetch(audio.querySelector('source').src)
    .then(res => {
      if (!res.ok) {
        toggle.style.display = 'none';
        console.log('ℹ️ Áudio não encontrado, botão oculto');
      }
    })
    .catch(() => {
      toggle.style.display = 'none';
    });
  
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
// 11. SCROLL ANIMATIONS (Intersection Observer)
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
  
  // Observa todos os cards e seções
  const elements = $$('.glass-card, .project-card, .certificate-card, .course-card, .section');
  elements.forEach(el => {
    el.classList.add('fade-hidden');
    observer.observe(el);
  });
}

// ============================================
// 12. MOBILE NAVBAR (Hamburger)
// ============================================
function initMobileNav() {
  const hamburger = $('#hamburger');
  const navLinks = $('.nav-links');
  if (!hamburger || !navLinks) return;
  
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
  });
  
  // Fecha menu ao clicar em um link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
}

// ============================================
// 13. SMOOTH SCROLL
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
// 14. SCROLL INDICATOR
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
// 15. INICIALIZAÇÃO PRINCIPAL
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
// START - Executa quando o DOM estiver pronto
// ============================================
document.addEventListener('DOMContentLoaded', init);

// Fallback se algo der errado
window.addEventListener('error', (e) => {
  console.error('❌ Erro no portfolio:', e.message);
});