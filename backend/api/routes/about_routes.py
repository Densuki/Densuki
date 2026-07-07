# routes/about_routes.py
from flask import request, jsonify
from models import db, User, AboutVersion, AboutEdit
from auth import token_required
from utils.json_utils import save_json_data, load_json_data, get_default_about_data

def register_about_routes(app):
    
    @app.route('/api/about', methods=['GET'])
    def get_about():
        """Obtém os dados do about"""
        # Tentar buscar do banco de dados primeiro
        version = AboutVersion.query.filter_by(is_current=True).first()
        
        if version:
            return jsonify(version.data)
        
        # Se não houver versão no banco, carregar do JSON
        print("📂 Nenhuma versão no banco. Carregando do about.json...")
        about_data = load_json_data('about.json')
        
        if not about_data:
            print("⚠️ Usando dados padrão...")
            about_data = get_default_about_data()
        
        # Salvar no banco como versão inicial
        version = AboutVersion(
            version='1.0.0',
            data=about_data,
            is_current=True
        )
        db.session.add(version)
        db.session.commit()
        print("✅ Versão inicial do About criada no banco de dados!")
        
        return jsonify(about_data)

    @app.route('/api/about', methods=['PUT'])
    @token_required
    def update_about(current_user):
        """Atualiza os dados do about"""
        data = request.json
        
        # Criar nova versão
        version = AboutVersion(
            version=f"1.0.{AboutVersion.query.count() + 1}",
            data=data,
            is_current=True,
            created_by=current_user.id
        )
        
        # Desmarcar versões anteriores como correntes
        db.session.query(AboutVersion).update({AboutVersion.is_current: False})
        
        db.session.add(version)
        db.session.commit()
        
        # Registrar edições
        old_version = AboutVersion.query.filter_by(is_current=False).order_by(AboutVersion.created_at.desc()).first()
        if old_version:
            for key in data:
                if key in old_version.data and data[key] != old_version.data[key]:
                    edit = AboutEdit(
                        field=key,
                        old_value=str(old_version.data[key]),
                        new_value=str(data[key]),
                        edited_by=current_user.id,
                        version_id=version.id
                    )
                    db.session.add(edit)
            db.session.commit()
        
        # Também atualizar o arquivo JSON
        save_json_data('about.json', data)
        
        return jsonify({
            'message': 'Sobre atualizado com sucesso!',
            'version': version.version
        })

    @app.route('/api/about/history', methods=['GET'])
    @token_required
    def get_about_history(current_user):
        """Obtém o histórico de versões do about"""
        versions = AboutVersion.query.order_by(AboutVersion.created_at.desc()).limit(10).all()
        return jsonify([{
            'version': v.version,
            'created_at': v.created_at.isoformat(),
            'created_by': User.query.get(v.created_by).username if v.created_by else 'Sistema',
            'is_current': v.is_current
        } for v in versions])