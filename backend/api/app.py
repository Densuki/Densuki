# app.py
from config import Config
from models import db, CurriculumVersion, AboutVersion, ProfileVersion
from services import create_app, initialize_database, register_routes, prune_old_versions

app = create_app()
register_routes(app)


def bootstrap_database() -> None:
    """Inicializa tabelas, dados padrão e aplica retenção configurável de versões."""
    initialize_database()
    for model in (CurriculumVersion, AboutVersion, ProfileVersion):
        removed = prune_old_versions(model)
        if removed:
            print(f"🧹 {removed} versões antigas removidas de {model.__tablename__}.")
    db.session.commit()


if __name__ == '__main__':
    with app.app_context():
        bootstrap_database()

    print(f"🚀 Servidor rodando em http://{Config.HOST}:{Config.PORT}")
    print("📋 Endpoints disponíveis: /api, /api/info, /api/health, /api/curriculum, /api/about, /api/profile")
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
