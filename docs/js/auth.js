// ============================================
// AUTH - Módulo de Autenticação
// ============================================

// ============================================
// CONFIGURAÇÃO
// ============================================
const AUTH_CONFIG = {
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
let authCheckInterval = null;
const API_BASE = AUTH_CONFIG.getApiUrl();

console.log('🔐 Auth API URL:', API_BASE);

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Verifica se o usuário está autenticado
 * @returns {Promise<boolean>}
 */
export async function checkAuth() {
    const token = localStorage.getItem('curriculumToken');
    if (!token) {
        console.log('🔑 Nenhum token encontrado');
        return false;
    }
    
    try {
        console.log('🔍 Verificando token...');
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentToken = token;
            console.log('✅ Usuário autenticado:', currentUser.username);
            return true;
        } else {
            console.warn('⚠️ Token inválido ou expirado:', response.status);
            clearAuth();
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return false;
    }
}

/**
 * Realiza login do usuário
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
export async function login(username, password) {
    try {
        console.log('🔐 Tentando login para:', username);
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('curriculumToken', data.token);
            currentUser = data.user;
            currentToken = data.token;
            console.log('✅ Login realizado com sucesso:', currentUser.username);
            startAuthCheck();
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

/**
 * Realiza logout do usuário
 */
export function logout() {
    clearAuth();
    console.log('👋 Usuário deslogado');
    // Não recarregar a página automaticamente, deixar o componente decidir
}

/**
 * Limpa os dados de autenticação
 */
function clearAuth() {
    localStorage.removeItem('curriculumToken');
    currentUser = null;
    currentToken = null;
    if (authCheckInterval) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
    }
}

/**
 * Inicia verificação periódica de autenticação
 */
function startAuthCheck() {
    if (authCheckInterval) {
        clearInterval(authCheckInterval);
    }
    authCheckInterval = setInterval(async () => {
        const token = localStorage.getItem('curriculumToken');
        if (!token) {
            clearAuth();
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('⚠️ Sessão expirada');
                clearAuth();
            }
        } catch (error) {
            console.error('❌ Erro na verificação periódica:', error);
        }
    }, 60000); // Verificar a cada 1 minuto
}

/**
 * Obtém o usuário atual
 * @returns {object|null}
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Obtém o token atual
 * @returns {string|null}
 */
export function getCurrentToken() {
    return currentToken;
}

/**
 * Obtém a URL base da API
 * @returns {string}
 */
export function getApiBase() {
    return API_BASE;
}

/**
 * Verifica se o usuário está autenticado (síncrono)
 * @returns {boolean}
 */
export function isAuthenticated() {
    return !!currentToken;
}

// Expor globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.Auth = {
        checkAuth,
        login,
        logout,
        getCurrentUser,
        getCurrentToken,
        getApiBase,
        isAuthenticated
    };
}