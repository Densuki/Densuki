# config.py
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-in-env')
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', '5000'))
    DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    DEFAULT_ADMIN_USERNAME = os.environ.get('DEFAULT_ADMIN_USERNAME', 'yukiridensuki')
    DEFAULT_ADMIN_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'yukiridensuki4175')
    DEFAULT_ADMIN_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'joaogabriel4175@gmail.com')
    VERSION_RETENTION_LIMIT = int(os.environ.get('VERSION_RETENTION_LIMIT', '10'))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://densuki.github.io,http://localhost:3000,https://studious-goggles-v6wpp65rvwwcxgg6-5000.app.github.dev,https://portifolio-pj8c.onrender.com').split(',')
    CORS_ALLOW_HEADERS = os.environ.get('CORS_ALLOW_HEADERS', 'Content-Type,Authorization').split(',')
    CORS_EXPOSE_HEADERS = os.environ.get('CORS_EXPOSE_HEADERS', 'Content-Type,Authorization').split(',')
    CORS_SUPPORTS_CREDENTIALS = os.environ.get('CORS_SUPPORTS_CREDENTIALS', 'true').lower() == 'true'

    @classmethod
    def cors_origins(cls):
        if os.environ.get('CORS_ALLOW_ALL', 'false').lower() == 'true':
            return ['*']
        return [origin.strip() for origin in cls.CORS_ORIGINS if origin.strip()]

    @classmethod
    def cors_allow_headers(cls):
        return [header.strip() for header in cls.CORS_ALLOW_HEADERS if header.strip()]

    @classmethod
    def cors_expose_headers(cls):
        return [header.strip() for header in cls.CORS_EXPOSE_HEADERS if header.strip()]
    
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