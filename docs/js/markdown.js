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
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Listas ordenadas
    html = html.replace(/^[\s]*\d+\. (.*$)/gm, '<li>$1</li>');
    
    // Quebras de linha
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
}

/**
 * Processa texto com Markdown e interpolação
 * @param {string} text - Texto com Markdown e {{variaveis}}
 * @param {object} data - Dados para interpolação
 * @returns {string} HTML processado
 */
export function processText(text, data) {
    if (!text) return '';
    const interpolated = interpolate(text, data);
    return parseMarkdown(interpolated);
}

// Expor globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.parseMarkdown = parseMarkdown;
    window.interpolate = interpolate;
    window.processText = processText;
}