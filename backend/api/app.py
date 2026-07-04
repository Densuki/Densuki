# api/app.py
import os
import json
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import jwt
from functools import wraps

app = Flask(__name__)

# Configurações
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'yukiridensuki-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Se não tiver DATABASE_URL, usa SQLite
if not app.config['SQLALCHEMY_DATABASE_URI']:
    print("❌ DATABASE_URL não encontrada! Usando SQLite para teste...")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///curriculum.db'

db = SQLAlchemy(app)
CORS(app, origins=['https://densuki.github.io', 'http://localhost:3000', 'https://studious-goggles-v6wpp65rvwwcxgg6-5000.app.github.dev', '*'])

# ============================================
# FUNÇÃO PARA CARREGAR DADOS DO curriculum.json
# ============================================
def load_curriculum_from_json():
    """Carrega os dados do curriculum.json"""
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'data', 'curriculum.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ Arquivo não encontrado: {json_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao ler JSON: {e}")
        return None

def get_default_curriculum_data():
    """Retorna dados padrão caso o JSON não seja encontrado"""
    return {
        "contact": {
            "name": "João Gabriel Sousa Santos",
            "location": "Fortaleza - CE",
            "phone": "(85) 9 9217-1191",
            "email": "joaogabriel4175@gmail.com",
            "linkedin": "linkedin.com/in/densuki/",
            "github": "github.com/Densuki"
        },
        "objective": "Atuar nas áreas de atendimento ao cliente, rotinas administrativas e suporte operacional, contribuindo com organização, resolução de problemas e qualidade no atendimento.",
        "summary": "Profissional com experiência em atendimento ao público e suporte em Lan House, além de atuação voluntária em ambiente escolar com apoio administrativo e organizacional. Possuo conhecimentos em informática, Pacote Office e organização documental, buscando oportunidade para desenvolver carreira na área administrativa.",
        "education": [],
        "courses": [],
        "skills": {},
        "experience": [],
        "languages": []
    }

# ============================================
# MODELOS DO BANCO DE DADOS
# ============================================
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

class CurriculumVersion(db.Model):
    __tablename__ = 'curriculum_versions'
    id = db.Column(db.Integer, primary_key=True)
    version = db.Column(db.String(20), nullable=False)
    data = db.Column(db.JSON, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_current = db.Column(db.Boolean, default=False)

class CurriculumEdit(db.Model):
    __tablename__ = 'curriculum_edits'
    id = db.Column(db.Integer, primary_key=True)
    field = db.Column(db.String(100), nullable=False)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    edited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    edited_at = db.Column(db.DateTime, default=datetime.utcnow)
    version_id = db.Column(db.Integer, db.ForeignKey('curriculum_versions.id'))

# ============================================
# DECORADOR DE AUTENTICAÇÃO
# ============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token é obrigatório!'}), 401
        try:
            token = token.split(' ')[1] if ' ' in token else token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Usuário não encontrado!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ============================================
# ROTAS DE AUTENTICAÇÃO
# ============================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if not user or user.password != password:
        return jsonify({'message': 'Credenciais inválidas!'}), 401
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Usuário já existe!'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email já cadastrado!'}), 400
    
    user = User(username=username, password=password, email=email)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Usuário criado com sucesso!'}), 201

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify(current_user):
    return jsonify({
        'authenticated': True,
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }
    })

# ============================================
# ROTAS DO CURRÍCULO
# ============================================
@app.route('/api/curriculum', methods=['GET'])
def get_curriculum():
    # Tentar buscar do banco de dados primeiro
    version = CurriculumVersion.query.filter_by(is_current=True).first()
    
    if version:
        return jsonify(version.data)
    
    # Se não houver versão no banco, carregar do JSON
    print("📂 Nenhuma versão no banco. Carregando do curriculum.json...")
    curriculum_data = load_curriculum_from_json()
    
    if not curriculum_data:
        print("⚠️ Usando dados padrão...")
        curriculum_data = get_default_curriculum_data()
    
    # Salvar no banco como versão inicial
    version = CurriculumVersion(
        version='1.0.0',
        data=curriculum_data,
        is_current=True
    )
    db.session.add(version)
    db.session.commit()
    print("✅ Versão inicial criada no banco de dados!")
    
    return jsonify(curriculum_data)

