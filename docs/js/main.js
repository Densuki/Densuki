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
  imageBasePath: 'assets/img/',
  audioBasePath: 'assets/audio/',
  bannerBasePath: 'assets/img/banners/',
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

  const basePath = window.location.pathname;
  const isInSubdir = basePath.includes('/Densuki/') || basePath.includes('/Densuki');
  
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

function formatArray(arr, separator = ', ', maxItems = null) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 'Não informado';
  const items = maxItems ? arr.slice(0, maxItems) : arr;
  let result = items.join(separator);
  if (maxItems && arr.length > maxItems) {
    result += ` +${arr.length - maxItems} outros`;
  }
  return result;
}

function formatLanguages(langs) {
  if (!langs || !Array.isArray(langs) || langs.length === 0) return 'Não informado';
  return langs.map(lang => `${lang.name} (${lang.level})`).join(' • ');
}

// ============================================
// RENDERIZAR FOOTER
// ============================================
function renderFooter(profile) {
  const container = $('#footer-content');
  if (!container) return;

  const year = new Date().getFullYear();
  const name = profile?.identity?.name || profile?.name || 'João Gabriel';
  const quote = profile?.quote || '"É por isso que não sabem quem são. Nós sabemos quem somos e por isso não precisamos de nomes."';
  const quoteAuthor = profile?.quoteAuthor || 'gato, CORALINE';

  container.innerHTML = `
    <p>
      <i class="fas fa-crown"></i>
      Feito com <i class="fas fa-heart" style="color: #8b5cf6;"></i> 
      por <strong><em>${name}</em></strong> — ${year}
    </p>
    <p class="footer-quote">
      <em>${processText(quote, profile)}</em> — ${processText(quoteAuthor, profile)}
    </p>
    <div class="footer-links">
      <a href="#hero"><i class="fas fa-arrow-up"></i> Voltar ao topo</a>
    </div>
  `;
}

