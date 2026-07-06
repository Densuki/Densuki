// ============================================
// ABOUT - Módulo Principal
// ============================================

// ============================================
// CONFIGURAÇÃO
// ============================================
const ABOUT_CONFIG = {
    getApiUrl() {
        const hostname = window.location.hostname;
        const port = '5000';
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `http://localhost:${port}/api`;
        }
        
        if (hostname.includes('github.dev')) {
            const baseName = hostname.replace(/-\d+\.app\.github\.dev$/, '');
            return `https://${baseName}-${port}.app.github.dev/api`;
        }
        
        if (hostname.includes('github.io')) {
            return 'https://portifolio-pj8c.onrender.com/api';
        }
        
        return `http://localhost:${port}/api`;
    }
};

// ============================================
// ESTADO GLOBAL
// ============================================
let currentUser = null;
let currentToken = null;
let aboutData = null;
let profileData = null;
const API_BASE = ABOUT_CONFIG.getApiUrl();

console.log('🔗 About API URL:', API_BASE);

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================
async function checkAuth() {
    const token = localStorage.getItem('curriculumToken');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentToken = token;
            return true;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
    
    localStorage.removeItem('curriculumToken');
    return false;
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('curriculumToken', data.token);
            currentUser = data.user;
            currentToken = data.token;
            return { success: true, user: data.user };
        } else {
            const error = await response.json();
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error('Erro no login:', error);
        return { success: false, message: 'Erro de conexão com o servidor' };
    }
}

function logout() {
    localStorage.removeItem('curriculumToken');
    currentUser = null;
    currentToken = null;
    location.reload();
}

