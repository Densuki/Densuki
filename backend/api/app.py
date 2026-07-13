# app.py
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, User, CurriculumVersion, AboutVersion, ProfileVersion
from utils.json_utils import load_json_data, save_json_data, get_default_curriculum_data, get_default_about_data
from auth import token_required

# Importar rotas
from routes.auth_routes import register_auth_routes
from routes.curriculum_routes import register_curriculum_routes
from routes.about_routes import register_about_routes
from routes.profile_routes import register_profile_routes
from routes.download_routes import register_download_routes
from routes.debug_routes import register_debug_routes

# OBTENHA O DIRETÓRIO RAIZ DO PROJETO
# backend/api/app.py -> backend/api/ -> backend/ -> raiz do projeto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')

# Criar aplicação com caminho absoluto para a pasta docs
app = Flask(__name__, static_folder=DOCS_DIR, static_url_path='/docs')
app.config.from_object(Config)

@app.route('/assets/icons/<path:filename>')
def serve_icons(filename):
    """Serve ícones da pasta docs/assets/icons"""
    icons_dir = os.path.join(DOCS_DIR, 'assets/icons')
    return send_from_directory(icons_dir, filename)

@app.route('/assets/img/<path:filename>')
def serve_images(filename):
    """Serve imagens da pasta docs/assets/img"""
    img_dir = os.path.join(DOCS_DIR, 'assets/img')
    return send_from_directory(img_dir, filename)

@app.route('/assets/css/<path:filename>')
def serve_css(filename):
    """Serve CSS da pasta docs/assets/css"""
    css_dir = os.path.join(DOCS_DIR, 'assets/css')
    return send_from_directory(css_dir, filename)

@app.route('/site.webmanifest')
def manifest():
    return send_from_directory(os.path.join(DOCS_DIR, 'assets/icons'), 'site.webmanifest')

# Configurar banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = Config.get_database_url()
db.init_app(app)

# Configurar CORS
CORS(app, 
     origins=Config.CORS_ORIGINS + ['*'],
     allow_headers=Config.CORS_ALLOW_HEADERS,
     expose_headers=Config.CORS_EXPOSE_HEADERS,
     supports_credentials=True)

# Registrar rotas
register_auth_routes(app)
register_curriculum_routes(app)
register_about_routes(app)
register_profile_routes(app)
register_download_routes(app)
register_debug_routes(app)

# ============================================
# INICIALIZAÇÃO
# ============================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Criar usuário padrão se não existir
        if not User.query.filter_by(username='yukiridensuki').first():
            default_user = User(
                username='yukiridensuki',
                password='yukiridensuki4175',
                email='joaogabriel4175@gmail.com',
                is_active=True
            )
            db.session.add(default_user)
            db.session.commit()
            print("✅ Usuário padrão criado: yukiridensuki / yukiridensuki4175")
        
        # Carregar dados iniciais do currículo
        if CurriculumVersion.query.count() == 0:
            print("📂 Carregando dados iniciais do currículo...")
            curriculum_data = load_json_data('curriculum.json')
            if not curriculum_data:
                curriculum_data = get_default_curriculum_data()
            
            initial_version = CurriculumVersion(
                version='1.0.0',
                data=curriculum_data,
                is_current=True
            )
            db.session.add(initial_version)
            print("✅ Dados iniciais do currículo carregados!")
        
        # Carregar dados iniciais do about
        if AboutVersion.query.count() == 0:
            print("📂 Carregando dados iniciais do about...")
            about_data = load_json_data('about.json')
            if not about_data:
                about_data = get_default_about_data()
            
            initial_version = AboutVersion(
                version='1.0.0',
                data=about_data,
                is_current=True
            )
            db.session.add(initial_version)
            print("✅ Dados iniciais do about carregados!")
        
        # Carregar dados iniciais do profile
        if ProfileVersion.query.count() == 0:
            print("📂 Carregando dados iniciais do profile...")
            profile_data = load_json_data('profile.json')
            if profile_data:
                initial_version = ProfileVersion(
                    version='1.0.0',
                    data=profile_data,
                    is_current=True
                )
                db.session.add(initial_version)
                print("✅ Dados iniciais do profile carregados!")
        
        db.session.commit()
    
    print("🚀 Servidor rodando em http://localhost:5000")
    print("📋 Endpoints disponíveis:")
    print("   GET  /api              - Página de debug")
    print("   GET  /api/info         - Informações em JSON")
    print("   GET  /api/health       - Health check")
    print("   GET  /api/curriculum   - Obter currículo")
    print("   PUT  /api/curriculum   - Atualizar currículo (auth)")
    print("   GET  /api/about        - Obter dados do about")
    print("   PUT  /api/about        - Atualizar dados do about (auth)")
    print("   GET  /api/profile      - Obter dados do perfil")
    print("   POST /api/auth/login   - Login")
    print("   POST /api/auth/register - Registrar usuário")
    print("   GET  /api/auth/verify  - Verificar token (auth)")
    print("   POST /api/curriculum/download/docx - Download DOCX")
    
    app.run(debug=True, host='0.0.0.0', port=5000)