@app.route('/api/curriculum', methods=['PUT'])
@token_required
def update_curriculum(current_user):
    data = request.json
    
    # Criar nova versão
    version = CurriculumVersion(
        version=f"1.0.{CurriculumVersion.query.count() + 1}",
        data=data,
        is_current=True,
        created_by=current_user.id
    )
    
    # Desmarcar versões anteriores como correntes
    db.session.query(CurriculumVersion).update({CurriculumVersion.is_current: False})
    
    db.session.add(version)
    db.session.commit()
    
    # Registrar edições
    old_version = CurriculumVersion.query.filter_by(is_current=False).order_by(CurriculumVersion.created_at.desc()).first()
    if old_version:
        for key in data:
            if key in old_version.data and data[key] != old_version.data[key]:
                edit = CurriculumEdit(
                    field=key,
                    old_value=str(old_version.data[key]),
                    new_value=str(data[key]),
                    edited_by=current_user.id,
                    version_id=version.id
                )
                db.session.add(edit)
        db.session.commit()
    
    # Também atualizar o arquivo JSON (opcional)
    try:
        json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'data', 'curriculum.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ curriculum.json atualizado em: {json_path}")
    except Exception as e:
        print(f"⚠️ Não foi possível atualizar o JSON: {e}")
    
    return jsonify({
        'message': 'Currículo atualizado com sucesso!',
        'version': version.version
    })

@app.route('/api/curriculum/history', methods=['GET'])
@token_required
def get_history(current_user):
    versions = CurriculumVersion.query.order_by(CurriculumVersion.created_at.desc()).limit(10).all()
    return jsonify([{
        'version': v.version,
        'created_at': v.created_at.isoformat(),
        'created_by': User.query.get(v.created_by).username if v.created_by else 'Sistema',
        'is_current': v.is_current
    } for v in versions])

# ============================================
# ROTA PARA DOWNLOAD DOS ARQUIVOS
# ============================================
@app.route('/api/download/<file_type>', methods=['GET'])
def download_file(file_type):
    # Mapear extensões
    ext_map = {
        'pdf': 'pdf',
        'docx': 'docx',
        'md': 'md'
    }
    
    ext = ext_map.get(file_type, file_type)
    return jsonify({
        'url': f'https://raw.githubusercontent.com/Densuki/densuki.github.io/main/docs/assets/curriculo_pessoal.{ext}'
    })

# ============================================
# ROTA DE STATUS
# ============================================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if app.config['SQLALCHEMY_DATABASE_URI'] else 'using_sqlite'
    })

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
        
        # Carregar dados iniciais se não houver versões
        if CurriculumVersion.query.count() == 0:
            print("📂 Nenhuma versão encontrada. Carregando dados iniciais...")
            curriculum_data = load_curriculum_from_json()
            if not curriculum_data:
                curriculum_data = get_default_curriculum_data()
            
            initial_version = CurriculumVersion(
                version='1.0.0',
                data=curriculum_data,
                is_current=True
            )
            db.session.add(initial_version)
            db.session.commit()
            print("✅ Dados iniciais carregados!")
    
    print("🚀 Servidor rodando em http://localhost:5000")
    print("📋 Endpoints disponíveis:")
    print("   GET  /api/curriculum     - Obter currículo")
    print("   PUT  /api/curriculum     - Atualizar currículo (auth)")
    print("   POST /api/auth/login     - Login")
    print("   POST /api/auth/register  - Registrar usuário")
    print("   GET  /api/auth/verify    - Verificar token (auth)")
    print("   GET  /api/health         - Status do servidor")
    print("   GET  /api/download/{ext} - Download de arquivos")
    
    app.run(debug=True, host='0.0.0.0', port=5000)