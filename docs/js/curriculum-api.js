// ============================================
// CURRICULUM API - Módulo de Comunicação
// ============================================

const CURRICULUM_API = {
    // Configuração da API
    getBaseUrl() {
        // Detecta o ambiente
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        // Para Codespace
        if (hostname.includes('github.dev')) {
            const port = '5000';
            const baseHost = hostname.replace(/-\d+\.app\.github\.dev$/, '');
            return `https://${baseHost}-${port}.app.github.dev/api`;
        }
        // Para produção (GitHub Pages) - usar API externa ou fallback
        return 'https://densuki-api.onrender.com/api'; // Trocar pela URL real
    },

    // Headers padrão
    getHeaders(token) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // ============================================
    // MÉTODOS DA API
    // ============================================

    // Autenticação
    async login(username, password) {
        try {
            const response = await fetch(`${this.getBaseUrl()}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('curriculumToken', data.token);
                return { success: true, user: data.user, token: data.token };
            }
            const error = await response.json();
            return { success: false, message: error.message || 'Erro ao fazer login' };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },

    async verify(token) {
        try {
            const response = await fetch(`${this.getBaseUrl()}/auth/verify`, {
                headers: this.getHeaders(token)
            });
            if (response.ok) {
                const data = await response.json();
                return { success: true, user: data.user };
            }
            return { success: false };
        } catch (error) {
            return { success: false };
        }
    },

    // Currículo
    async getCurriculum() {
        try {
            const response = await fetch(`${this.getBaseUrl()}/curriculum`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Erro ao carregar currículo:', error);
            return null;
        }
    },

    async updateCurriculum(data, token) {
        try {
            const response = await fetch(`${this.getBaseUrl()}/curriculum`, {
                method: 'PUT',
                headers: this.getHeaders(token),
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                return { success: true, message: result.message, version: result.version };
            }
            
            if (response.status === 401) {
                localStorage.removeItem('curriculumToken');
                return { success: false, message: 'Sessão expirada. Faça login novamente.', unauthorized: true };
            }
            
            const error = await response.json();
            return { success: false, message: error.message || 'Erro ao salvar' };
        } catch (error) {
            console.error('Erro ao salvar currículo:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },

    async getHistory(token) {
        try {
            const response = await fetch(`${this.getBaseUrl()}/curriculum/history`, {
                headers: this.getHeaders(token)
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            return [];
        }
    },

    // Download dos arquivos do repositório
    getDownloadUrl(fileType) {
        const baseUrl = 'https://raw.githubusercontent.com/Densuki/densuki.github.io/main/docs/assets';
        return `${baseUrl}/curriculo_pessoal.${fileType}`;
    }
};

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CURRICULUM_API;
}