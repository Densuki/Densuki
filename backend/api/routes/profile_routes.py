# routes/profile_routes.py
from flask import jsonify, request
from models import db, ProfileVersion
from auth import token_required
from utils.json_utils import load_json_data, save_json_data
from services import next_version, prune_old_versions


def register_profile_routes(app):

    @app.route('/api/profile', methods=['GET'])
    def get_profile():
        """Obtém os dados do perfil (profile.json) a partir do banco, com fallback para JSON."""
        version = ProfileVersion.query.filter_by(is_current=True).first()

        if version:
            return jsonify(version.data)

        print("📂 Nenhuma versão no banco. Carregando do profile.json...")
        profile_data = load_json_data('profile.json')

        if not profile_data:
            print("⚠️ Profile.json não encontrado!")
            return jsonify({})

        version = ProfileVersion(version='1.0.0', data=profile_data, is_current=True)
        db.session.add(version)
        db.session.commit()
        print("✅ Versão inicial do Profile criada no banco de dados!")

        return jsonify(profile_data)

    @app.route('/api/profile', methods=['PUT'])
    @token_required
    def update_profile(current_user):
        """Atualiza o perfil, grava uma nova versão e mantém somente as últimas versões configuradas."""
        data = request.json or {}
        db.session.query(ProfileVersion).update({ProfileVersion.is_current: False})
        version = ProfileVersion(
            version=next_version(ProfileVersion),
            data=data,
            is_current=True,
            created_by=current_user.id,
        )
        db.session.add(version)
        db.session.flush()
        removed_versions = prune_old_versions(ProfileVersion)
        if removed_versions:
            print(f'🧹 {removed_versions} versões antigas removidas de ProfileVersion.')
        db.session.commit()
        save_json_data('profile.json', data)
        return jsonify({'message': 'Perfil atualizado com sucesso!', 'version': version.version})
