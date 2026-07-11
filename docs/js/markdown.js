// markdown.js - Versão melhorada
// ============================================
// MARKDOWN - Módulo de Processamento
// ============================================

/**
 * Converte texto Markdown para HTML
 * @param {string} text - Texto em Markdown
 * @returns {string} HTML formatado
 */
export function parseMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    
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
    // Agrupa itens de lista consecutivos
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ul>${match.trim()}</ul>`);
    
    // Listas ordenadas
    html = html.replace(/^[\s]*\d+\. (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ol>${match.trim()}</ol>`);
    
    // Quebras de linha (preservando as tags HTML)
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

/**
 * Interpola variáveis em um template {{variavel}}
 * @param {string} template - Template com {{variaveis}}
 * @param {object} data - Objeto com os dados para interpolação
 * @returns {string} Template interpolado
 */
export function interpolate(template, data) {
    if (!template || typeof template !== 'string') return template;
    
    function getByPath(obj, path) {
        if (!obj) return undefined;
        return path.split('.').reduce((acc, p) => {
            if (acc && acc[p] !== undefined && acc[p] !== null) {
                return acc[p];
            }
            return undefined;
        }, obj);
    }
    
    return template.replace(/{{\s*([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?}}/g, (match, path, modifier) => {
        const keyPath = path.trim();
        if (!data) return '';
        
        let val = getByPath(data, keyPath);
        
        if (val === undefined || val === null) {
            // Tenta buscar no identity também
            if (data.identity) {
                val = getByPath(data.identity, keyPath);
            }
            // Tenta buscar no status
            if (val === undefined && data.status) {
                val = getByPath(data.status, keyPath);
            }
            // Tenta buscar no location
            if (val === undefined && data.location) {
                val = getByPath(data.location, keyPath);
            }
        }
        
        if (val === undefined || val === null) return '';
        
        // Se for array, converte para string
        if (Array.isArray(val)) {
            return val.join(', ');
        }
        
        // Se for booleano, converte para sim/não
        if (typeof val === 'boolean') {
            return val ? '✅ Sim' : '❌ Não';
        }
        
        return String(val);
    });
}

/**
 * Processa texto com Markdown e interpolação
 * @param {string} text - Texto com Markdown e {{variaveis}}
 * @param {object} data - Dados para interpolação
 * @returns {string} HTML processado
 */
export function processText(text, data) {
    if (!text) return '';
    // Primeiro interpola as variáveis
    const interpolated = interpolate(text, data);
    // Depois processa o Markdown/HTML
    // Se o texto já contém HTML, o parseMarkdown vai preservar as tags
    return parseMarkdown(interpolated);
}

// Expor globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.parseMarkdown = parseMarkdown;
    window.interpolate = interpolate;
    window.processText = processText;
}