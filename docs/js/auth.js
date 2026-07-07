// ============================================
// ABOUT - Módulo Principal
// ============================================

import { processText, interpolate, parseMarkdown } from './markdown.js';
import { checkAuth, login, logout, getCurrentUser, getCurrentToken, getApiBase, isAuthenticated } from './auth.js';

// ============================================
// ESTADO GLOBAL
// ============================================
let aboutData = null;
let profileData = null;
const API_BASE = getApiBase();

console.log('🔗 About API URL:', API_BASE);

// ============================================
// FUNÇÕES DE CARREGAMENTO
// ============================================
async function loadAboutData() {
    try {
        console.log('📡 Carregando dados do about de:', `${API_BASE}/about`);
        const response = await fetch(`${API_BASE}/about`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
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
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
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
    const token = getCurrentToken();
    if (!token) {
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
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Dados salvos com sucesso:', result);
            showEditStatus('✅ ' + (result.message || 'Dados salvos com sucesso!'), 'success');
            updateConnectionStatus('success', '✅ Dados salvos com sucesso!');
            
            await loadAboutData();
            renderAbout(aboutData);
            return true;
        } else if (response.status === 401) {
            console.warn('⚠️ Sessão expirada, solicitando novo login');
            logout();
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
}

// ============================================
// RENDERIZAÇÃO (USANDO MARKDOWN)
// ============================================
function renderAbout(data) {
    if (!data) {
        console.warn('⚠️ Sem dados para renderizar');
        return;
    }

    console.log('🎨 Renderizando dados do about...');

    // Combinar dados do about com profile para interpolação
    const combinedData = {
        ...profileData,
        ...data
    };
    console.log('📊 Dados combinados para interpolação');

    // Bio - Sobre Mim
    const bioContainer = document.getElementById('profile-bio');
    if (bioContainer && data.bio) {
        let bioHtml = '';
        if (Array.isArray(data.bio)) {
            bioHtml = data.bio.map(line => `<p>${processText(line, combinedData)}</p>`).join('');
        } else if (typeof data.bio === 'string') {
            bioHtml = `<p>${processText(data.bio, combinedData)}</p>`;
        }
        bioContainer.innerHTML = bioHtml;
        console.log('✅ Bio renderizada');
    }

    // Objetivo
    const objectiveEl = document.getElementById('profile-objective');
    if (objectiveEl && data.objective) {
        objectiveEl.textContent = interpolate(data.objective, combinedData);
    }

    // Status
    if (data.status) {
        const workingEl = document.getElementById('profile-working');
        if (workingEl) {
            workingEl.textContent = interpolate(data.status.working || 'Em procura de oportunidades', combinedData);
        }
        
        const studyingEl = document.getElementById('profile-studying');
        if (studyingEl) {
            studyingEl.textContent = interpolate(data.status.studying || 'Aprendizado contínuo', combinedData);
        }
    }

    // Descrição (com Markdown)
    const descriptionEl = document.getElementById('profile-description');
    if (descriptionEl && data.description) {
        descriptionEl.innerHTML = processText(data.description, combinedData);
        console.log('✅ Descrição renderizada com Markdown');
    }

    // Saúde
    const healthEl = document.getElementById('profile-health');
    if (healthEl && data.health) {
        healthEl.textContent = interpolate(data.health, combinedData);
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
        let historyHtml = '';
        if (Array.isArray(data.history)) {
            historyHtml = data.history.map(line => `<p>${processText(line, combinedData)}</p>`).join('');
        } else if (typeof data.history === 'string') {
            historyHtml = `<p>${processText(data.history, combinedData)}</p>`;
        }
        historyEl.innerHTML = historyHtml;
        console.log('✅ História renderizada');
    }
}

// ============================================
// MODAL DE LOGIN
// ============================================
function showLoginModal() {
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
                updateConnectionStatus('success', '✅ Login realizado com sucesso!');
                updateUIForAuth(true);
                loadAboutData().then(() => {
                    loadProfileData().then(() => {
                        renderAbout(aboutData);
                    });
                });
            }, 1000);
        } else {
            errorEl.textContent = '❌ ' + (result.message || 'Usuário ou senha incorretos');
        }
    });
}

// ============================================
// ATUALIZAR UI BASEADO NA AUTENTICAÇÃO
// ============================================
function updateUIForAuth(isAuth) {
    const editBtn = document.getElementById('edit-btn');
    if (!editBtn) return;
    
    if (isAuth) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
        editBtn.title = 'Editar informações do perfil';
        editBtn.style.background = 'var(--color-primary, #8b5cf6)';
        editBtn.style.color = 'white';
        editBtn.style.border = '2px solid var(--color-primary, #8b5cf6)';
        editBtn.style.opacity = '1';
        editBtn.style.cursor = 'pointer';
        editBtn.style.pointerEvents = 'auto';
    } else {
        editBtn.innerHTML = '<i class="fas fa-lock"></i> Login para Editar';
        editBtn.title = 'Faça login para editar o perfil';
        editBtn.style.background = 'rgba(139, 92, 246, 0.15)';
        editBtn.style.color = 'var(--color-text, #f0f0ff)';
        editBtn.style.border = '2px solid rgba(139, 92, 246, 0.3)';
        editBtn.style.opacity = '1';
        editBtn.style.cursor = 'pointer';
        editBtn.style.pointerEvents = 'auto';
    }
}

// ============================================
// MODAL DE EDIÇÃO
// ============================================
function showEditModal() {
    if (!isAuthenticated()) {
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
    
    html += `
        <div class="edit-section">
            <h3>🎯 Objetivo Profissional</h3>
            <div class="edit-field">
                <input type="text" id="objective-edit" data-path="objective" value="${data.objective || ''}" placeholder="Seu objetivo profissional">
            </div>
        </div>
    `;
    
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
    
    html += `
        <div class="edit-section">
            <h3>❤️ Saúde</h3>
            <div class="edit-field">
                <input type="text" id="health-edit" data-path="health" value="${data.health || ''}" placeholder="Ex: Saudável, praticando exercícios">
            </div>
        </div>
    `;
    
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
    
    html += `
        <div class="edit-section">
            <h3>🌟 Interesses</h3>
            <div class="edit-field">
                <label>Interesses (separados por vírgula)</label>
                <input type="text" id="interests-edit" data-path="interests" data-type="array" value="${data.interests?.join(', ') || ''}" placeholder="Anime, Manga, Programação, Música">
            </div>
        </div>
    `;
    
    html += `
        <div class="edit-section">
            <h3>🏷️ Badges</h3>
            <div class="edit-field">
                <label>Badges (separados por vírgula)</label>
                <input type="text" id="badges-edit" data-path="badges" data-type="array" value="${data.badges?.join(', ') || ''}" placeholder="Desenvolvedor, Artista, Escritor">
            </div>
        </div>
    `;
    
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
    
    updateConnectionStatus('loading', '🔄 Carregando dados...');
    
    const aboutLoaded = await loadAboutData();
    await loadProfileData();
    
    if (aboutLoaded && aboutData) {
        renderAbout(aboutData);
        updateConnectionStatus('success', '✅ Dados carregados com sucesso!');
    } else {
        updateConnectionStatus('error', '⚠️ Não foi possível carregar os dados');
    }
    
    const isAuth = await checkAuth();
    updateUIForAuth(isAuth);
    
    document.getElementById('edit-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isAuthenticated()) {
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