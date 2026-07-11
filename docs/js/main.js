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

    // Nome
    if (identity.name) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Nome</span>
          <span class="mini-card-value">${identity.name}</span>
        </div>
      `;
    }

    // Pronomes
    if (identity.pronouns) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Pronomes</span>
          <span class="mini-card-value">${identity.pronouns}</span>
        </div>
      `;
    }

    // Display
    if (identity.displayName) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Pseudônimo</span>
          <span class="mini-card-value">${identity.displayName}</span>
        </div>
      `;
    }

    // Nick
    if (identity.nickname) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">Nick</span>
          <span class="mini-card-value">${identity.nickname}</span>
        </div>
      `;
    }

    // Aliases (como tags/botões)
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

    // Trabalho
    if (status.working) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">💼 Trabalho</span>
          <span class="mini-card-value">${status.working}</span>
        </div>
      `;
    }

    // Estudo
    if (status.studying) {
      html += `
        <div class="mini-card-item">
          <span class="mini-card-label">📚 Estudando</span>
          <span class="mini-card-value">${status.studying}</span>
        </div>
      `;
    }

    // Aprendendo (como tags/botões)
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

    // Disponível
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
            <img src="${profile.flag}" alt="Bandeira do Brasil">
            <span class="mini-card-value" style="text-align: center; width: 100%; font-size: 1rem; font-weight: 500;">
            ${profile.nationality}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // ----- OBJETIVO (opcional, pode ser adicionado aqui) -----
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
    
    // Função para processar cada linha com suporte a HTML e interpolação
    function processBioLine(line, data) {
      if (typeof line !== 'string') return '';
      
      // Primeiro interpola as variáveis {{...}}
      let processed = interpolate(line, data);
      
      // Depois processa o HTML (já está em HTML, só precisa garantir que seja renderizado)
      // O processText já faz isso, mas vamos garantir que as tags HTML sejam preservadas
      // e que as quebras de linha sejam mantidas
      
      // Remove quebras de linha extras que podem vir do JSON
      processed = processed.replace(/\n/g, '');
      
      return processed;
    }

    // Processa a bio baseado no tipo
    if (Array.isArray(profile.bio)) {
      // Bio como array de strings
      aboutHtml = profile.bio.map(line => {
        if (typeof line === 'string') {
          return processBioLine(line, profile);
        }
        return '';
      }).filter(line => line).join('');
    } else if (typeof profile.bio === 'string') {
      // Bio como string única
      aboutHtml = processBioLine(profile.bio, profile);
    } else if (typeof profile.bio === 'object' && !Array.isArray(profile.bio)) {
      // Bio como objeto com seções (header, introduction, etc.)
      const sections = [];
      
      // Processa cada seção
      Object.entries(profile.bio).forEach(([key, content]) => {
        if (Array.isArray(content)) {
          // Se for um array, processa cada linha
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

    // Se a bio for vazia, mostra mensagem padrão
    if (!aboutHtml || aboutHtml.trim() === '') {
      aboutHtml = '<p>Bio não disponível.</p>';
    }

    aboutText.innerHTML = aboutHtml;
  } else {
    // Fallback
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
// RENDERIZAR HARD SKILLS (SIDEBAR - VERSÃO MELHORADA)
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

  // Define as categorias principais e suas cores
  const categories = {
    'programming': { label: 'Programação', icon: 'fa-code', color: '#8b5cf6' },
    'frontend': { label: 'Front-end', icon: 'fa-laptop-code', color: '#3b82f6' },
    'backend': { label: 'Back-end', icon: 'fa-server', color: '#10b981' },
    'frameworks': { label: 'Frameworks', icon: 'fa-layer-group', color: '#f59e0b' },
    'libraries': { label: 'Bibliotecas', icon: 'fa-book', color: '#ef4444' },
    'database': { label: 'Banco de Dados', icon: 'fa-database', color: '#06b6d4' },
    'tools': { label: 'Ferramentas', icon: 'fa-tools', color: '#8b5cf6' },
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
      // Pega apenas as habilidades principais (limitado a 5 para não poluir)
      const displaySkills = skills.slice(0, 5);
      const moreCount = skills.length > 5 ? skills.length - 5 : 0;

      html += `
        <div class="hardskill-category">
          <div class="hardskill-category-header">
            <span class="hardskill-category-icon"><i class="fas ${cat.icon}" style="color: ${cat.color};"></i></span>
            <span class="hardskill-category-label">${cat.label}</span>
            <span class="hardskill-category-count">${skills.length}</span>
          </div>
          <div class="hardskill-items">
            ${displaySkills.map(skill => `
              <div class="hardskill-item" title="${skill.description || skill.name}" style="${skill.color ? `border-color: ${skill.color};` : ''}">
                ${skill.icon ? `<i class="${skill.icon}" style="color: ${skill.color || cat.color};"></i>` : ''}
                <span class="hardskill-name">${skill.name}</span>
                ${skill.isFavorite ? '<span class="hardskill-favorite">⭐</span>' : ''}
                ${skill.isLearning ? '<span class="hardskill-learning">📖</span>' : ''}
              </div>
            `).join('')}
            ${moreCount > 0 ? `<div class="hardskill-more">+${moreCount} outros</div>` : ''}
          </div>
        </div>
      `;
    }
  });

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

  // Agrupa soft skills por categoria (se possível) ou apenas lista
  const skills = profile.softSkills;
  
  // Define algumas categorias manuais para organizar melhor
  const categories = {
    'Pessoais': ['Empatia', 'Honestidade', 'Persistência', 'Organização', 'Curiosidade', 'Criatividade', 'Autodidatismo'],
    'Interpessoais': ['Trabalho em equipe', 'Comunicação escrita', 'Liderança', 'Adaptabilidade'],
    'Analíticas': ['Pensamento analítico', 'Resolução de problemas', 'Aprendizado contínuo', 'Organização']
  };

  // Verifica quais habilidades se encaixam em cada categoria
  const categorized = {};
  Object.keys(categories).forEach(cat => {
    categorized[cat] = skills.filter(s => categories[cat].some(c => s.includes(c) || c.includes(s)));
  });

  // Habilidades não categorizadas
  const uncategorized = skills.filter(s => 
    !Object.values(categories).flat().some(c => s.includes(c) || c.includes(s))
  );

  let html = `
    <h3><i class="fas fa-handshake"></i> Soft Skills</h3>
    <div class="softskills-container">
  `;

  // Mostra categorias que têm habilidades
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

  // Habilidades não categorizadas
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
// RENDERIZAR DETALHES DO PERFIL (SEM REDUNDÂNCIAS)
// ============================================
function renderProfileDetails(profile) {
  const container = $('#profile-details-content');
  if (!container || !profile) return;

  function flag(key) {
    return !(profile && profile.show && profile.show[key] === false);
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

  function formatGoals(goals) {
    if (!goals) return 'Não informado';
    let text = '';
    if (goals.shortTerm && goals.shortTerm.length > 0) {
      text += `<strong>Curto Prazo:</strong> ${formatArray(goals.shortTerm, ' • ')}`;
    }
    if (goals.longTerm && goals.longTerm.length > 0) {
      if (text) text += '<br>';
      text += `<strong>Longo Prazo:</strong> ${formatArray(goals.longTerm, ' • ')}`;
    }
    return text || 'Não informado';
  }

  const items = [];

  // Hobbies
  if (flag('hobbies') && profile.hobbies && profile.hobbies.length > 0) {
    items.push({
      icon: 'fa-heart',
      label: 'Hobbies',
      value: formatArray(profile.hobbies, ' • ')
    });
  }

  // Metas
  if (profile.goals) {
    items.push({
      icon: 'fa-flag-checkered',
      label: 'Metas',
      value: formatGoals(profile.goals),
      isHtml: true
    });
  }

  // Interesses
  if (profile.interests && profile.interests.length > 0) {
    items.push({
      icon: 'fa-star',
      label: 'Interesses',
      value: formatArray(profile.interests, ' • ')
    });
  }

  // Valores e Princípios
  const values = [];
  if (profile.values && profile.values.length > 0) {
    values.push(`Valores: ${formatArray(profile.values, ' • ')}`);
  }
  if (profile.principles && profile.principles.length > 0) {
    values.push(`Princípios: ${formatArray(profile.principles, ' • ')}`);
  }
  if (values.length > 0) {
    items.push({
      icon: 'fa-gem',
      label: 'Valores & Princípios',
      value: values.join('<br>'),
      isHtml: true
    });
  }

  // Forças e Fraquezas
  const strengthsWeaknesses = [];
  if (profile.strengths && profile.strengths.length > 0) {
    strengthsWeaknesses.push(`<strong>Forças:</strong> ${formatArray(profile.strengths.slice(0, 5), ' • ')}`);
  }
  if (profile.weaknesses && profile.weaknesses.length > 0) {
    strengthsWeaknesses.push(`<strong>Fraquezas:</strong> ${formatArray(profile.weaknesses.slice(0, 5), ' • ')}`);
  }
  if (strengthsWeaknesses.length > 0) {
    items.push({
      icon: 'fa-balance-scale',
      label: 'Forças & Fraquezas',
      value: strengthsWeaknesses.join('<br>'),
      isHtml: true
    });
  }

  // Favorites (apenas alguns destaques)
  if (profile.favorites) {
    const favItems = [];
    if (profile.favorites.anime && profile.favorites.anime.length > 0) {
      favItems.push(`Anime: ${formatArray(profile.favorites.anime.slice(0, 3), ' • ')}`);
    }
    if (profile.favorites.games && profile.favorites.games.length > 0) {
      favItems.push(`Games: ${formatArray(profile.favorites.games.slice(0, 3), ' • ')}`);
    }
    if (profile.favorites.series && profile.favorites.series.length > 0) {
      favItems.push(`Séries: ${formatArray(profile.favorites.series.slice(0, 3), ' • ')}`);
    }
    if (profile.favorites.movies && profile.favorites.movies.length > 0) {
      favItems.push(`Filmes: ${formatArray(profile.favorites.movies.slice(0, 3), ' • ')}`);
    }
    if (favItems.length > 0) {
      items.push({
        icon: 'fa-heart',
        label: 'Favoritos',
        value: favItems.join('<br>'),
        isHtml: true
      });
    }
  }

  // Timeline (últimos 3 eventos)
  if (profile.timeline && profile.timeline.length > 0) {
    const timelineItems = profile.timeline.slice(-3).map(t => 
      `${t.year}: ${t.title}${t.description ? ` (${t.description})` : ''}`
    );
    items.push({
      icon: 'fa-clock',
      label: 'Linha do Tempo',
      value: timelineItems.join('<br>'),
      isHtml: true
    });
  }

  // Renderizar
  container.innerHTML = items.map(item => `
    <div class="profile-detail-item${item.isFullWidth ? ' full-width' : ''}">
      <span class="detail-label"><i class="fas ${item.icon}"></i> ${item.label}</span>
      <div class="detail-value">${item.isHtml ? item.value : processText(item.value, profile)}</div>
    </div>
  `).join('') || '<p class="text-muted">Nenhum detalhe adicional disponível.</p>';
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
// RENDERIZAR HERO (com múltiplas imagens)
// ============================================
let avatarInterval = null;
let currentAvatarIndex = 0;

function renderHero(profile, current) {
  const nameEl = $('#name');
  const roleEl = $('#role');
  const statusEl = $('#status-text');
  const profileImg = $('#profile-img');

  // Nome completo sem quebra
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

  // ==========================================
  // MULTIPLAS IMAGENS DE PERFIL
  // ==========================================
  if (profileImg) {
    // Limpa o intervalo anterior se existir
    if (avatarInterval) {
      clearInterval(avatarInterval);
      avatarInterval = null;
    }

    // Verifica se temos múltiplas imagens
    const avatars = profile?.avatars || [];
    const singleAvatar = profile?.avatar;
    const interval = profile?.avatarInterval || 5000; // padrão 5 segundos

    if (avatars.length > 1) {
      // Temos múltiplas imagens - vamos alternar
      currentAvatarIndex = 0;
      
      // Define a primeira imagem
      profileImg.src = avatars[0];
      profileImg.alt = `João Gabriel - Densuki ${currentAvatarIndex + 1}`;
      
      // Configura o intervalo para trocar as imagens
      avatarInterval = setInterval(() => {
        // Avança para a próxima imagem
        currentAvatarIndex = (currentAvatarIndex + 1) % avatars.length;
        
        // Adiciona efeito de fade
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
      // Apenas uma imagem
      profileImg.src = singleAvatar;
      profileImg.alt = 'João Gabriel - Densuki';
    }
  }

  // Renderizar badges
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
  const singleAvatar = profile?.avatar;

  // Se não houver múltiplas imagens, esconde os controles
  if (avatars.length <= 1) {
    if (navContainer) navContainer.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
    return;
  }

  // Mostra os controles
  if (navContainer) navContainer.style.display = 'flex';
  if (dotsContainer) dotsContainer.style.display = 'flex';

  let currentIndex = 0;

  // Cria os dots
  dotsContainer.innerHTML = avatars.map((_, i) => 
    `<span class="profile-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  // Função para trocar a imagem
  function changeImage(index) {
    // Limita o índice
    index = (index + avatars.length) % avatars.length;
    currentIndex = index;

    // Efeito de fade
    profileImg.style.transition = 'opacity 0.5s ease';
    profileImg.style.opacity = '0';

    setTimeout(() => {
      profileImg.src = avatars[currentIndex];
      profileImg.alt = `João Gabriel - Densuki ${currentIndex + 1}`;
      profileImg.style.opacity = '1';
    }, 500);

    // Atualiza os dots
    document.querySelectorAll('.profile-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  // Eventos dos botões
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      changeImage(currentIndex - 1);
      // Pausa o intervalo automático se existir
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

  // Eventos dos dots
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

  // Salva a referência para o intervalo
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

  let playlist = (profile && Array.isArray(profile.music)) ? profile.music : [];
  
  if (playlist.length === 0) {
    playlist = [
      { title: 'Background', src: 'assets/audio/background.mp3' }
    ];
  }

  musicSelect.innerHTML = playlist.map((t, i) => 
    `<option value="${i}">${t.title || t.src.split('/').pop() || `Música ${i + 1}`}</option>`
  ).join('');

  const savedVol = parseFloat(localStorage.getItem('volume'));
  const initialVol = !Number.isNaN(savedVol) ? savedVol : CONFIG.defaultVolume;
  audio.volume = initialVol;
  volRange.value = initialVol;

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    const source = audio.querySelector('source');
    if (source) {
      source.src = track.src;
      audio.load();
    }
    
    const trackName = track.title || track.src.split('/').pop() || `Música ${index + 1}`;
    currentTrack.textContent = trackName;
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
  initProfileControls(profile); // NOVO - Inicializa os controles
  renderMiniCards(profile);
  renderAbout(profile);
  renderSoftSkills(profile);
  renderHardSkills(profile);
  renderPersonality(profile);
  renderLanguages(profile);
  renderProfileDetails(profile);
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