// ============================================
// RENDERIZAR MINI CARDS (SOBRE - ESTILO SIDEBAR)
// ============================================
function renderMiniCards(profile) {
  const container = $('#about-mini-cards');
  if (!container || !profile) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  let html = `
    <div class="mini-cards-wrapper glass-card">
      <h3 style="text-align: center; margin-bottom: 1.5rem; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <i class="fas fa-user-circle" style="color: var(--primary-light);"></i> 
        Informações Pessoais
      </h3>
      <div class="mini-cards-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
  `;

  // ==========================================
  // COLUNA ESQUERDA - Identidade e Status
  // ==========================================
  html += `<div class="mini-cards-column" style="display: flex; flex-direction: column; gap: 0.75rem;">`;

  // ----- IDENTIDADE -----
  if (profile.identity) {
    const identity = profile.identity;
    html += `
      <div class="mini-card-group">
        <div class="mini-card-group-title">
          <i class="fas fa-id-card"></i> IDENTIDADE
        </div>
        <div class="mini-card-group-items">
    `;

    if (identity.name) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Nome</span>
          <span class="mini-card-value">${identity.name}</span>
        </div>
      `;
    }
    if (identity.pronouns) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Pronomes</span>
          <span class="mini-card-value">${identity.pronouns}</span>
        </div>
      `;
    }
    if (identity.displayName) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Pseudônimo</span>
          <span class="mini-card-value">${identity.displayName}</span>
        </div>
      `;
    }
    if (identity.nickname) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Nick</span>
          <span class="mini-card-value">${identity.nickname}</span>
        </div>
      `;
    }
    if (identity.aliases && identity.aliases.length > 0) {
      html += `
        <div class="mini-card-item mini-card-item-tags">
          <span class="mini-card-label">Codinomes</span>
          <div class="mini-card-tags">
            ${identity.aliases.map(alias => `<span class="mini-card-tag">${alias}</span>`).join('')}
          </div>
        </div>
      `;
    }
    html += `
        </div>
      </div>
    `;
  }

  // ----- STATUS -----
  if (flag('status') && profile.status) {
    const status = profile.status;
    html += `
      <div class="mini-card-group">
        <div class="mini-card-group-title">
          <i class="fas fa-circle"></i> STATUS
        </div>
        <div class="mini-card-group-items">
    `;
    if (status.working) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">💼 Trabalho</span>
          <span class="mini-card-value">${status.working}</span>
        </div>
      `;
    }
    if (status.studying) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">📚 Estudando</span>
          <span class="mini-card-value">${status.studying}</span>
        </div>
      `;
    }
    if (status.learning && status.learning.length > 0) {
      html += `
        <div class="mini-card-item mini-card-item-tags">
          <span class="mini-card-label">📖 Aprendendo</span>
          <div class="mini-card-tags">
            ${status.learning.map(learn => `<span class="mini-card-tag">${learn}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (status.availableForWork !== undefined) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">🔍 Disponível para Emprego?</span>
          <span class="mini-card-value">${status.availableForWork ? '✅ Sim' : '❌ Não'}</span>
        </div>
      `;
    }
    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`; // Fecha coluna esquerda

  // ==========================================
  // COLUNA DIREITA - Localização e Nacionalidade
  // ==========================================
  html += `<div class="mini-cards-column" style="display: flex; flex-direction: column; gap: 0.75rem;">`;

  // ----- LOCALIZAÇÃO -----
  if (flag('location') && profile.location) {
    const loc = profile.location;
    html += `
      <div class="mini-card-group">
        <div class="mini-card-group-title">
          <i class="fas fa-map-marker-alt"></i> LOCALIZAÇÃO
        </div>
        <div class="mini-card-group-items">
    `;
    // Cidade
    if (loc.city) {
      const cityFlag = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Bandeira_de_Fortaleza.svg/960px-Bandeira_de_Fortaleza.svg.png"
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Cidade</span>
          <span class="mini-card-value">${loc.city}</span><img src="${cityFlag}" alt="Bandeira da Cidade de Fortaleza" width="20" height="15">
        </div>
      `;
    }

    // Estado
    if (loc.state) {
      const stateFlag = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Bandeira_do_Cear%C3%A1.svg/960px-Bandeira_do_Cear%C3%A1.svg.png"
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Estado</span>
          <span class="mini-card-value">${loc.state}</span><img src="${stateFlag}" alt="Bandeira do Estado do Ceará" width="20" height="15">
        </div>
      `;
    }

    // País
    if (loc.country) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">País</span>
          <span class="mini-card-value">${loc.country}</span><img src="${profile.flag}" alt="Bandeira do Brasil">
        </div>
      `;
    }
    html += `
        </div>
      </div>
    `;
  }

  // ----- NACIONALIDADE -----
  if (flag('nationality') && profile.nationality) {
    html += `
      <div class="mini-card-group">
        <div class="mini-card-group-title">
          <i class="fas fa-flag"></i> NACIONALIDADE
        </div>
        <div class="mini-card-group-items">
          <div class="mini-card-item mini-card-item-center">
            <span class="mini-card-value" style="text-align: center; width: 100%; font-size: 1rem; font-weight: 500;">
            ${profile.nationality}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // ----- OBJETIVO -----
  if (flag('objective') && profile.objective) {
    html += `
      <div class="mini-card-group">
        <div class="mini-card-group-title">
          <i class="fas fa-bullseye"></i> OBJETIVO
        </div>
        <div class="mini-card-group-items">
          <div class="mini-card-item mini-card-item-center">
            <span class="mini-card-value" style="text-align: center; width: 100%; font-size: 0.9rem;">
              ${profile.objective}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  html += `</div>`; // Fecha coluna direita
  html += `</div></div>`; // Fecha grid e wrapper

  container.innerHTML = html;
}

// ============================================
// RENDERIZAR PERSONALIDADE (SIDEBAR)
// ============================================
function renderPersonality(profile) {
  const container = $('#personality-container');
  if (!container || !profile) return;

  if (!profile.personality) {
    container.style.display = 'none';
    return;
  }

  const p = profile.personality;
  const traits = profile.traits || [];

  container.innerHTML = `
    <h3><i class="fas fa-brain"></i> Personalidade</h3>
    <div class="personality-grid">
      ${p.mbti ? `<div class="personality-item"><span class="personality-label">MBTI</span><span class="personality-value">${p.mbti}</span></div>` : ''}
      ${p.alignment ? `<div class="personality-item"><span class="personality-label">Alinhamento</span><span class="personality-value">${p.alignment}</span></div>` : ''}
      ${p.archetype ? `<div class="personality-item"><span class="personality-label">Arquétipo</span><span class="personality-value">${p.archetype}</span></div>` : ''}
      ${p.introvert !== undefined ? `<div class="personality-item"><span class="personality-label">Introvertido</span><span class="personality-value">${p.introvert ? '✅ Sim' : '❌ Não'}</span></div>` : ''}
    </div>
    ${traits.length > 0 ? `
      <div class="personality-traits">
        <span class="personality-label">Traços</span>
        <div class="traits-tags">${traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}</div>
      </div>
    ` : ''}
  `;
}

// ============================================
// RENDERIZAR SOBRE (USANDO MARKDOWN - BIO COMPLETA)
// ============================================
function renderAbout(profile) {
  const aboutText = $('#about-text');
  if (!aboutText) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  if (flag('bio') && profile?.bio) {
    let aboutHtml = '';
    
    function processBioLine(line, data) {
      if (typeof line !== 'string') return '';
      let processed = interpolate(line, data);
      processed = processed.replace(/\n/g, '');
      return processed;
    }

    if (Array.isArray(profile.bio)) {
      aboutHtml = profile.bio.map(line => {
        if (typeof line === 'string') {
          return processBioLine(line, profile);
        }
        return '';
      }).filter(line => line).join('');
    } else if (typeof profile.bio === 'string') {
      aboutHtml = processBioLine(profile.bio, profile);
    } else if (typeof profile.bio === 'object' && !Array.isArray(profile.bio)) {
      const sections = [];
      Object.entries(profile.bio).forEach(([key, content]) => {
        if (Array.isArray(content)) {
          const sectionContent = content.map(line => {
            if (typeof line === 'string') {
              return processBioLine(line, profile);
            }
            return '';
          }).filter(line => line).join('');
          if (sectionContent) {
            sections.push(sectionContent);
          }
        } else if (typeof content === 'string') {
          const processed = processBioLine(content, profile);
          if (processed) sections.push(processed);
        }
      });
      aboutHtml = sections.join('');
    }

    if (!aboutHtml || aboutHtml.trim() === '') {
      aboutHtml = '<p>Bio não disponível.</p>';
    }

    aboutText.innerHTML = aboutHtml;
  } else {
    const name = profile?.identity?.name || profile?.name || 'João Gabriel';
    aboutText.innerHTML = `<p>Olá! 👋 Me chamo <strong>${name}</strong>. Bem-vindo ao meu portfólio!</p>`;
  }
}

// ============================================
// RENDERIZAR IDIOMAS (SIDEBAR)
// ============================================
function renderLanguages(profile) {
  const container = $('#languages-container');
  if (!container || !profile) return;

  if (!profile.languages || profile.languages.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <h3><i class="fas fa-language"></i> Idiomas</h3>
    <div class="languages-list">
      ${profile.languages.map(lang => `
        <div class="language-item">
          <span class="language-name">${lang.name}</span>
          <span class="language-level">${lang.level}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================
// RENDERIZAR HARD SKILLS (SIDEBAR)
// ============================================
function renderHardSkills(profile) {
  const container = $('#hardskills-container');
  if (!container || !profile) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  if (!flag('hardSkills') || !profile.hardSkills) {
    container.style.display = 'none';
    return;
  }

  const categories = {
    'programming': { label: 'Programação', icon: 'fa-code', color: '#8b5cf6' },
    'frontend': { label: 'Front-end', icon: 'fa-laptop-code', color: '#3b82f6' },
    'backend': { label: 'Back-end', icon: 'fa-server', color: '#10b981' },
    'frameworks': { label: 'Frameworks', icon: 'fa-layer-group', color: '#f59e0b' },
    'libraries': { label: 'Bibliotecas', icon: 'fa-book', color: '#ef4444' },
    'database': { label: 'Banco de Dados', icon: 'fa-database', color: '#06b6d4' },
    'tools': { label: 'Ferramentas', icon: 'fa-tools', color: '#8b5cf6' },
    'office': { label: 'Pacote Office', icon: 'fa-file-alt', color: '#d83b01' },
    'design': { label: 'Design', icon: 'fa-paint-brush', color: '#ec4899' },
    'art': { label: 'Arte', icon: 'fa-palette', color: '#f472b6' }
  };

  let html = `
    <h3><i class="fas fa-code"></i> Hard Skills</h3>
    <div class="hardskills-grid">
  `;

  let hasSkills = false;

  Object.entries(categories).forEach(([key, cat]) => {
    const skills = profile.hardSkills[key];
    if (skills && Array.isArray(skills) && skills.length > 0) {
      hasSkills = true;
      html += `
        <div class="hardskill-category">
          <div class="hardskill-category-header">
            <span class="hardskill-category-icon"><i class="fas ${cat.icon}" style="color: ${cat.color};"></i></span>
            <span class="hardskill-category-label">${cat.label}</span>
            <span class="hardskill-category-count">${skills.length}</span>
          </div>
          <div class="hardskill-items">
            ${skills.map(skill => `
              <div class="hardskill-item" title="${skill.description || skill.name}" style="${skill.color ? `border-color: ${skill.color};` : ''}">
                ${skill.icon ? `<i class="${skill.icon}" style="color: ${skill.color || cat.color};"></i>` : ''}
                <span class="hardskill-name">${skill.name}</span>
                ${skill.isFavorite ? '<span class="hardskill-favorite">⭐</span>' : ''}
                ${skill.isLearning ? '<span class="hardskill-learning">📖</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  // Game Development
  if (profile.hardSkills.gameDevelopment) {
    const gameDev = profile.hardSkills.gameDevelopment;
    if (gameDev.minecraft && Array.isArray(gameDev.minecraft) && gameDev.minecraft.length > 0) {
      hasSkills = true;
      html += `
        <div class="hardskill-category">
          <div class="hardskill-category-header">
            <span class="hardskill-category-icon"><i class="fas fa-cubes" style="color: #2ECC71;"></i></span>
            <span class="hardskill-category-label">Minecraft</span>
            <span class="hardskill-category-count">${gameDev.minecraft.length}</span>
          </div>
          <div class="hardskill-items">
            ${gameDev.minecraft.map(skill => `
              <div class="hardskill-item" title="${skill.description || skill.name}">
                ${skill.icon ? `<i class="${skill.icon}" style="color: ${skill.color || '#2ECC71'};"></i>` : ''}
                <span class="hardskill-name">${skill.name}</span>
                ${skill.isFavorite ? '<span class="hardskill-favorite">⭐</span>' : ''}
                ${skill.isLearning ? '<span class="hardskill-learning">📖</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    if (gameDev.engines && Array.isArray(gameDev.engines) && gameDev.engines.length > 0) {
      hasSkills = true;
      html += `
        <div class="hardskill-category">
          <div class="hardskill-category-header">
            <span class="hardskill-category-icon"><i class="fas fa-gamepad" style="color: #9B59B6;"></i></span>
            <span class="hardskill-category-label">Game Engines</span>
            <span class="hardskill-category-count">${gameDev.engines.length}</span>
          </div>
          <div class="hardskill-items">
            ${gameDev.engines.map(skill => `
              <div class="hardskill-item" title="${skill.description || skill.name}">
                ${skill.icon ? `<i class="${skill.icon}" style="color: ${skill.color || '#9B59B6'};"></i>` : ''}
                <span class="hardskill-name">${skill.name}</span>
                ${skill.isFavorite ? '<span class="hardskill-favorite">⭐</span>' : ''}
                ${skill.isLearning ? '<span class="hardskill-learning">📖</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  html += `</div>`;
  if (!hasSkills) {
    html += `<p class="text-muted">Nenhuma hard skill cadastrada.</p>`;
  }
  container.innerHTML = html;
}

// ============================================
// RENDERIZAR SOFT SKILLS (SIDEBAR)
// ============================================
function renderSoftSkills(profile) {
  const container = $('#softskills-container');
  if (!container || !profile) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  if (!flag('softSkills') || !profile.softSkills || profile.softSkills.length === 0) {
    container.style.display = 'none';
    return;
  }

  const skills = profile.softSkills;
  const categories = {
    'Pessoais': ['Empatia', 'Honestidade', 'Persistência', 'Organização', 'Curiosidade', 'Criatividade', 'Autodidatismo'],
    'Interpessoais': ['Trabalho em equipe', 'Comunicação escrita', 'Liderança', 'Adaptabilidade'],
    'Analíticas': ['Pensamento analítico', 'Resolução de problemas', 'Aprendizado contínuo', 'Organização']
  };

  const categorized = {};
  Object.keys(categories).forEach(cat => {
    categorized[cat] = skills.filter(s => categories[cat].some(c => s.includes(c) || c.includes(s)));
  });

  const uncategorized = skills.filter(s => 
    !Object.values(categories).flat().some(c => s.includes(c) || c.includes(s))
  );

  let html = `
    <h3><i class="fas fa-handshake"></i> Soft Skills</h3>
    <div class="softskills-container">
  `;

  Object.entries(categorized).forEach(([cat, items]) => {
    if (items.length > 0) {
      html += `
        <div class="softskill-category">
          <span class="softskill-category-label">${cat}</span>
          <div class="softskill-tags">
            ${items.map(skill => `<span class="softskill-tag">${skill}</span>`).join('')}
          </div>
        </div>
      `;
    }
  });

  if (uncategorized.length > 0) {
    html += `
      <div class="softskill-category">
        <span class="softskill-category-label">Outras</span>
        <div class="softskill-tags">
          ${uncategorized.map(skill => `<span class="softskill-tag">${skill}</span>`).join('')}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
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
// RENDERIZAR DETALHES DO PERFIL (ESTILO HARD SKILLS COM CARROSSEL)
// ============================================
function renderProfileDetails(profile) {
  const container = $('#profile-details-content');
  if (!container || !profile) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
  }

  // ==========================================
  // HOBBIES - Estilo Soft Skills (tags)
  // ==========================================
  let hobbiesHtml = '';
  if (flag('hobbies') && profile.hobbies && profile.hobbies.length > 0) {
    hobbiesHtml = `
      <div class="profile-detail-slide">
        <div class="profile-detail-group">
          <div class="profile-detail-group-title">
            <i class="fas fa-heart"></i> HOBBIES
          </div>
          <div class="profile-detail-group-items">
            <div class="profile-detail-tags">
              ${profile.hobbies.map(h => `<span class="profile-detail-tag">${h}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // METAS - Estilo Hard Skills (categorias com header)
  // ==========================================
  let goalsHtml = '';
  if (profile.goals) {
    let goalsContent = '';
    if (profile.goals.shortTerm && profile.goals.shortTerm.length > 0) {
      goalsContent += `
        <div class="profile-detail-subgroup">
          <div class="profile-detail-subgroup-title">
            <i class="fas fa-clock" style="color: #f59e0b;"></i> Curto Prazo
          </div>
          <div class="profile-detail-tags">
            ${profile.goals.shortTerm.map(g => `<span class="profile-detail-tag">${g}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (profile.goals.longTerm && profile.goals.longTerm.length > 0) {
      goalsContent += `
        <div class="profile-detail-subgroup">
          <div class="profile-detail-subgroup-title">
            <i class="fas fa-flag" style="color: #10b981;"></i> Longo Prazo
          </div>
          <div class="profile-detail-tags">
            ${profile.goals.longTerm.map(g => `<span class="profile-detail-tag">${g}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (goalsContent) {
      goalsHtml = `
        <div class="profile-detail-slide">
          <div class="profile-detail-group">
            <div class="profile-detail-group-title">
              <i class="fas fa-flag-checkered"></i> METAS
            </div>
            <div class="profile-detail-group-items">
              ${goalsContent}
            </div>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // INTERESSES - Estilo Soft Skills (tags)
  // ==========================================
  let interestsHtml = '';
  if (profile.interests && profile.interests.length > 0) {
    interestsHtml = `
      <div class="profile-detail-slide">
        <div class="profile-detail-group">
          <div class="profile-detail-group-title">
            <i class="fas fa-star"></i> INTERESSES
          </div>
          <div class="profile-detail-group-items">
            <div class="profile-detail-tags">
              ${profile.interests.map(i => `<span class="profile-detail-tag">${i}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // VALORES & PRINCÍPIOS - Estilo Personalidade
  // ==========================================
  let valuesHtml = '';
  if ((profile.values && profile.values.length > 0) || (profile.principles && profile.principles.length > 0)) {
    let valuesContent = '';
    if (profile.values && profile.values.length > 0) {
      valuesContent += `
        <div class="profile-detail-personality-item">
          <span class="profile-detail-personality-label">Valores</span>
          <div class="profile-detail-tags">
            ${profile.values.map(v => `<span class="profile-detail-tag">${v}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (profile.principles && profile.principles.length > 0) {
      valuesContent += `
        <div class="profile-detail-personality-item">
          <span class="profile-detail-personality-label">Princípios</span>
          <div class="profile-detail-tags">
            ${profile.principles.map(p => `<span class="profile-detail-tag">${p}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (valuesContent) {
      valuesHtml = `
        <div class="profile-detail-slide">
          <div class="profile-detail-group">
            <div class="profile-detail-group-title">
              <i class="fas fa-gem"></i> VALORES & PRINCÍPIOS
            </div>
            <div class="profile-detail-group-items profile-detail-personality-grid">
              ${valuesContent}
            </div>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // FORÇAS & FRAQUEZAS - Estilo Personalidade
  // ==========================================
  let strengthsHtml = '';
  if ((profile.strengths && profile.strengths.length > 0) || (profile.weaknesses && profile.weaknesses.length > 0)) {
    let swContent = '';
    if (profile.strengths && profile.strengths.length > 0) {
      swContent += `
        <div class="profile-detail-personality-item">
          <span class="profile-detail-personality-label">Forças</span>
          <div class="profile-detail-tags">
            ${profile.strengths.map(s => `<span class="profile-detail-tag">${s}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (profile.weaknesses && profile.weaknesses.length > 0) {
      swContent += `
        <div class="profile-detail-personality-item">
          <span class="profile-detail-personality-label">Fraquezas</span>
          <div class="profile-detail-tags">
            ${profile.weaknesses.map(w => `<span class="profile-detail-tag">${w}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (swContent) {
      strengthsHtml = `
        <div class="profile-detail-slide">
          <div class="profile-detail-group">
            <div class="profile-detail-group-title">
              <i class="fas fa-balance-scale"></i> FORÇAS & FRAQUEZAS
            </div>
            <div class="profile-detail-group-items profile-detail-personality-grid">
              ${swContent}
            </div>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // FAVORITOS - Estilo Hard Skills (categorias com header)
  // ==========================================
  let favoritesHtml = '';
  if (profile.favorites) {
    const favCategories = [
      { key: 'anime', label: 'Anime', icon: 'fa-tv', color: '#ec4899' },
      { key: 'series', label: 'Séries', icon: 'fa-film', color: '#3b82f6' },
      { key: 'movies', label: 'Filmes', icon: 'fa-video', color: '#f59e0b' },
      { key: 'games', label: 'Games', icon: 'fa-gamepad', color: '#10b981' },
      { key: 'music', label: 'Música', icon: 'fa-music', color: '#8b5cf6' },
      { key: 'books', label: 'Livros', icon: 'fa-book', color: '#ef4444' }
    ];
    
    let favContent = '';
    favCategories.forEach(cat => {
      const items = profile.favorites[cat.key];
      if (items && items.length > 0) {
        const displayItems = items.slice(0, 5);
        const moreCount = items.length > 5 ? items.length - 5 : 0;
        favContent += `
          <div class="profile-detail-subgroup">
            <div class="profile-detail-subgroup-title">
              <i class="fas ${cat.icon}" style="color: ${cat.color};"></i> ${cat.label}
            </div>
            <div class="profile-detail-tags">
              ${displayItems.map(item => `<span class="profile-detail-tag">${item}</span>`).join('')}
              ${moreCount > 0 ? `<span class="profile-detail-tag-more" data-more="${items.slice(5).join(' • ')}">+${moreCount}</span>` : ''}
            </div>
          </div>
        `;
      }
    });
    if (favContent) {
      favoritesHtml = `
        <div class="profile-detail-slide">
          <div class="profile-detail-group">
            <div class="profile-detail-group-title">
              <i class="fas fa-heart"></i> FAVORITOS
            </div>
            <div class="profile-detail-group-items">
              ${favContent}
            </div>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // MONTAR HTML FINAL COM CARROSSEL
  // ==========================================
  const slides = [hobbiesHtml, goalsHtml, interestsHtml, valuesHtml, strengthsHtml, favoritesHtml].filter(Boolean);
  
  if (slides.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">Nenhum detalhe adicional disponível.</p>';
    return;
  }

  const carouselId = 'profile-details-carousel';
  
  container.innerHTML = `
    <div class="profile-carousel-container" id="${carouselId}">
      <div class="profile-carousel-wrapper">
        <div class="profile-carousel-track" id="profile-details-track">
          ${slides.join('')}
        </div>
      </div>
      <button class="profile-carousel-btn prev" data-target="profile-details">‹</button>
      <button class="profile-carousel-btn next" data-target="profile-details">›</button>
      <div class="profile-carousel-dots" id="profile-details-dots"></div>
    </div>
  `;

  // Inicializa o carrossel dos detalhes do perfil
  initProfileDetailsCarousel();
}

// ============================================
// CARROSSEL DOS DETALHES DO PERFIL
// ============================================
let profileDetailsInterval = null;

function initProfileDetailsCarousel() {
  const container = document.getElementById('profile-details-carousel');
  const track = document.getElementById('profile-details-track');
  const prevBtn = container?.querySelector('.prev');
  const nextBtn = container?.querySelector('.next');
  const dotsContainer = document.getElementById('profile-details-dots');
  
  if (!track || !container) return;

  const slides = track.querySelectorAll('.profile-detail-slide');
  const totalSlides = slides.length;
  
  if (totalSlides === 0) return;
  
  let currentIndex = 0;
  const slidesPerView = 1;

  function updateCarousel() {
    const slideWidth = slides[0]?.offsetWidth || 0;
    const gap = 16;
    const offset = currentIndex * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    updateDots(currentIndex);
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, totalSlides - slidesPerView));
    updateCarousel();
  }

  function next() {
    if (currentIndex < totalSlides - slidesPerView) {
      goTo(currentIndex + 1);
    } else {
      goTo(0);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      goTo(totalSlides - slidesPerView);
    }
  }

  function updateDots(active) {
    if (!dotsContainer) return;
    const totalDots = totalSlides;
    let dotsHtml = '';
    for (let i = 0; i < totalDots; i++) {
      dotsHtml += `<button class="profile-carousel-dot ${i === active ? 'active' : ''}" data-index="${i}"></button>`;
    }
    dotsContainer.innerHTML = dotsHtml;
    
    dotsContainer.querySelectorAll('.profile-carousel-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index, 10);
        goTo(index);
        resetProfileDetailsInterval();
      });
    });
  }

  // Eventos dos botões
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prev();
      resetProfileDetailsInterval();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      next();
      resetProfileDetailsInterval();
    });
  }

  // Auto-play
  if (totalSlides > 1) {
    profileDetailsInterval = setInterval(() => {
      next();
    }, 5000);
  }

  // Atualiza ao redimensionar
  const resizeObserver = new ResizeObserver(() => {
    updateCarousel();
  });
  resizeObserver.observe(track);

  container._carousel = { goTo, next, prev, currentIndex: () => currentIndex };
  container._resizeObserver = resizeObserver;
  
  updateCarousel();
  updateDots(0);
  
  // Inicializa tooltips após carregar
  setTimeout(initMoreTooltips, 100);
}

function resetProfileDetailsInterval() {
  if (profileDetailsInterval) {
    clearInterval(profileDetailsInterval);
    profileDetailsInterval = null;
    const container = document.getElementById('profile-details-carousel');
    if (container) {
      const slides = container.querySelectorAll('.profile-detail-slide');
      if (slides.length > 1) {
        profileDetailsInterval = setInterval(() => {
          if (container._carousel) {
            container._carousel.next();
          }
        }, 5000);
      }
    }
  }
}

// ============================================
// POP-UP PARA "+MORE" - ESTILO MODAL
// ============================================
function initMoreTooltips() {
  // Remove pop-ups antigos
  document.querySelectorAll('.profile-detail-popup').forEach(el => el.remove());
  
  document.querySelectorAll('.profile-detail-tag-more').forEach(el => {
    const moreText = el.dataset.more;
    if (!moreText) return;
    
    // Remove o title padrão
    el.removeAttribute('title');
    
    // Cria o overlay do pop-up
    const popup = document.createElement('div');
    popup.className = 'profile-detail-popup-overlay';
    popup.innerHTML = `
      <div class="profile-detail-popup glass-card">
        <div class="profile-detail-popup-header">
          <span class="profile-detail-popup-title">
            <i class="fas fa-list"></i> Itens adicionais
          </span>
          <button class="profile-detail-popup-close">&times;</button>
        </div>
        <div class="profile-detail-popup-body">
          <div class="profile-detail-popup-tags">
            ${moreText.split(' • ').map(item => `<span class="profile-detail-popup-tag">${item}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    
    const overlay = popup;
    const closeBtn = popup.querySelector('.profile-detail-popup-close');
    const popupBody = popup.querySelector('.profile-detail-popup-body');
    
    // Função para abrir o pop-up
    function openPopup(e) {
      e.stopPropagation();
      
      // Fecha outros pop-ups abertos
      document.querySelectorAll('.profile-detail-popup-overlay.active').forEach(p => {
        p.classList.remove('active');
      });
      
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Centraliza o pop-up
      const popupContent = overlay.querySelector('.profile-detail-popup');
      popupContent.style.maxHeight = '60vh';
    }
    
    // Função para fechar o pop-up
    function closePopup() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    // Evento de clique no +N
    el.addEventListener('click', openPopup);
    
    // Evento de clique no fechar
    closeBtn.addEventListener('click', closePopup);
    
    // Fecha ao clicar no overlay (fora do pop-up)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });
    
    // Fecha ao pressionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closePopup();
      }
    });
  });
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
// RENDERIZAR PROJETOS (CARROSSEL CUSTOM - COM IMAGEM REDUZIDA)
// ============================================
function renderProjects(projects) {
  const track = $('#projects-track');
  const dots = $('#projects-dots');
  if (!track) return;

  if (!projects || projects.length === 0) {
    track.innerHTML = `<div class="carousel-slide"><p class="empty-message">📭 Nenhum projeto cadastrado ainda.</p></div>`;
    return;
  }

  let slidesHtml = '';
  projects.forEach((project) => {
    slidesHtml += `
      <div class="carousel-slide">
        <div class="project-card glass-card">
          <div class="project-image">
            <img src="${project.image || 'assets/img/default-project.jpg'}" alt="${project.title}">
            <span class="project-status status-${project.status}">${getStatusLabel(project.status)}</span>
          </div>
          <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tech">
              ${project.technologies.slice(0, 3).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              ${project.technologies.length > 3 ? `<span class="tech-tag">+${project.technologies.length - 3}</span>` : ''}
            </div>
            <div class="project-links">
              ${project.url && project.url !== '#' ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Demo</a>` : ''}
              ${project.repo && project.repo !== '#' ? `<a href="${project.repo}" target="_blank" rel="noopener noreferrer" class="btn-small">📂 GitHub</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  track.innerHTML = slidesHtml;
  initCarousel('projects', projects.length);
  updateDots('projects', projects.length, 0);
}

// ============================================
// RENDERIZAR CERTIFICADOS (CARROSSEL CUSTOM)
// ============================================
function renderCertificates(certificates) {
  const track = $('#certificates-track');
  const dots = $('#certificates-dots');
  if (!track) return;

  if (!certificates || certificates.length === 0) {
    track.innerHTML = `<div class="carousel-slide"><p class="empty-message">📭 Nenhum certificado cadastrado ainda.</p></div>`;
    return;
  }

  let slidesHtml = '';
  certificates.forEach((cert) => {
    slidesHtml += `
      <div class="carousel-slide">
        <div class="certificate-card glass-card" style="text-align: center;">
          <div class="certificate-icon">🏆</div>
          <div class="certificate-content">
            <h4>${cert.name}</h4>
            <p class="cert-institution">${cert.institution}</p>
            <p class="cert-date">📅 ${cert.date}</p>
            ${cert.description ? `<p class="cert-description">${cert.description}</p>` : ''}
            ${cert.link && cert.link !== '#' ? `<a href="${cert.link}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Ver</a>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  track.innerHTML = slidesHtml;
  initCarousel('certificates', certificates.length);
  updateDots('certificates', certificates.length, 0);
}

// ============================================
// RENDERIZAR CURSOS (CARROSSEL CUSTOM)
// ============================================
function renderCourses(courses) {
  const track = $('#courses-track');
  const dots = $('#courses-dots');
  if (!track) return;

  if (!courses || courses.length === 0) {
    track.innerHTML = `<div class="carousel-slide"><p class="empty-message">📭 Nenhum curso cadastrado ainda.</p></div>`;
    return;
  }

  let slidesHtml = '';
  courses.forEach((course) => {
    slidesHtml += `
      <div class="carousel-slide">
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
            ${course.url && course.url !== '#' ? `<a href="${course.url}" target="_blank" rel="noopener noreferrer" class="btn-small">🔗 Ver</a>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  track.innerHTML = slidesHtml;
  initCarousel('courses', courses.length);
  updateDots('courses', courses.length, 0);
}

// ============================================
// INICIALIZAR CARROSSEL
// ============================================
let carouselIntervals = {};

function initCarousel(id, totalItems) {
  const container = document.getElementById(`${id}-carousel`);
  const track = document.getElementById(`${id}-track`);
  const prevBtn = container.querySelector('.prev');
  const nextBtn = container.querySelector('.next');
  
  if (!track || !container) return;
  
  // Remove intervalo anterior
  if (carouselIntervals[id]) {
    clearInterval(carouselIntervals[id]);
    delete carouselIntervals[id];
  }

  const slides = track.querySelectorAll('.carousel-slide');
  const slidesPerView = getSlidesPerView();
  const totalSlides = slides.length;
  
  if (totalSlides === 0) return;
  
  let currentIndex = 0;
  const maxIndex = Math.max(0, totalSlides - slidesPerView);

  function updateCarousel() {
    const slideWidth = slides[0]?.offsetWidth || 0;
    const gap = 16; // gap entre slides
    const offset = currentIndex * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    updateDots(id, totalSlides, currentIndex);
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
  }

  function next() {
    if (currentIndex < maxIndex) {
      goTo(currentIndex + 1);
    } else {
      goTo(0);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      goTo(maxIndex);
    }
  }

  // Eventos dos botões
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prev();
      resetInterval(id);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      next();
      resetInterval(id);
    });
  }

  // Auto-play
  if (totalSlides > slidesPerView) {
    carouselIntervals[id] = setInterval(() => {
      next();
    }, 5000);
  }

  // Atualiza ao redimensionar
  const resizeObserver = new ResizeObserver(() => {
    updateCarousel();
  });
  resizeObserver.observe(track);

  // Guarda referências
  container._carousel = { goTo, next, prev, currentIndex: () => currentIndex };
  container._resizeObserver = resizeObserver;
  
  // Inicializa
  updateCarousel();
}

function getSlidesPerView() {
  if (window.innerWidth < 480) return 1;
  if (window.innerWidth < 768) return 2;
  return 3;
}

function updateDots(id, total, active) {
  const dotsContainer = document.getElementById(`${id}-dots`);
  if (!dotsContainer) return;
  
  const slidesPerView = getSlidesPerView();
  const totalDots = Math.max(1, Math.ceil(total / slidesPerView));
  
  let dotsHtml = '';
  for (let i = 0; i < totalDots; i++) {
    dotsHtml += `<button class="carousel-dot ${i === active ? 'active' : ''}" data-index="${i}"></button>`;
  }
  dotsContainer.innerHTML = dotsHtml;
  
  // Eventos dos dots
  dotsContainer.querySelectorAll('.carousel-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index, 10);
      const container = document.getElementById(`${id}-carousel`);
      if (container && container._carousel) {
        container._carousel.goTo(index);
        resetInterval(id);
      }
    });
  });
}

function resetInterval(id) {
  if (carouselIntervals[id]) {
    clearInterval(carouselIntervals[id]);
    delete carouselIntervals[id];
    // Reinicia o intervalo
    const container = document.getElementById(`${id}-carousel`);
    if (container) {
      const slides = container.querySelectorAll('.carousel-slide');
      const slidesPerView = getSlidesPerView();
      if (slides.length > slidesPerView) {
        carouselIntervals[id] = setInterval(() => {
          if (container._carousel) {
            container._carousel.next();
          }
        }, 5000);
      }
    }
  }
}

// Atualiza carrosséis ao redimensionar
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    ['projects', 'certificates', 'courses'].forEach((id) => {
      const container = document.getElementById(`${id}-carousel`);
      if (container && container._carousel) {
        const track = document.getElementById(`${id}-track`);
        if (track) {
          const slides = track.querySelectorAll('.carousel-slide');
          const slidesPerView = getSlidesPerView();
          const maxIndex = Math.max(0, slides.length - slidesPerView);
          const currentIndex = container._carousel.currentIndex();
          if (currentIndex > maxIndex) {
            container._carousel.goTo(maxIndex);
          } else {
            container._carousel.goTo(currentIndex);
          }
          updateDots(id, slides.length, Math.min(currentIndex, maxIndex));
        }
      }
    });
  }, 300);
});

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
// RENDERIZAR HERO BADGES
// ============================================
function renderHeroBadges(profile) {
  const container = $('#hero-badges');
  if (!container || !profile) return;

  const badges = profile.badges || [];
  if (badges.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = badges.map(badge => `
    <span class="badge" style="${badge.color ? `border-color: ${badge.color};` : ''}">
      ${badge.icon || ''} ${badge.name}
    </span>
  `).join('');
}

// ============================================
// RENDERIZAR HERO
// ============================================
let avatarInterval = null;
let currentAvatarIndex = 0;

function renderHero(profile, current) {
  const nameEl = $('#name');
  const roleEl = $('#role');
  const statusEl = $('#status-text');
  const profileImg = $('#profile-img');

  if (nameEl) {
    const fullName = profile?.identity?.name || profile?.name || 'João Gabriel';
    nameEl.textContent = fullName;
    nameEl.style.whiteSpace = 'nowrap';
  }

  if (roleEl) {
    roleEl.textContent = profile?.role || 'Desenvolvedor Full Stack & Artista';
  }

  if (statusEl && current?.currentlyWorkingOn) {
    statusEl.textContent = `🚀 Trabalhando em: ${current.currentlyWorkingOn.project}`;
  } else if (statusEl) {
    statusEl.textContent = '✨ Disponível para novos projetos';
  }

  if (profileImg) {
    if (avatarInterval) {
      clearInterval(avatarInterval);
      avatarInterval = null;
    }

    const avatars = profile?.avatars || [];
    const singleAvatar = profile?.avatar;
    const interval = profile?.avatarInterval || 5000;

    if (avatars.length > 1) {
      currentAvatarIndex = 0;
      profileImg.src = avatars[0];
      profileImg.alt = `João Gabriel - Densuki ${currentAvatarIndex + 1}`;
      
      avatarInterval = setInterval(() => {
        currentAvatarIndex = (currentAvatarIndex + 1) % avatars.length;
        profileImg.style.transition = 'opacity 0.5s ease';
        profileImg.style.opacity = '0';
        setTimeout(() => {
          profileImg.src = avatars[currentAvatarIndex];
          profileImg.alt = `João Gabriel - Densuki ${currentAvatarIndex + 1}`;
          profileImg.style.opacity = '1';
        }, 500);
      }, interval);
      
      console.log(`🔄 Alternando entre ${avatars.length} imagens de perfil a cada ${interval/1000}s`);
    } else if (singleAvatar) {
      profileImg.src = singleAvatar;
      profileImg.alt = 'João Gabriel - Densuki';
    }
  }

  renderHeroBadges(profile);
}

// ============================================
// CONTROLES DE NAVEGAÇÃO DO PERFIL
// ============================================
function initProfileControls(profile) {
  const profileImg = $('#profile-img');
  const prevBtn = $('#profile-prev');
  const nextBtn = $('#profile-next');
  const dotsContainer = $('#profile-dots');
  const navContainer = $('#profile-nav');

  if (!profileImg) return;

  const avatars = profile?.avatars || [];

  if (avatars.length <= 1) {
    if (navContainer) navContainer.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
    return;
  }

  if (navContainer) navContainer.style.display = 'flex';
  if (dotsContainer) dotsContainer.style.display = 'flex';

  let currentIndex = 0;

  dotsContainer.innerHTML = avatars.map((_, i) => 
    `<span class="profile-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  function changeImage(index) {
    index = (index + avatars.length) % avatars.length;
    currentIndex = index;

    profileImg.style.transition = 'opacity 0.5s ease';
    profileImg.style.opacity = '0';

    setTimeout(() => {
      profileImg.src = avatars[currentIndex];
      profileImg.alt = `João Gabriel - Densuki ${currentIndex + 1}`;
      profileImg.style.opacity = '1';
    }, 500);

    document.querySelectorAll('.profile-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      changeImage(currentIndex - 1);
      if (avatarInterval) {
        clearInterval(avatarInterval);
        avatarInterval = null;
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      changeImage(currentIndex + 1);
      if (avatarInterval) {
        clearInterval(avatarInterval);
        avatarInterval = null;
      }
    });
  }

  document.querySelectorAll('.profile-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index, 10);
      changeImage(index);
      if (avatarInterval) {
        clearInterval(avatarInterval);
        avatarInterval = null;
      }
    });
  });

  window._profileControls = { changeImage, currentIndex };
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
// CARREGAR PLAYLIST DO MUSIC.JSON
// ============================================
async function loadMusicPlaylist() {
  try {
    const response = await fetch('data/music.json');
    if (response.ok) {
      const data = await response.json();
      if (data && data.playerlist && data.playerlist.length > 0) {
        return data.playerlist;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar music.json:', err);
  }
  return [];
}

// ============================================
// MUSIC PLAYER COM MODAL CUSTOM
// ============================================
let musicModalInstance = null;
let currentPlaylist = [];
let currentTrackIndex = 0;
let isModalPlaying = false;
let musicPlayerInitialized = false;

async function initMusicPlayer(profile) {
  if (musicPlayerInitialized) return;
  
  const audio = $('#bg-music');
  const volRange = $('#volume-range');
  const volDown = $('#vol-down');
  const volUp = $('#vol-up');
  const musicSelect = $('#music-select');
  const musicControls = $('#music-controls');
  const currentTrack = $('#current-track');
  const panelToggle = $('#music-panel-toggle');

  const modalMusicSelect = $('#modal-music-select');
  const modalPlayPause = $('#modal-play-pause');
  const modalPrev = $('#modal-prev');
  const modalNext = $('#modal-next');
  const modalVolDown = $('#modal-vol-down');
  const modalVolUp = $('#modal-vol-up');
  const modalVolRange = $('#modal-volume-range');
  const modalCurrentTrack = $('#modal-current-track');
  const modalCurrentArtist = $('#modal-current-artist');
  const musicCover = $('#music-cover');
  const modalClose = $('#modal-close');
  const musicModal = $('#musicModal');

  if (!audio || !musicControls || !volRange || !musicSelect) return;

  // Carrega playlist do music.json
  let playlist = await loadMusicPlaylist();

  // Fallback
  if (playlist.length === 0) {
    playlist = [
      { title: 'Detective Conan', artist: 'TiMi Studio Group', src: 'assets/audio/Detective_Conan_Collaboration.mp3' }
    ];
  }

  currentPlaylist = playlist;

  // Preenche selects
  const optionsHtml = playlist.map((t, i) => 
    `<option value="${i}">${t.title || t.src?.split('/').pop() || `Música ${i + 1}`}</option>`
  ).join('');
  
  musicSelect.innerHTML = optionsHtml;
  if (modalMusicSelect) modalMusicSelect.innerHTML = optionsHtml;

  // Volume
  const savedVol = parseFloat(localStorage.getItem('volume'));
  const initialVol = !Number.isNaN(savedVol) ? savedVol : CONFIG.defaultVolume;
  audio.volume = initialVol;
  volRange.value = initialVol;
  if (modalVolRange) modalVolRange.value = initialVol;

  // Função para carregar música
  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    currentTrackIndex = index;
    const source = audio.querySelector('source');
    if (source) {
      source.src = track.src || track.url || 'assets/audio/background.mp3';
      audio.load();
    }
    
    const trackName = track.title || track.src?.split('/').pop() || `Música ${index + 1}`;
    currentTrack.textContent = trackName;
    if (modalCurrentTrack) modalCurrentTrack.textContent = trackName;
    if (modalCurrentArtist) modalCurrentArtist.textContent = track.artist || 'Artista desconhecido';
    
    if (musicCover) {
      musicCover.classList.remove('playing');
    }
    
    musicSelect.value = index;
    if (modalMusicSelect) modalMusicSelect.value = index;
  }

  // Inicializa com primeira música
  if (playlist.length > 0) {
    loadTrack(0);
  }

  // Eventos do player normal
  musicSelect.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    loadTrack(idx);
    if (modalMusicSelect) modalMusicSelect.value = idx;
  });

  volRange.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    audio.volume = v;
    localStorage.setItem('volume', String(v));
    if (modalVolRange) modalVolRange.value = v;
  });

  volDown.addEventListener('click', () => {
    let v = Math.max(0, audio.volume - 0.1);
    audio.volume = v;
    volRange.value = v;
    localStorage.setItem('volume', String(v));
    if (modalVolRange) modalVolRange.value = v;
  });

  volUp.addEventListener('click', () => {
    let v = Math.min(1, audio.volume + 0.1);
    audio.volume = v;
    volRange.value = v;
    localStorage.setItem('volume', String(v));
    if (modalVolRange) modalVolRange.value = v;
  });

  // Modal events
  if (modalMusicSelect) {
    modalMusicSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      loadTrack(idx);
      musicSelect.value = idx;
    });
  }

  if (modalVolRange) {
    modalVolRange.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      audio.volume = v;
      volRange.value = v;
      localStorage.setItem('volume', String(v));
    });
  }

  if (modalVolDown) {
    modalVolDown.addEventListener('click', () => {
      let v = Math.max(0, audio.volume - 0.1);
      audio.volume = v;
      volRange.value = v;
      if (modalVolRange) modalVolRange.value = v;
      localStorage.setItem('volume', String(v));
    });
  }

  if (modalVolUp) {
    modalVolUp.addEventListener('click', () => {
      let v = Math.min(1, audio.volume + 0.1);
      audio.volume = v;
      volRange.value = v;
      if (modalVolRange) modalVolRange.value = v;
      localStorage.setItem('volume', String(v));
    });
  }

  if (modalPlayPause) {
    modalPlayPause.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => {});
        modalPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        isModalPlaying = true;
        if (musicCover) musicCover.classList.add('playing');
      } else {
        audio.pause();
        modalPlayPause.innerHTML = '<i class="fas fa-play"></i>';
        isModalPlaying = false;
        if (musicCover) musicCover.classList.remove('playing');
      }
    });
  }

  if (modalNext) {
    modalNext.addEventListener('click', () => {
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      loadTrack(nextIndex);
      musicSelect.value = nextIndex;
      if (modalMusicSelect) modalMusicSelect.value = nextIndex;
      if (isModalPlaying) {
        audio.play().catch(() => {});
        if (musicCover) musicCover.classList.add('playing');
      }
    });
  }

  if (modalPrev) {
    modalPrev.addEventListener('click', () => {
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      loadTrack(prevIndex);
      musicSelect.value = prevIndex;
      if (modalMusicSelect) modalMusicSelect.value = prevIndex;
      if (isModalPlaying) {
        audio.play().catch(() => {});
        if (musicCover) musicCover.classList.add('playing');
      }
    });
  }

  // Abrir/fechar modal
  if (panelToggle) {
    panelToggle.addEventListener('click', () => {
      if (musicModal) {
        musicModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      if (modalCurrentTrack) {
        modalCurrentTrack.textContent = currentTrack.textContent || 'Nenhuma música';
      }
      if (modalPlayPause) {
        modalPlayPause.innerHTML = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
      }
      if (musicCover) {
        if (!audio.paused) {
          musicCover.classList.add('playing');
        } else {
          musicCover.classList.remove('playing');
        }
      }
      isModalPlaying = !audio.paused;
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (musicModal) {
        musicModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Fechar modal ao clicar fora
  if (musicModal) {
    musicModal.addEventListener('click', (e) => {
      if (e.target === musicModal) {
        musicModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  audio.addEventListener('play', () => {
    if (modalPlayPause) modalPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    if (musicCover) musicCover.classList.add('playing');
    isModalPlaying = true;
  });

  audio.addEventListener('pause', () => {
    if (modalPlayPause) modalPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    if (musicCover) musicCover.classList.remove('playing');
    isModalPlaying = false;
  });

  // Mostra o botão de música
  if (profile && profile.show && profile.show.music === false) {
    if (musicControls) musicControls.style.display = 'none';
    if (panelToggle) panelToggle.style.display = 'none';
  } else {
    if (panelToggle) panelToggle.style.display = 'flex';
  }

  musicPlayerInitialized = true;
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

  const elements = $$('.glass-card, .project-card, .certificate-card, .course-card, .section, .mini-card');
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

async function initPageFooter() {
  try {
    const data = await loadData();
    if (data?.profile) {
      renderFooter(data.profile);
      await initMusicPlayer(data.profile);
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
  initProfileControls(profile);
  renderMiniCards(profile);
  renderAbout(profile);
  renderSoftSkills(profile);
  renderHardSkills(profile);
  renderPersonality(profile);
  renderLanguages(profile);
  renderProfileDetails(profile);
  initMoreTooltips();
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
  await initMusicPlayer(profile);
  initScrollAnimations();
  initMobileNav();
  initSmoothScroll();
  initScrollIndicator();

  console.log('✅ Portfolio carregado com sucesso!');
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