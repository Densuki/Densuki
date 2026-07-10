# routes/curriculum_routes.py
from flask import request, jsonify
from models import db, User, CurriculumVersion, CurriculumEdit
from auth import token_required
from utils.json_utils import save_json_data, load_json_data, get_default_curriculum_data
from services import next_version, prune_old_versions

def register_curriculum_routes(app):
    
    @app.route('/api/curriculum', methods=['GET'])
    def get_curriculum():
        """Obtém o currículo"""
        # Tentar buscar do banco de dados primeiro
        version = CurriculumVersion.query.filter_by(is_current=True).first()
        
        if version:
            return jsonify(version.data)
        
        # Se não houver versão no banco, carregar do JSON
        print("📂 Nenhuma versão no banco. Carregando do curriculum.json...")
        curriculum_data = load_json_data('curriculum.json')
        
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
        """Atualiza o currículo"""
        data = request.json
        
        # Criar nova versão
        version = CurriculumVersion(
            version=next_version(CurriculumVersion),
            data=data,
            is_current=True,
            created_by=current_user.id
        )
        
        # Desmarcar versões anteriores como correntes
        db.session.query(CurriculumVersion).update({CurriculumVersion.is_current: False})
        
        db.session.add(version)
        db.session.flush()
        
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
            db.session.flush()
        
        removed_versions = prune_old_versions(CurriculumVersion)
        if removed_versions:
            print(f'🧹 {removed_versions} versões antigas removidas de CurriculumVersion.')
        db.session.commit()
        
        # Também atualizar o arquivo JSON
        save_json_data('curriculum.json', data)
        
        return jsonify({
            'message': 'Currículo atualizado com sucesso!',
            'version': version.version
        })

    @app.route('/api/curriculum/history', methods=['GET'])
    @token_required
    def get_curriculum_history(current_user):
        """Obtém o histórico de versões do currículo"""
        versions = CurriculumVersion.query.order_by(CurriculumVersion.created_at.desc()).limit(10).all()
        return jsonify([{
            'version': v.version,
            'created_at': v.created_at.isoformat(),
            'created_by': User.query.get(v.created_by).username if v.created_by else 'Sistema',
            'is_current': v.is_current
        } for v in versions])