// ============================================
// FUNÇÕES DE CARREGAMENTO
// ============================================
async function loadAboutData() {
    try {
        console.log('📡 Carregando dados do about de:', `${API_BASE}/about`);
        const response = await fetch(`${API_BASE}/about`);
        
        if (response.ok) {
            aboutData = await response.json();
            return true;
        } else {
            console.error('❌ Erro ao carregar about:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar about:', error);
        return false;
    }
}

async function loadProfileData() {
    try {
        console.log('📡 Carregando perfil de:', `${API_BASE}/profile`);
        const response = await fetch(`${API_BASE}/profile`);
        
        if (response.ok) {
            profileData = await response.json();
            return true;
        } else {
            console.error('❌ Erro ao carregar perfil:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        return false;
    }
}

async function saveAboutData(data) {
    if (!currentToken) {
        showLoginModal();
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/about`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showEditStatus('✅ ' + result.message, 'success');
            await loadAboutData();
            renderAbout(aboutData);
            return true;
        } else if (response.status === 401) {
            localStorage.removeItem('curriculumToken');
            showLoginModal();
            return false;
        } else {
            const error = await response.json();
            showEditStatus('❌ ' + (error.message || 'Erro ao salvar'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro ao salvar about:', error);
        showEditStatus('❌ Erro de conexão com o servidor', 'error');
        return false;
    }
}

// ============================================
// FUNÇÃO PARA PROCESSAR MARKDOWN
// ============================================
function parseMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Cabeçalhos
    html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');
    
    // Negrito
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Itálico
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Listas não ordenadas
    html = html.replace(/^[\s]*[-*+] (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Listas ordenadas
    html = html.replace(/^[\s]*\d+\. (.*$)/gm, '<li>$1</li>');
    
    // Quebras de linha
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// ============================================
// RENDERIZAÇÃO
// ============================================
function renderAbout(data) {
    if (!data) {
        console.warn('⚠️ Sem dados para renderizar');
        return;
    }

    // Bio - Sobre Mim
    const bioContainer = document.getElementById('profile-bio');
    if (bioContainer && data.bio) {
        if (Array.isArray(data.bio)) {
            bioContainer.innerHTML = data.bio.map(line => `<p>${interpolate(line, data)}</p>`).join('');
        } else if (typeof data.bio === 'string') {
            bioContainer.innerHTML = `<p>${interpolate(data.bio, data)}</p>`;
        }
    }

    // Objetivo
    const objectiveEl = document.getElementById('profile-objective');
    if (objectiveEl && data.objective) {
        objectiveEl.textContent = data.objective;
    }

    // Status
    if (data.status) {
        const workingEl = document.getElementById('profile-working');
        if (workingEl) workingEl.textContent = data.status.working || 'Em procura de oportunidades';
        
        const studyingEl = document.getElementById('profile-studying');
        if (studyingEl) studyingEl.textContent = data.status.studying || 'Aprendizado contínuo';
    }

    // Descrição
    const descriptionEl = document.getElementById('profile-description');
    if (descriptionEl && data.description) {
        descriptionEl.innerHTML = parseMarkdown(data.description);
    }

    // Saúde
    const healthEl = document.getElementById('profile-health');
    if (healthEl && data.health) {
        healthEl.textContent = data.health;
    }

    // Habilidades
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && data.skills) {
        const categoryLabels = {
            'core': 'Soft Skills',
            'technical': 'Hard Skills',
            'creative': 'Criativas',
            'languages': 'Idiomas'
        };
        
        skillsGrid.innerHTML = Object.entries(data.skills)
            .filter(([_, items]) => items && items.length > 0)
            .map(([category, items]) => `
                <div class="skill-category">
                    <h4>${categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <div class="skill-tags">
                        ${items.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            `).join('');
    }

    // Interesses
    const interestsGrid = document.getElementById('interests-grid');
    if (interestsGrid && data.interests) {
        interestsGrid.innerHTML = data.interests.map(interest => 
            `<div class="interest-item">${interest}</div>`
        ).join('');
    }

    // Badges
    const badgesList = document.getElementById('badges-list');
    if (badgesList && data.badges) {
        badgesList.innerHTML = data.badges.map(badge => 
            `<span class="badge">${badge}</span>`
        ).join('');
    }

    // História
    const historyEl = document.getElementById('profile-history');
    if (historyEl && data.history) {
        if (Array.isArray(data.history)) {
            historyEl.innerHTML = data.history.map(line => `<p>${interpolate(line, data)}</p>`).join('');
        } else if (typeof data.history === 'string') {
            historyEl.innerHTML = `<p>${interpolate(data.history, data)}</p>`;
        }
    }
}

// ============================================
// FUNÇÃO DE INTERPOLAÇÃO
// ============================================
function interpolate(template, data) {
    if (!template || typeof template !== 'string') return template;
    
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
        if (!data) return '';
        const val = getByPath(data, keyPath);
        if (val === undefined || val === null) return '';
        const out = Array.isArray(val) ? val.join(', ') : String(val);
        if (modifier && modifier.trim() === 'escape') return escapeHtml(out);
        return out;
    });
}

// ============================================
// MODAL DE LOGIN
// ============================================
function showLoginModal() {
    const existing = document.querySelector('.login-modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'login-modal-overlay';
    modal.innerHTML = `
        <div class="login-modal">
            <h2>🔐 Acesso ao About</h2>
            <p>Faça login para editar o conteúdo</p>
            
            <form id="login-form">
                <div class="form-group">
                    <label for="login-username">Usuário</label>
                    <input type="text" id="login-username" placeholder="Usuário" required autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="login-password">Senha</label>
                    <input type="password" id="login-password" placeholder="Senha" required autocomplete="current-password">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-login">Entrar</button>
                    <button type="button" class="btn-cancel" onclick="this.closest('.login-modal-overlay').remove()">Cancelar</button>
                </div>
                
                <div id="login-error" class="login-error"></div>
                <div id="login-success" class="login-success"></div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const result = await login(username, password);
        if (result.success) {
            document.getElementById('login-success').textContent = '✅ Login realizado com sucesso!';
            document.getElementById('login-error').textContent = '';
            setTimeout(() => {
                modal.remove();
                document.getElementById('edit-btn').style.display = 'inline-flex';
                loadAboutData().then(() => renderAbout(aboutData));
            }, 1000);
        } else {
            document.getElementById('login-error').textContent = '❌ ' + (result.message || 'Usuário ou senha incorretos');
            document.getElementById('login-success').textContent = '';
        }
    });
}

// ============================================
// MODAL DE EDIÇÃO
// ============================================
function showEditModal() {
    if (!currentToken) {
        showLoginModal();
        return;
    }

    const overlay = document.getElementById('edit-modal-overlay');
    const container = document.getElementById('edit-fields-container');
    
    container.innerHTML = generateEditFields(aboutData);
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function generateEditFields(data) {
    let html = '';
    
    // Bio - Sobre Mim
    html += `
        <div class="edit-section">
            <h3>📖 Sobre Mim</h3>
            <p style="color: var(--color-secondary-text); font-size: 0.85rem; margin-bottom: 1rem;">
                💡 Use <strong>Markdown</strong> para formatar: <code>**negrito**</code>, <code>*itálico*</code>, 
                <code>- item</code> para listas, <code># Título</code>
            </p>
            <div class="edit-field">
                <label>Bio (parágrafos separados por linha)</label>
                <textarea id="bio-edit" data-path="bio" data-type="array-lines" rows="6" placeholder="Sobre você...">${Array.isArray(data.bio) ? data.bio.join('\n') : data.bio || ''}</textarea>
            </div>
        </div>
    `;
    
    // Objetivo
    html += `
        <div class="edit-section">
            <h3>🎯 Objetivo Profissional</h3>
            <div class="edit-field">
                <input type="text" id="objective-edit" data-path="objective" value="${data.objective || ''}" placeholder="Seu objetivo profissional">
            </div>
        </div>
    `;
    
    // Status
    html += `
        <div class="edit-section">
            <h3>📊 Status</h3>
            <div class="edit-field">
                <label>Trabalhando em</label>
                <input type="text" id="status-working" data-path="status.working" value="${data.status?.working || ''}" placeholder="Ex: Desenvolvedor Full Stack">
            </div>
            <div class="edit-field">
                <label>Estudando</label>
                <input type="text" id="status-studying" data-path="status.studying" value="${data.status?.studying || ''}" placeholder="Ex: React, Node.js">
            </div>
        </div>
    `;
    
    // Descrição
    html += `
        <div class="edit-section">
            <h3>📝 Descrição</h3>
            <p style="color: var(--color-secondary-text); font-size: 0.85rem; margin-bottom: 1rem;">
                💡 Suporta <strong>Markdown</strong> para formatação
            </p>
            <div class="edit-field">
                <textarea id="description-edit" data-path="description" rows="4" placeholder="Descrição detalhada...">${data.description || ''}</textarea>
            </div>
        </div>
    `;
    
    // Saúde
    html += `
        <div class="edit-section">
            <h3>❤️ Saúde</h3>
            <div class="edit-field">
                <input type="text" id="health-edit" data-path="health" value="${data.health || ''}" placeholder="Ex: Saudável, praticando exercícios">
            </div>
        </div>
    `;
    
    // Habilidades
    html += `
        <div class="edit-section">
            <h3>⚡ Habilidades</h3>
            <div class="edit-field">
                <label>Soft Skills (separadas por vírgula)</label>
                <input type="text" id="skills-core" data-path="skills.core" data-type="array" value="${data.skills?.core?.join(', ') || ''}" placeholder="Comunicação, Liderança, Trabalho em Equipe">
            </div>
            <div class="edit-field">
                <label>Hard Skills (separadas por vírgula)</label>
                <input type="text" id="skills-technical" data-path="skills.technical" data-type="array" value="${data.skills?.technical?.join(', ') || ''}" placeholder="JavaScript, Python, HTML, CSS">
            </div>
            <div class="edit-field">
                <label>Habilidades Criativas (separadas por vírgula)</label>
                <input type="text" id="skills-creative" data-path="skills.creative" data-type="array" value="${data.skills?.creative?.join(', ') || ''}" placeholder="Desenho, Escrita, Música">
            </div>
            <div class="edit-field">
                <label>Idiomas (separados por vírgula)</label>
                <input type="text" id="skills-languages" data-path="skills.languages" data-type="array" value="${data.skills?.languages?.join(', ') || ''}" placeholder="Português (Nativo), Inglês (Avançado)">
            </div>
        </div>
    `;
    
    // Interesses
    html += `
        <div class="edit-section">
            <h3>🌟 Interesses</h3>
            <div class="edit-field">
                <label>Interesses (separados por vírgula)</label>
                <input type="text" id="interests-edit" data-path="interests" data-type="array" value="${data.interests?.join(', ') || ''}" placeholder="Anime, Manga, Programação, Música">
            </div>
        </div>
    `;
    
    // Badges
    html += `
        <div class="edit-section">
            <h3>🏷️ Badges</h3>
            <div class="edit-field">
                <label>Badges (separados por vírgula)</label>
                <input type="text" id="badges-edit" data-path="badges" data-type="array" value="${data.badges?.join(', ') || ''}" placeholder="Desenvolvedor, Artista, Escritor">
            </div>
        </div>
    `;
    
    // História
    html += `
        <div class="edit-section">
            <h3>📜 História</h3>
            <p style="color: var(--color-secondary-text); font-size: 0.85rem; margin-bottom: 1rem;">
                💡 Use <strong>Markdown</strong> para formatar e <code>{{nome}}</code> para interpolação
            </p>
            <div class="edit-field">
                <label>História (parágrafos separados por linha)</label>
                <textarea id="history-edit" data-path="history" data-type="array-lines" rows="6" placeholder="Sua história...">${Array.isArray(data.history) ? data.history.join('\n') : data.history || ''}</textarea>
            </div>
        </div>
    `;
    
    return html;
}

// ============================================
// FUNÇÕES DE MANIPULAÇÃO DO FORMULÁRIO
// ============================================
function collectFormData() {
    const form = document.getElementById('about-edit-form');
    const inputs = form.querySelectorAll('[data-path]');
    const data = JSON.parse(JSON.stringify(aboutData));
    
    inputs.forEach(input => {
        const path = input.dataset.path.split('.');
        let current = data;
        
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        
        const key = path[path.length - 1];
        
        if (input.dataset.type === 'array') {
            current[key] = input.value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (input.dataset.type === 'array-lines') {
            current[key] = input.value.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (input.type === 'number') {
            current[key] = parseFloat(input.value);
        } else {
            current[key] = input.value;
        }
    });
    
    return data;
}

function showEditStatus(message, type) {
    const status = document.getElementById('edit-status');
    if (status) {
        status.textContent = message;
        status.className = `edit-status ${type}`;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Inicializando About...');
    console.log('🔗 API URL:', API_BASE);
    
    // Carregar dados
    await loadAboutData();
    await loadProfileData();
    
    // Renderizar
    if (aboutData) {
        renderAbout(aboutData);
    } else {
        console.warn('⚠️ Sem dados do about para renderizar');
    }
    
    // Verificar autenticação
    const isAuth = await checkAuth();
    const editBtn = document.getElementById('edit-btn');
    if (editBtn) {
        editBtn.style.display = isAuth ? 'inline-flex' : 'none';
    }
    
    // Event Listeners
    document.getElementById('edit-btn')?.addEventListener('click', function() {
        if (!currentToken) {
            showLoginModal();
        } else {
            showEditModal();
        }
    });
    
    document.getElementById('close-edit-modal')?.addEventListener('click', () => {
        document.getElementById('edit-modal-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    document.getElementById('cancel-edit')?.addEventListener('click', () => {
        document.getElementById('edit-modal-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    document.getElementById('about-edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = collectFormData();
        if (await saveAboutData(data)) {
            document.getElementById('edit-modal-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    document.getElementById('edit-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('edit-modal-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});