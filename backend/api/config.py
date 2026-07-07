# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'yukiridensuki-secret-key-2024')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = [
        'https://densuki.github.io',
        'http://localhost:3000',
        'https://studious-goggles-v6wpp65rvwwcxgg6-5000.app.github.dev',
        'https://portifolio-pj8c.onrender.com'
    ]
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_EXPOSE_HEADERS = ['Content-Type', 'Authorization']
    
    # JWT
    JWT_EXPIRATION_HOURS = 24
    
    # Versão da API
    VERSION = '1.0.0'
    
    # Caminhos dos JSONs
    DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'data')
    
    @classmethod
    def get_database_url(cls):
        url = cls.SQLALCHEMY_DATABASE_URI
        if not url:
            print("❌ DATABASE_URL não encontrada! Usando SQLite para teste...")
            return 'sqlite:///curriculum.db'
        return url

# Verificar se DATABASE_URL está definida
if not Config.SQLALCHEMY_DATABASE_URI:
    print("⚠️ DATABASE_URL não definida! Usando SQLite para teste...")