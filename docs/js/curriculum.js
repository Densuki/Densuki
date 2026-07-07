// ============================================
// CURRICULUM - Módulo Principal
// ============================================

import { parseMarkdown, interpolate, processText } from './markdown.js';
import { checkAuth, login, logout, getCurrentUser, getCurrentToken, getApiBase, isAuthenticated } from './auth.js';

// ============================================
// ESTADO GLOBAL
// ============================================
let curriculumData = null;
const API_BASE = getApiBase();

console.log('🔗 Curriculum API URL:', API_BASE);

// ============================================
// FUNÇÕES DE CURRÍCULO
// ============================================
async function loadCurriculum() {
    try {
        console.log('📡 Carregando currículo de:', `${API_BASE}/curriculum`);
        // REMOVIDO: headers com Cache-Control para evitar CORS
        const response = await fetch(`${API_BASE}/curriculum`);
        
        if (response.ok) {
            curriculumData = await response.json();
            renderCurriculum(curriculumData);
            return true;
        } else {
            console.error('❌ Erro ao carregar currículo:', response.status, response.statusText);
            showError('Erro ao carregar currículo', `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar currículo:', error);
        showError('Erro ao carregar currículo', 'Não foi possível conectar ao servidor.');
        return false;
    }
}

async function saveCurriculum(data) {
    const token = getCurrentToken();
    if (!token) {
        showLoginModal();
        return false;
    }
    
    try {
        console.log('💾 Salvando currículo...');
        const response = await fetch(`${API_BASE}/curriculum`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                // REMOVIDO: 'Cache-Control' para evitar CORS
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showEditStatus('✅ ' + (result.message || 'Currículo salvo com sucesso!'), 'success');
            await loadCurriculum();
            return true;
        } else if (response.status === 401) {
            console.warn('⚠️ Sessão expirada, solicitando novo login');
            logout();
            showLoginModal();
            return false;
        } else {
            const error = await response.json();
            showEditStatus('❌ ' + (error.message || 'Erro ao salvar'), 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar currículo:', error);
        showEditStatus('❌ Erro de conexão com o servidor', 'error');
        return false;
    }
}

function showError(title, message) {
    const container = document.getElementById('curriculum-content');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>${title}</h3>
                <p style="color: var(--color-secondary-text);">${message}</p>
                <p style="color: var(--color-secondary-text); font-size: 0.9rem; margin-top: 0.5rem;">
                    Certifique-se que o servidor Flask está rodando em <code>${API_BASE}</code>
                </p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// ============================================
// RENDERIZAÇÃO DO CURRÍCULO
// ============================================
function renderCurriculum(data) {
    const container = document.getElementById('curriculum-content');
    if (!container) return;
    
    const categoryLabels = {
        'core': 'Soft Skills',
        'technical': 'Hard Skills'
    };
    
    container.innerHTML = `
        <!-- HEADER -->
        <div class="curriculum-header">
            <h1 class="curriculum-name">${data.contact?.name || 'João Gabriel Sousa Santos'}</h1>
            <div class="curriculum-contact">
                ${data.contact?.location ? `<div class="curriculum-contact-item"><i class="fas fa-map-marker-alt"></i><span>${data.contact.location}</span></div>` : ''}
                ${data.contact?.phone ? `<div class="curriculum-contact-item"><i class="fas fa-phone"></i><span>${data.contact.phone}</span></div>` : ''}
                ${data.contact?.email ? `<div class="curriculum-contact-item"><i class="fas fa-envelope"></i><a href="mailto:${data.contact.email}">${data.contact.email}</a></div>` : ''}
                ${data.contact?.linkedin ? `<div class="curriculum-contact-item"><i class="fab fa-linkedin"></i><a href="https://${data.contact.linkedin}" target="_blank">${data.contact.linkedin}</a></div>` : ''}
                ${data.contact?.github ? `<div class="curriculum-contact-item"><i class="fab fa-github"></i><a href="https://${data.contact.github}" target="_blank">${data.contact.github}</a></div>` : ''}
            </div>
        </div>

        <!-- OBJETIVO -->
        ${data.objective ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-bullseye"></i> Objetivo Profissional</h2>
            <p class="objective-text">${data.objective}</p>
        </div>` : ''}

        <!-- RESUMO -->
        ${data.summary ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-user-tie"></i> Resumo Profissional</h2>
            <p class="resume-text">${data.summary}</p>
        </div>` : ''}

        <!-- FORMAÇÃO ACADÊMICA -->
        ${data.education?.length ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-graduation-cap"></i> Formação Acadêmica</h2>
            ${data.education.map(edu => `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${edu.degree}</div>
                            ${edu.institution ? `<div class="item-subtitle">${edu.institution}</div>` : ''}
                        </div>
                        <div class="item-period">${edu.period || ''} ${edu.status ? `(${getEducationStatusLabel(edu.status)})` : ''}</div>
                    </div>
                </div>
            `).join('')}
        </div>` : ''}

        <!-- CURSOS E CERTIFICAÇÕES -->
        ${data.courses?.length ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-certificate"></i> Cursos e Certificações</h2>
            ${data.courses.map(course => `
                <div class="course-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${course.title}</div>
                            ${course.institution ? `<div class="item-subtitle">${course.institution}</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            ${course.duration ? `<span style="color: var(--color-secondary-text);">${course.duration}</span>` : ''}
                            ${course.status ? `<span class="course-status-tag status-${course.status}">${getCourseStatusLabel(course.status)}</span>` : ''}
                        </div>
                    </div>
                    ${course.description ? `<div class="item-description">${parseMarkdown(course.description)}</div>` : ''}
                </div>
            `).join('')}
        </div>` : ''}

        <!-- COMPETÊNCIAS -->
        ${data.skills && Object.keys(data.skills).length ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-lightbulb"></i> Competências</h2>
            <div class="skills-grid">
                ${Object.entries(data.skills).map(([category, items]) => `
                    <div class="skill-category">
                        <h4>${categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div class="skill-tags">
                            ${items.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        <!-- EXPERIÊNCIAS -->
        ${data.experience?.length ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-briefcase"></i> Experiências Profissionais</h2>
            ${data.experience.map(exp => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${exp.position}</div>
                            <div class="item-subtitle">${exp.company}</div>
                            ${exp.location ? `<div style="color: var(--color-secondary-text); font-size: 0.85rem;">${exp.location}</div>` : ''}
                        </div>
                        <div class="item-period">${exp.startDate || ''} - ${exp.endDate || ''}</div>
                    </div>
                    ${exp.responsibilities?.length ? `
                        <div class="item-description">
                            <ul>
                                ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>` : ''}

        <!-- IDIOMAS -->
        ${data.languages?.length ? `
        <div class="curriculum-section">
            <h2 class="section-title"><i class="fas fa-language"></i> Idiomas</h2>
            <div class="skills-grid">
                ${data.languages.map(lang => `
                    <div class="skill-category">
                        <h4>${lang.language}</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">${lang.proficiency}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
    `;
}

// ============================================
// HELPERS PARA STATUS
// ============================================
function getEducationStatusLabel(status) {
    const labels = {
        'completo': 'Concluído',
        'incompleto': 'Em andamento',
        'trancado': 'Trancado',
        'interrompido': 'Interrompido',
        'concluido': 'Concluído'
    };
    return labels[status] || status;
}

function getCourseStatusLabel(status) {
    const labels = {
        'concluido': '✅ Concluído',
        'andamento': '🔄 Em andamento',
        'planejado': '📋 Planejado',
        'cancelado': '❌ Cancelado',
        'pendente': '⏳ Pendente'
    };
    return labels[status] || status;
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
            <h2 style="color: var(--color-primary, #8b5cf6); margin-bottom: 0.5rem;">🔐 Acesso ao Currículo</h2>
            <p style="color: var(--color-secondary-text, #c4b5d4); margin-bottom: 1.5rem;">Faça login para editar o currículo</p>
            
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
                    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Currículo';
                    editBtn.style.display = 'inline-flex';
                }
                updateUIForAuth(true);
                loadCurriculum();
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
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Currículo';
        editBtn.title = 'Editar currículo';
        editBtn.style.background = 'var(--color-primary, #8b5cf6)';
        editBtn.style.color = 'white';
        editBtn.style.border = '2px solid var(--color-primary, #8b5cf6)';
        editBtn.style.display = 'inline-flex';
    } else {
        editBtn.innerHTML = '<i class="fas fa-lock"></i> Login para Editar';
        editBtn.title = 'Faça login para editar o currículo';
        editBtn.style.background = 'rgba(139, 92, 246, 0.15)';
        editBtn.style.color = 'var(--color-text, #f0f0ff)';
        editBtn.style.border = '2px solid rgba(139, 92, 246, 0.3)';
        editBtn.style.display = 'inline-flex';
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
    
    container.innerHTML = generateEditFields(curriculumData);
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function generateEditFields(data) {
    let html = '';
    
    // Contato - Dinâmico
    html += `
        <div class="edit-section">
            <h3>📋 Contato</h3>
            <div id="contact-fields">
                ${data.contact ? Object.entries(data.contact).map(([key, value], index) => `
                    <div class="edit-item" data-contact-index="${index}">
                        <div class="edit-field" style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; align-items: center;">
                            <label>Título</label>
                            <input type="text" value="${key}" data-contact-path="key.${index}" placeholder="Ex: Telefone, Email, etc">
                        </div>
                        <div class="edit-field" style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; align-items: center;">
                            <label>Valor</label>
                            <input type="text" value="${value || ''}" data-contact-path="value.${index}" placeholder="Ex: (85) 9 9217-1191">
                        </div>
                        <button type="button" class="btn-remove-item" onclick="window.removeContactItem(${index})">Remover</button>
                    </div>
                `).join('') : ''}
            </div>
            <button type="button" class="btn-add-item" onclick="window.addContactItem()">+ Adicionar Contato</button>
        </div>
    `;
    
    // Objetivo
    html += `
        <div class="edit-section">
            <h3>🎯 Objetivo Profissional</h3>
            <div class="edit-field">
                <textarea id="objective" data-path="objective" rows="3">${data.objective || ''}</textarea>
            </div>
        </div>
    `;
    
    // Resumo
    html += `
        <div class="edit-section">
            <h3>📝 Resumo Profissional</h3>
            <div class="edit-field">
                <textarea id="summary" data-path="summary" rows="4">${data.summary || ''}</textarea>
            </div>
        </div>
    `;
    
    // Formação
    html += `
        <div class="edit-section">
            <h3>🎓 Formação Acadêmica</h3>
            <div id="education-fields">
                ${data.education?.map((edu, index) => `
                    <div class="edit-item" data-index="${index}">
                        <h4>Formação ${index + 1}</h4>
                        <div class="edit-field">
                            <label>Curso</label>
                            <input type="text" value="${edu.degree || ''}" data-path="education.${index}.degree">
                        </div>
                        <div class="edit-field">
                            <label>Instituição</label>
                            <input type="text" value="${edu.institution || ''}" data-path="education.${index}.institution">
                        </div>
                        <div class="edit-field">
                            <label>Período</label>
                            <input type="text" value="${edu.period || ''}" data-path="education.${index}.period" placeholder="Ex: 2020 - 2024">
                        </div>
                        <div class="edit-field">
                            <label>Status</label>
                            <select data-path="education.${index}.status">
                                <option value="concluido" ${edu.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                                <option value="incompleto" ${edu.status === 'incompleto' ? 'selected' : ''}>🔄 Em andamento</option>
                                <option value="trancado" ${edu.status === 'trancado' ? 'selected' : ''}>⏸️ Trancado</option>
                                <option value="interrompido" ${edu.status === 'interrompido' ? 'selected' : ''}>⛔ Interrompido</option>
                                <option value="completo" ${edu.status === 'completo' ? 'selected' : ''}>✅ Concluído</option>
                            </select>
                        </div>
                        <button type="button" class="btn-remove-item" onclick="window.removeEducationItem(${index})">Remover</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-add-item" onclick="window.addEducationItem()">+ Adicionar Formação</button>
        </div>
    `;
    
    // Cursos
    html += `
        <div class="edit-section">
            <h3>📚 Cursos</h3>
            <p style="color: var(--color-secondary-text); font-size: 0.85rem; margin-bottom: 1rem;">
                💡 Na descrição você pode usar <strong>Markdown</strong>: 
                <code>**negrito**</code>, <code>*itálico*</code>, 
                <code>- item</code> para listas, <code># Título</code>
            </p>
            <div id="courses-fields">
                ${data.courses?.map((course, index) => `
                    <div class="edit-item" data-index="${index}">
                        <h4>Curso ${index + 1}</h4>
                        <div class="edit-field">
                            <label>Título *</label>
                            <input type="text" value="${course.title || ''}" data-path="courses.${index}.title" placeholder="Nome do curso" required>
                        </div>
                        <div class="edit-field">
                            <label>Instituição</label>
                            <input type="text" value="${course.institution || ''}" data-path="courses.${index}.institution" placeholder="Instituição/Plataforma">
                        </div>
                        <div class="edit-field">
                            <label>Duração</label>
                            <input type="text" value="${course.duration || ''}" data-path="courses.${index}.duration" placeholder="Ex: 40h, 6 meses">
                        </div>
                        <div class="edit-field">
                            <label>Status (opcional)</label>
                            <select data-path="courses.${index}.status">
                                <option value="">-- Selecione --</option>
                                <option value="concluido" ${course.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                                <option value="andamento" ${course.status === 'andamento' ? 'selected' : ''}>🔄 Em andamento</option>
                                <option value="planejado" ${course.status === 'planejado' ? 'selected' : ''}>📋 Planejado</option>
                                <option value="cancelado" ${course.status === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                                <option value="pendente" ${course.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                            </select>
                        </div>
                        <div class="edit-field">
                            <label>Descrição (opcional - suporta Markdown)</label>
                            <textarea data-path="courses.${index}.description" rows="4" placeholder="Use Markdown para formatar:&#10;**negrito** *itálico*&#10;- item 1&#10;- item 2&#10;## Subtítulo">${course.description || ''}</textarea>
                        </div>
                        <button type="button" class="btn-remove-item" onclick="window.removeCourseItem(${index})">Remover</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-add-item" onclick="window.addCourseItem()">+ Adicionar Curso</button>
        </div>
    `;
    
    // Competências
    html += `
        <div class="edit-section">
            <h3>💡 Competências</h3>
            <div class="edit-field">
                <label>Soft Skills (separadas por vírgula)</label>
                <input type="text" id="skills-core" value="${data.skills?.core?.join(', ') || ''}" data-path="skills.core" data-type="array" placeholder="Comunicação, Liderança, Trabalho em Equipe">
            </div>
            <div class="edit-field">
                <label>Hard Skills (separadas por vírgula)</label>
                <input type="text" id="skills-technical" value="${data.skills?.technical?.join(', ') || ''}" data-path="skills.technical" data-type="array" placeholder="JavaScript, Python, HTML, CSS">
            </div>
        </div>
    `;
    
    // Experiências
    html += `
        <div class="edit-section">
            <h3>💼 Experiências Profissionais</h3>
            <div id="experience-fields">
                ${data.experience?.map((exp, index) => `
                    <div class="edit-item" data-index="${index}">
                        <h4>Experiência ${index + 1}</h4>
                        <div class="edit-field">
                            <label>Empresa *</label>
                            <input type="text" value="${exp.company || ''}" data-path="experience.${index}.company" placeholder="Nome da empresa" required>
                        </div>
                        <div class="edit-field">
                            <label>Cargo *</label>
                            <input type="text" value="${exp.position || ''}" data-path="experience.${index}.position" placeholder="Seu cargo" required>
                        </div>
                        <div class="edit-field">
                            <label>Localização</label>
                            <input type="text" value="${exp.location || ''}" data-path="experience.${index}.location" placeholder="Cidade - Estado">
                        </div>
                        <div class="edit-field">
                            <label>Data Início</label>
                            <input type="text" value="${exp.startDate || ''}" data-path="experience.${index}.startDate" placeholder="DD/MM/YYYY">
                        </div>
                        <div class="edit-field">
                            <label>Data Fim</label>
                            <input type="text" value="${exp.endDate || ''}" data-path="experience.${index}.endDate" placeholder="DD/MM/YYYY ou 'atual'">
                        </div>
                        <div class="edit-field">
                            <label>Responsabilidades (uma por linha)</label>
                            <textarea data-path="experience.${index}.responsibilities" data-type="array-lines" rows="3" placeholder="• Responsabilidade 1&#10;• Responsabilidade 2">${exp.responsibilities?.join('\n') || ''}</textarea>
                        </div>
                        <button type="button" class="btn-remove-item" onclick="window.removeExperienceItem(${index})">Remover</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-add-item" onclick="window.addExperienceItem()">+ Adicionar Experiência</button>
        </div>
    `;
    
    // Idiomas
    html += `
        <div class="edit-section">
            <h3>🌐 Idiomas</h3>
            <div id="languages-fields">
                ${data.languages?.map((lang, index) => `
                    <div class="edit-item" data-index="${index}">
                        <h4>Idioma ${index + 1}</h4>
                        <div class="edit-field">
                            <label>Idioma *</label>
                            <input type="text" value="${lang.language || ''}" data-path="languages.${index}.language" placeholder="Ex: Inglês, Espanhol" required>
                        </div>
                        <div class="edit-field">
                            <label>Proficiência</label>
                            <select data-path="languages.${index}.proficiency">
                                <option value="Básico" ${lang.proficiency === 'Básico' ? 'selected' : ''}>Básico</option>
                                <option value="Intermediário" ${lang.proficiency === 'Intermediário' ? 'selected' : ''}>Intermediário</option>
                                <option value="Avançado" ${lang.proficiency === 'Avançado' ? 'selected' : ''}>Avançado</option>
                                <option value="Fluente" ${lang.proficiency === 'Fluente' ? 'selected' : ''}>Fluente</option>
                                <option value="Nativo" ${lang.proficiency === 'Nativo' ? 'selected' : ''}>Nativo</option>
                            </select>
                        </div>
                        <button type="button" class="btn-remove-item" onclick="window.removeLanguageItem(${index})">Remover</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-add-item" onclick="window.addLanguageItem()">+ Adicionar Idioma</button>
        </div>
    `;
    
    return html;
}

// ============================================
// FUNÇÕES DE MANIPULAÇÃO DO FORMULÁRIO
// ============================================
function collectFormData() {
    const form = document.getElementById('curriculum-edit-form');
    const inputs = form.querySelectorAll('[data-path]');
    const data = JSON.parse(JSON.stringify(curriculumData));
    
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
    
    const contactItems = document.querySelectorAll('#contact-fields .edit-item');
    if (contactItems.length > 0) {
        data.contact = {};
        contactItems.forEach(item => {
            const titleInput = item.querySelector('[data-contact-path*="key"]');
            const valueInput = item.querySelector('[data-contact-path*="value"]');
            if (titleInput && valueInput && titleInput.value.trim()) {
                data.contact[titleInput.value.trim()] = valueInput.value || '';
            }
        });
    }
    
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
// FUNÇÕES DE ADICIONAR/REMOVER ITENS
// ============================================
// [Todas as funções window.addXxxItem e window.removeXxxItem permanecem iguais]
// (mantidas do original para não alongar)

// ============================================
// MÓDULO DE DOWNLOAD - PDF
// ============================================
const CurriculumPDF = {
    async generate(data) {
        const element = document.getElementById('curriculum-content');
        if (typeof html2pdf === 'undefined') {
            console.error('❌ html2pdf não está carregado');
            alert('Biblioteca de PDF não encontrada. Verifique a conexão com a internet.');
            return false;
        }
        
        const opt = {
            margin: 10,
            filename: 'Curriculo_JoaoGabriel.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { 
                orientation: 'portrait', 
                unit: 'mm', 
                format: 'a4',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        try {
            await html2pdf().set(opt).from(element).save();
            return true;
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
            return false;
        }
    },
    
    async print(data) {
        const element = document.getElementById('curriculum-content');
        if (typeof html2pdf === 'undefined') {
            console.error('❌ html2pdf não está carregado');
            window.print();
            return false;
        }
        
        const opt = {
            margin: 10,
            filename: 'Curriculo_JoaoGabriel.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { 
                orientation: 'portrait', 
                unit: 'mm', 
                format: 'a4',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        try {
            const pdf = await html2pdf().set(opt).from(element).outputPdf('blob');
            const url = URL.createObjectURL(pdf);
            
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.print();
                };
            } else {
                window.print();
            }
            
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            return true;
        } catch (error) {
            console.error('Erro ao imprimir:', error);
            window.print();
            return false;
        }
    }
};

// ============================================
// MÓDULO DE DOWNLOAD - DOCX
// ============================================
const CurriculumDOCX = {
    async download(data) {
        try {
            const btn = document.getElementById('download-docx');
            const originalText = btn?.innerHTML || 'Baixar DOCX';
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando DOCX...';
                btn.disabled = true;
            }
            
            const token = getCurrentToken();
            const response = await fetch(`${API_BASE}/curriculum/download/docx`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Curriculo_JoaoGabriel.docx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                return true;
            } else {
                const error = await response.json();
                console.error('Erro ao gerar DOCX:', error);
                alert('Erro ao gerar o arquivo DOCX: ' + (error.error || 'Erro desconhecido'));
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                return false;
            }
        } catch (error) {
            console.error('Erro ao gerar DOCX:', error);
            alert('Erro de conexão ao gerar o arquivo DOCX');
            const btn = document.getElementById('download-docx');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-file-word"></i> Baixar DOCX';
                btn.disabled = false;
            }
            return false;
        }
    }
};

// ============================================
// INICIALIZAÇÃO DOS BOTÕES DE DOWNLOAD
// ============================================
function initDownloadButtons() {
    document.getElementById('download-pdf')?.addEventListener('click', async () => {
        const btn = document.getElementById('download-pdf');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
        btn.disabled = true;
        
        await CurriculumPDF.generate(curriculumData);
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    });

    document.getElementById('download-docx')?.addEventListener('click', async () => {
        await CurriculumDOCX.download(curriculumData);
    });

    document.getElementById('print-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('print-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando impressão...';
        btn.disabled = true;
        
        await CurriculumPDF.print(curriculumData);
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    });

    document.getElementById('download-repo-pdf')?.addEventListener('click', () => {
        window.open('assets/curriculo_pessoal.pdf', '_blank');
    });

    document.getElementById('download-repo-docx')?.addEventListener('click', () => {
        window.open('assets/curriculo_pessoal.docx', '_blank');
    });
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Inicializando currículo...');
    console.log('🔗 API URL:', API_BASE);
    
    await loadCurriculum();
    
    const isAuth = await checkAuth();
    updateUIForAuth(isAuth);
    
    document.getElementById('edit-btn')?.addEventListener('click', function() {
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
    
    document.getElementById('curriculum-edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = collectFormData();
        if (await saveCurriculum(data)) {
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
    
    initDownloadButtons();
});

// Exportações para compatibilidade
export {
    loadCurriculum,
    saveCurriculum,
    renderCurriculum,
    showEditModal,
    showLoginModal
};