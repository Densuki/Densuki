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
            console.log('✅ Usuário autenticado:', currentUser.username);
            return true;
        } else {
            console.warn('⚠️ Token inválido ou expirado');
        }
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
    }
    
    localStorage.removeItem('curriculumToken');
    currentToken = null;
    currentUser = null;
    return false;
}

async function login(username, password) {
    try {
        console.log('🔐 Tentando login para:', username);
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
            console.log('✅ Login realizado com sucesso:', currentUser.username);
            return { success: true, user: data.user };
        } else {
            const error = await response.json();
            console.error('❌ Falha no login:', error.message);
            return { success: false, message: error.message || 'Credenciais inválidas' };
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        return { success: false, message: 'Erro de conexão com o servidor' };
    }
}

function logout() {
    localStorage.removeItem('curriculumToken');
    currentUser = null;
    currentToken = null;
    console.log('👋 Usuário deslogado');
    location.reload();
}

// ============================================
// FUNÇÕES DE CARREGAMENTO
// ============================================
async function loadAboutData() {
    try {
        console.log('📡 Carregando dados do about de:', `${API_BASE}/about`);
        const response = await fetch(`${API_BASE}/about`);
        
        console.log('📊 Status da resposta:', response.status);
        
        if (response.ok) {
            aboutData = await response.json();
            console.log('✅ Dados do about carregados com sucesso!');
            updateConnectionStatus('success', '✅ Dados carregados com sucesso!');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao carregar about:', response.status, errorText);
            updateConnectionStatus('error', `❌ Erro ${response.status}: Falha ao carregar dados`);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar about:', error);
        updateConnectionStatus('error', '❌ Erro de conexão com o servidor');
        return false;
    }
}

async function loadProfileData() {
    try {
        console.log('📡 Carregando perfil de:', `${API_BASE}/profile`);
        const response = await fetch(`${API_BASE}/profile`);
        
        if (response.ok) {
            profileData = await response.json();
            console.log('✅ Perfil carregado com sucesso!');
            return true;
        } else {
            console.warn('⚠️ Não foi possível carregar o perfil:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        return false;
    }
}

async function saveAboutData(data) {
    if (!currentToken) {
        updateConnectionStatus('error', '❌ Faça login para salvar as alterações');
        showLoginModal();
        return false;
    }
    
    try {
        console.log('💾 Salvando dados do about...');
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
            console.log('✅ Dados salvos com sucesso:', result);
            showEditStatus('✅ ' + (result.message || 'Dados salvos com sucesso!'), 'success');
            updateConnectionStatus('success', '✅ Dados salvos com sucesso!');
            
            // Recarregar dados para garantir consistência
            await loadAboutData();
            renderAbout(aboutData);
            return true;
        } else if (response.status === 401) {
            console.warn('⚠️ Sessão expirada, solicitando novo login');
            localStorage.removeItem('curriculumToken');
            currentToken = null;
            currentUser = null;
            showLoginModal();
            updateConnectionStatus('error', '❌ Sessão expirada. Faça login novamente.');
            return false;
        } else {
            const error = await response.json();
            console.error('❌ Erro ao salvar:', error);
            showEditStatus('❌ ' + (error.message || 'Erro ao salvar'), 'error');
            updateConnectionStatus('error', '❌ ' + (error.message || 'Erro ao salvar'));
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar about:', error);
        showEditStatus('❌ Erro de conexão com o servidor', 'error');
        updateConnectionStatus('error', '❌ Erro de conexão com o servidor');
        return false;
    }
}

// ============================================
// FUNÇÃO DE STATUS DE CONEXÃO
// ============================================
function updateConnectionStatus(status, message) {
    const statusEl = document.getElementById('connection-status');
    const textEl = document.getElementById('status-text');
    
    if (!statusEl || !textEl) return;
    
    statusEl.style.display = 'block';
    textEl.textContent = message;
    
    // Reset classes
    statusEl.className = '';
    statusEl.style.cssText = '';
    
    if (status === 'success') {
        statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
        statusEl.style.border = '1px solid #10b981';
        statusEl.style.color = '#10b981';
        statusEl.style.padding = '0.75rem';
        statusEl.style.borderRadius = '0.5rem';
        statusEl.style.marginBottom = '1rem';
    } else if (status === 'error') {
        statusEl.style.background = 'rgba(239, 68, 68, 0.15)';
        statusEl.style.border = '1px solid #ef4444';
        statusEl.style.color = '#ef4444';
        statusEl.style.padding = '0.75rem';
        statusEl.style.borderRadius = '0.5rem';
        statusEl.style.marginBottom = '1rem';
    } else {
        statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
        statusEl.style.border = '1px solid #f59e0b';
        statusEl.style.color = '#f59e0b';
        statusEl.style.padding = '0.75rem';
        statusEl.style.borderRadius = '0.5rem';
        statusEl.style.marginBottom = '1rem';
    }
    
    // Auto-esconder após 5 segundos
    setTimeout(() => {
        if (statusEl.style.display !== 'none') {
            statusEl.style.display = 'none';
        }
    }, 5000);
}

// ============================================
// RENDERIZAÇÃO (USANDO FUNÇÕES DO WINDOW)
// ============================================
function renderAbout(data) {
    if (!data) {
        console.warn('⚠️ Sem dados para renderizar');
        return;
    }

    console.log('🎨 Renderizando dados do about...');

    // Verificar se as funções globais existem
    const parseMarkdownFn = window.parseMarkdown || function(text) { 
        if (!text) return '';
        
        let html = text;
        html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^[\s]*[-*+] (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/^[\s]*\d+\. (.*$)/gm, '<li>$1</li>');
        html = html.replace(/\n/g, '<br>');
        return html;
    };
    
    const interpolateFn = window.interpolate || function(template, data) {
        if (!template || typeof template !== 'string') return template;
        function getByPath(obj, path) {
            return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), obj);
        }
        return template.replace(/{{\s*([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?}}/g, (match, path, modifier) => {
            const keyPath = path.trim();
            if (!data) return '';
            const val = getByPath(data, keyPath);
            if (val === undefined || val === null) return '';
            const out = Array.isArray(val) ? val.join(', ') : String(val);
            return out;
        });
    };

    // Bio - Sobre Mim
    const bioContainer = document.getElementById('profile-bio');
    if (bioContainer && data.bio) {
        if (Array.isArray(data.bio)) {
            bioContainer.innerHTML = data.bio.map(line => `<p>${interpolateFn(line, data)}</p>`).join('');
        } else if (typeof data.bio === 'string') {
            bioContainer.innerHTML = `<p>${interpolateFn(data.bio, data)}</p>`;
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

    // Descrição (com Markdown)
    const descriptionEl = document.getElementById('profile-description');
    if (descriptionEl && data.description) {
        descriptionEl.innerHTML = parseMarkdownFn(data.description);
        console.log('✅ Descrição renderizada com Markdown');
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
        
        const hasSkills = Object.values(data.skills).some(items => items && items.length > 0);
        
        if (hasSkills) {
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
        } else {
            skillsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-secondary-text);">Nenhuma habilidade cadastrada.</p>`;
        }
    }

    // Interesses
    const interestsGrid = document.getElementById('interests-grid');
    if (interestsGrid && data.interests) {
        if (data.interests.length > 0) {
            interestsGrid.innerHTML = data.interests.map(interest => 
                `<div class="interest-item">${interest}</div>`
            ).join('');
        } else {
            interestsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-secondary-text);">Nenhum interesse cadastrado.</p>`;
        }
    }

    // Badges
    const badgesList = document.getElementById('badges-list');
    if (badgesList && data.badges) {
        if (data.badges.length > 0) {
            badgesList.innerHTML = data.badges.map(badge => 
                `<span class="badge">${badge}</span>`
            ).join('');
        } else {
            badgesList.innerHTML = `<span class="badge">Nenhum badge cadastrado</span>`;
        }
    }

    // História
    const historyEl = document.getElementById('profile-history');
    if (historyEl && data.history) {
        if (Array.isArray(data.history)) {
            historyEl.innerHTML = data.history.map(line => `<p>${interpolateFn(line, data)}</p>`).join('');
        } else if (typeof data.history === 'string') {
            historyEl.innerHTML = `<p>${interpolateFn(data.history, data)}</p>`;
        }
    }
}

// ============================================
// MODAL DE LOGIN
// ============================================
function showLoginModal() {
    // Verificar se já existe um modal aberto
    const existing = document.querySelector('.login-modal-overlay');
    if (existing) {
        existing.style.display = 'flex';
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'login-modal-overlay';
    modal.id = 'login-modal-overlay-custom';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    `;
    
    modal.innerHTML = `
        <div class="login-modal" style="
            background: var(--bg-secondary, #12121f);
            border: 1px solid var(--glass-border, rgba(139, 92, 246, 0.15));
            border-radius: 1rem;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
            <h2 style="color: var(--color-primary, #8b5cf6); margin-bottom: 0.5rem;">🔐 Acesso ao About</h2>
            <p style="color: var(--color-secondary-text, #c4b5d4); margin-bottom: 1.5rem;">Faça login para editar o conteúdo</p>
            
            <form id="login-form-custom">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="login-username-custom" style="display: block; color: var(--color-text, #f0f0ff); margin-bottom: 0.3rem; font-weight: 600;">Usuário</label>
                    <input type="text" id="login-username-custom" placeholder="Usuário" required autocomplete="username" style="
                        width: 100%;
                        padding: 0.6rem 0.8rem;
                        border: 1px solid var(--glass-border, rgba(139, 92, 246, 0.15));
                        border-radius: 0.5rem;
                        background: var(--bg-primary, #0a0a0f);
                        color: var(--color-text, #f0f0ff);
                        font-size: 1rem;
                    ">
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="login-password-custom" style="display: block; color: var(--color-text, #f0f0ff); margin-bottom: 0.3rem; font-weight: 600;">Senha</label>
                    <input type="password" id="login-password-custom" placeholder="Senha" required autocomplete="current-password" style="
                        width: 100%;
                        padding: 0.6rem 0.8rem;
                        border: 1px solid var(--glass-border, rgba(139, 92, 246, 0.15));
                        border-radius: 0.5rem;
                        background: var(--bg-primary, #0a0a0f);
                        color: var(--color-text, #f0f0ff);
                        font-size: 1rem;
                    ">
                </div>
                
                <div class="form-actions" style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <button type="submit" class="btn-login" style="
                        flex: 1;
                        padding: 0.6rem 1.5rem;
                        background: var(--color-primary, #8b5cf6);
                        color: white;
                        border: none;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Entrar</button>
                    <button type="button" class="btn-cancel" onclick="this.closest('.login-modal-overlay').remove()" style="
                        padding: 0.6rem 1.5rem;
                        background: transparent;
                        color: var(--color-text, #f0f0ff);
                        border: 1px solid var(--glass-border, rgba(139, 92, 246, 0.15));
                        border-radius: 0.5rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Cancelar</button>
                </div>
                
                <div id="login-error-custom" class="login-error" style="color: #ef4444; margin-top: 0.5rem; font-size: 0.9rem;"></div>
                <div id="login-success-custom" class="login-success" style="color: #10b981; margin-top: 0.5rem; font-size: 0.9rem;"></div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('login-form-custom').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username-custom').value;
        const password = document.getElementById('login-password-custom').value;
        
        const errorEl = document.getElementById('login-error-custom');
        const successEl = document.getElementById('login-success-custom');
        
        errorEl.textContent = '';
        successEl.textContent = '';
        
        const result = await login(username, password);
        if (result.success) {
            successEl.textContent = '✅ Login realizado com sucesso!';
            setTimeout(() => {
                modal.remove();
                const editBtn = document.getElementById('edit-btn');
                if (editBtn) {
                    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
                    editBtn.style.background = 'var(--color-primary, #8b5cf6)';
                    editBtn.style.color = 'white';
                    editBtn.style.border = '2px solid var(--color-primary, #8b5cf6)';
                }
                updateConnectionStatus('success', '✅ Login realizado com sucesso!');
                loadAboutData().then(() => renderAbout(aboutData));
            }, 1000);
        } else {
            errorEl.textContent = '❌ ' + (result.message || 'Usuário ou senha incorretos');
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
    
    if (!overlay || !container) {
        console.error('❌ Elementos do modal de edição não encontrados');
        return;
    }
    
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
    console.log('🌐 Hostname:', window.location.hostname);
    
    // Mostrar status de carregamento
    updateConnectionStatus('loading', '🔄 Carregando dados...');
    
    // Carregar dados
    const aboutLoaded = await loadAboutData();
    await loadProfileData();
    
    // Renderizar
    if (aboutLoaded && aboutData) {
        renderAbout(aboutData);
        updateConnectionStatus('success', '✅ Dados carregados com sucesso!');
    } else {
        updateConnectionStatus('error', '⚠️ Não foi possível carregar os dados');
    }
    
    // Verificar autenticação
    const isAuth = await checkAuth();
    const editBtn = document.getElementById('edit-btn');
    
    if (editBtn) {
        if (isAuth) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
            editBtn.title = 'Editar informações do perfil';
            editBtn.style.background = 'var(--color-primary, #8b5cf6)';
            editBtn.style.color = 'white';
            editBtn.style.border = '2px solid var(--color-primary, #8b5cf6)';
        } else {
            editBtn.innerHTML = '<i class="fas fa-lock"></i> Login para Editar';
            editBtn.title = 'Faça login para editar o perfil';
            editBtn.style.background = 'rgba(139, 92, 246, 0.15)';
            editBtn.style.color = 'var(--color-text, #f0f0ff)';
            editBtn.style.border = '2px solid rgba(139, 92, 246, 0.3)';
        }
        editBtn.style.display = 'inline-flex';
        editBtn.style.padding = '0.6rem 1.5rem';
        editBtn.style.borderRadius = '0.5rem';
        editBtn.style.fontWeight = '600';
        editBtn.style.cursor = 'pointer';
        editBtn.style.transition = 'all 0.3s ease';
        editBtn.style.gap = '0.5rem';
        editBtn.style.alignItems = 'center';
    } else {
        console.warn('⚠️ Botão de edição não encontrado no DOM');
    }
    
    // Event Listeners
    document.getElementById('edit-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
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
    
    console.log('✅ About inicializado com sucesso!');
});