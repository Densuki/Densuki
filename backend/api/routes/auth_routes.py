# routes/auth_routes.py
from flask import request, jsonify
from models import User, db
from auth import token_required, generate_token
from datetime import datetime

def register_auth_routes(app):
    
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
        
        token = generate_token(user.id, user.username)
        
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