# routes/profile_routes.py
from flask import jsonify
from models import db, ProfileVersion
from utils.json_utils import load_json_data

def register_profile_routes(app):
    
    @app.route('/api/profile', methods=['GET'])
    def get_profile():
        """Obtém os dados do perfil (profile.json)"""
        # Tentar buscar do banco de dados primeiro
        version = ProfileVersion.query.filter_by(is_current=True).first()
        
        if version:
            return jsonify(version.data)
        
        # Se não houver versão no banco, carregar do JSON
        print("📂 Nenhuma versão no banco. Carregando do profile.json...")
        profile_data = load_json_data('profile.json')
        
        if not profile_data:
            print("⚠️ Profile.json não encontrado!")
            return jsonify({})
        
        # Salvar no banco como versão inicial
        version = ProfileVersion(
            version='1.0.0',
            data=profile_data,
            is_current=True
        )
        db.session.add(version)
        db.session.commit()
        print("✅ Versão inicial do Profile criada no banco de dados!")
        
        return jsonify(profile_data)