from typing import Optional, Type

from flask import Flask
from flask_cors import CORS

from config import Config
from models import db, User, CurriculumVersion, CurriculumEdit, AboutVersion, AboutEdit
from utils.json_utils import load_json_data


def create_app() -> Flask:
    """Cria e configura a aplicação Flask sem executar efeitos colaterais de servidor."""
    app = Flask('app')
    app.config.from_object(Config)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.get_database_url()

    db.init_app(app)
    CORS(
        app,
        origins=Config.cors_origins(),
        allow_headers=Config.cors_allow_headers(),
        expose_headers=Config.cors_expose_headers(),
        supports_credentials=Config.CORS_SUPPORTS_CREDENTIALS,
    )
    return app


def register_routes(app: Flask) -> None:
    from routes.auth_routes import register_auth_routes
    from routes.curriculum_routes import register_curriculum_routes
    from routes.about_routes import register_about_routes
    from routes.profile_routes import register_profile_routes
    from routes.download_routes import register_download_routes
    from routes.debug_routes import register_debug_routes

    register_auth_routes(app)
    register_curriculum_routes(app)
    register_about_routes(app)
    register_profile_routes(app)
    register_download_routes(app)
    register_debug_routes(app)


def ensure_default_user() -> None:
    username = Config.DEFAULT_ADMIN_USERNAME
    if User.query.filter_by(username=username).first():
        return

    default_user = User(
        username=username,
        password=Config.DEFAULT_ADMIN_PASSWORD,
        email=Config.DEFAULT_ADMIN_EMAIL,
        is_active=True,
    )
    db.session.add(default_user)
    db.session.commit()
    print(f"✅ Usuário padrão criado: {username}")


def seed_version(model: Type[db.Model], json_name: str, default_data: Optional[dict] = None, label: str = '') -> None:
    if model.query.count() > 0:
        return

    print(f"📂 Carregando dados iniciais de {label or json_name}...")
    data = load_json_data(json_name) or default_data
    if not data:
        print(f"⚠️ Nenhum dado inicial encontrado para {json_name}.")
        return

    db.session.add(model(version='1.0.0', data=data, is_current=True))
    db.session.commit()
    print(f"✅ Dados iniciais de {label or json_name} carregados!")


DEPENDENT_EDIT_MODELS = {
    CurriculumVersion: CurriculumEdit,
    AboutVersion: AboutEdit,
}


def prune_old_versions(model: Type[db.Model], keep: Optional[int] = None) -> int:
    """Mantém as versões mais recentes e remove as antigas, preservando a atual.

    Antes de remover versões antigas, apaga auditorias dependentes em tabelas
    `*_edits`. Isso evita falhas de chave estrangeira em bancos como MySQL, onde
    as constraints existentes podem não possuir `ON DELETE CASCADE`.
    """
    limit = keep or Config.VERSION_RETENTION_LIMIT
    if limit <= 0:
        return 0

    with db.session.no_autoflush:
        versions = model.query.order_by(model.created_at.desc(), model.id.desc()).all()

    stale_versions = [version for index, version in enumerate(versions) if index >= limit and not version.is_current]
    stale_ids = [version.id for version in stale_versions]
    if not stale_ids:
        return 0

    edit_model = DEPENDENT_EDIT_MODELS.get(model)
    if edit_model is not None:
        edit_model.query.filter(edit_model.version_id.in_(stale_ids)).delete(synchronize_session=False)

    for version in stale_versions:
        db.session.delete(version)
    return len(stale_versions)


def next_version(model: Type[db.Model]) -> str:
    return f"1.0.{model.query.count() + 1}"


def initialize_database() -> None:
    from models import CurriculumVersion, AboutVersion, ProfileVersion
    from utils.json_utils import get_default_curriculum_data, get_default_about_data

    db.create_all()
    ensure_default_user()
    seed_version(CurriculumVersion, 'curriculum.json', get_default_curriculum_data(), 'currículo')
    seed_version(AboutVersion, 'about.json', get_default_about_data(), 'about')
    seed_version(ProfileVersion, 'profile.json', None, 'profile')
