// ============================================
// SISTEMA DE AUTENTICAÇÃO - CURRICULUM
// ============================================

// Credenciais simples (em produção, usar backend seguro)
const CREDENTIALS = {
  username: 'admin',
  password: 'densuki123',
  email: 'joaogabriel4175@gmail.com'
};

// ============================================
// AUTENTICAÇÃO
// ============================================

function isAuthenticated() {
  return localStorage.getItem('curriculumAuth') === 'authenticated';
}

function login(username, password) {
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    localStorage.setItem('curriculumAuth', 'authenticated');
    localStorage.setItem('curriculumUser', username);
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('curriculumAuth');
  localStorage.removeItem('curriculumUser');
  location.reload();
}

function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'login-modal-overlay';
  modal.innerHTML = `
    <div class="login-modal">
      <h2>🔐 Acesso ao Currículo</h2>
      <p>Faça login para editar o currículo</p>
      
      <form id="login-form">
        <div class="form-group">
          <label for="username">Usuário</label>
          <input type="text" id="username" placeholder="Usuário" required>
        </div>
        
        <div class="form-group">
          <label for="password">Senha</label>
          <input type="password" id="password" placeholder="Senha" required>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-login">Entrar</button>
          <button type="button" class="btn-cancel" onclick="this.closest('.login-modal-overlay').remove()">Cancelar</button>
        </div>
        
        <div id="login-error" class="login-error"></div>
      </form>
      
      <div class="login-info">
        <p><small>Demo: admin / densuki123</small></p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (login(username, password)) {
      modal.remove();
      location.reload();
    } else {
      document.getElementById('login-error').textContent = '❌ Usuário ou senha incorretos';
    }
  });
}

// ============================================
// CRUD - CURRICULUM DATA
// ============================================

function getCurriculumData() {
  const stored = localStorage.getItem('curriculumData');
  if (stored) {
    return JSON.parse(stored);
  }
  // Se não houver dados locais, tentar carregar do JSON
  return null;
}

function saveCurriculumData(data) {
  localStorage.setItem('curriculumData', JSON.stringify(data));
  localStorage.setItem('lastEditTime', new Date().toISOString());
}

function updateField(section, fieldPath, value) {
  let data = getCurriculumData();
  if (!data) return false;
  
  const keys = fieldPath.split('.');
  let obj = data[section];
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  
  obj[keys[keys.length - 1]] = value;
  saveCurriculumData(data);
  return true;
}

function addItem(section, item) {
  let data = getCurriculumData();
  if (!data) return false;
  
  if (!Array.isArray(data[section])) {
    data[section] = [];
  }
  
  item.id = `${section}-${Date.now()}`;
  data[section].push(item);
  saveCurriculumData(data);
  return true;
}

function removeItem(section, itemId) {
  let data = getCurriculumData();
  if (!data) return false;
  
  if (Array.isArray(data[section])) {
    data[section] = data[section].filter(item => item.id !== itemId);
    saveCurriculumData(data);
    return true;
  }
  return false;
}

function updateItem(section, itemId, updates) {
  let data = getCurriculumData();
  if (!data) return false;
  
  if (Array.isArray(data[section])) {
    const item = data[section].find(i => i.id === itemId);
    if (item) {
      Object.assign(item, updates);
      saveCurriculumData(data);
      return true;
    }
  }
  return false;
}

// ============================================
// EXPORT PARA DOWNLOAD
// ============================================

function exportToJSON() {
  const data = getCurriculumData();
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
  element.setAttribute('download', 'curriculum.json');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isAuthenticated,
    login,
    logout,
    showLoginModal,
    getCurriculumData,
    saveCurriculumData,
    updateField,
    addItem,
    removeItem,
    updateItem,
    exportToJSON
  };
}
