# routes/debug_routes.py
from flask import jsonify, request
from config import Config
from models import User, CurriculumVersion, AboutVersion, ProfileVersion
from datetime import datetime
import platform
import os

def register_debug_routes(app):
    
    @app.route('/api', methods=['GET'])
    def api_root():
        """Página informativa sobre a API"""
        try:
            user_count = User.query.count()
            curriculum_count = CurriculumVersion.query.count()
            about_count = AboutVersion.query.count()
            profile_count = ProfileVersion.query.count()
        except:
            user_count = curriculum_count = about_count = profile_count = 'Erro ao consultar'
        
        # Construir HTML
        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 Portfólio API - Debug</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                    color: #f0f0ff;
                    min-height: 100vh;
                    padding: 2rem;
                }}
                .container {{ max-width: 1200px; margin: 0 auto; }}
                .header {{
                    text-align: center;
                    padding: 2rem 0;
                    border-bottom: 2px solid rgba(139, 92, 246, 0.3);
                    margin-bottom: 2rem;
                }}
                .header h1 {{
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #8b5cf6, #c084fc, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.5rem;
                }}
                .header p {{ color: #c4b5d4; font-size: 1.1rem; }}
                .badge {{
                    display: inline-block;
                    padding: 0.2rem 1rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin: 0.2rem;
                }}
                .badge-online {{ background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }}
                .badge-info {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #60a5fa; }}
                
                .grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }}
                .card {{
                    background: rgba(139, 92, 246, 0.05);
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }}
                .card:hover {{
                    transform: translateY(-4px);
                    border-color: rgba(139, 92, 246, 0.3);
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
                }}
                .card h3 {{ color: #a78bfa; font-size: 1.1rem; margin-bottom: 1rem; }}
                .info-item {{
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }}
                .info-item:last-child {{ border-bottom: none; }}
                .info-label {{ color: #c4b5d4; font-weight: 500; }}
                .info-value {{ color: #f0f0ff; font-weight: 600; font-family: 'Courier New', monospace; font-size: 0.9rem; }}
                
                .endpoints {{
                    background: rgba(139, 92, 246, 0.05);
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }}
                .endpoints h2 {{ color: #a78bfa; margin-bottom: 1rem; }}
                .endpoint {{
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 0.75rem;
                    margin: 0.3rem 0;
                    background: rgba(0,0,0,0.2);
                    border-radius: 0.5rem;
                    font-size: 0.9rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }}
                .method {{
                    font-weight: 700;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    min-width: 50px;
                    text-align: center;
                }}
                .method-get {{ background: rgba(16, 185, 129, 0.2); color: #10b981; }}
                .method-post {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; }}
                .method-put {{ background: rgba(245, 158, 11, 0.2); color: #f59e0b; }}
                .method-delete {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; }}
                .endpoint-path {{ color: #f0f0ff; font-weight: 500; font-family: 'Courier New', monospace; }}
                .endpoint-desc {{ color: #c4b5d4; font-size: 0.85rem; }}
                .endpoint-auth {{ color: #f59e0b; font-size: 0.7rem; background: rgba(245, 158, 11, 0.15); padding: 0.2rem 0.5rem; border-radius: 10px; }}
                
                .footer {{
                    text-align: center;
                    color: #6b6b8a;
                    padding: 2rem 0;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: 2rem;
                    font-size: 0.85rem;
                }}
                .footer a {{ color: #a78bfa; text-decoration: none; }}
                .footer a:hover {{ color: #c084fc; }}
                
                pre {{
                    background: rgba(0,0,0,0.3);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    color: #f0f0ff;
                    font-family: 'Courier New', monospace;
                    font-size: 0.85rem;
                    overflow-x: auto;
                }}
                
                @media (max-width: 768px) {{
                    body {{ padding: 1rem; }}
                    .header h1 {{ font-size: 1.8rem; }}
                    .grid {{ grid-template-columns: 1fr; }}
                    .endpoint {{ flex-direction: column; align-items: flex-start; gap: 0.3rem; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Portfólio API</h1>
                    <p>API do Portfólio - Sistema de Currículo, About e Autenticação</p>
                    <div style="margin-top: 0.5rem;">
                        <span class="badge badge-online">✅ Online</span>
                        <span class="badge badge-info">v{Config.VERSION}</span>
                        <span class="badge badge-info">🔒 Autenticação JWT</span>
                    </div>
                </div>

                <div class="grid">
                    <div class="card">
                        <h3>📊 Status do Sistema</h3>
                        <div class="info-item"><span class="info-label">Status</span><span class="info-value" style="color: #10b981;">Operacional</span></div>
                        <div class="info-item"><span class="info-label">Banco de Dados</span><span class="info-value" style="color: #10b981;">✅ Conectado</span></div>
                        <div class="info-item"><span class="info-label">Timestamp</span><span class="info-value" style="font-size: 0.8rem;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</span></div>
                    </div>
                    <div class="card">
                        <h3>🗄️ Banco de Dados</h3>
                        <div class="info-item"><span class="info-label">Usuários</span><span class="info-value">{user_count}</span></div>
                        <div class="info-item"><span class="info-label">Versões do Currículo</span><span class="info-value">{curriculum_count}</span></div>
                        <div class="info-item"><span class="info-label">Versões do About</span><span class="info-value">{about_count}</span></div>
                        <div class="info-item"><span class="info-label">Versões do Perfil</span><span class="info-value">{profile_count}</span></div>
                    </div>
                    <div class="card">
                        <h3>⚙️ Sistema</h3>
                        <div class="info-item"><span class="info-label">Python</span><span class="info-value">{platform.python_version()}</span></div>
                        <div class="info-item"><span class="info-label">Plataforma</span><span class="info-value" style="font-size: 0.75rem;">{platform.platform()[:50]}...</span></div>
                        <div class="info-item"><span class="info-label">Hostname</span><span class="info-value">{platform.node()}</span></div>
                        <div class="info-item"><span class="info-label">Versão da API</span><span class="info-value">v{Config.VERSION}</span></div>
                    </div>
                </div>

                <div class="endpoints">
                    <h2>📋 Endpoints Disponíveis</h2>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api</span><span class="endpoint-desc">Esta página de debug</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/health</span><span class="endpoint-desc">Health check do servidor</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/info</span><span class="endpoint-desc">Informações em JSON</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-post">POST</span><span class="endpoint-path">/api/auth/login</span><span class="endpoint-desc">Autenticação de usuário</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-post">POST</span><span class="endpoint-path">/api/auth/register</span><span class="endpoint-desc">Registro de novo usuário</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/auth/verify</span><span class="endpoint-desc">Verificar token JWT</span><span class="endpoint-auth">🔒 Autenticado</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/curriculum</span><span class="endpoint-desc">Obter currículo</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-put">PUT</span><span class="endpoint-path">/api/curriculum</span><span class="endpoint-desc">Atualizar currículo</span><span class="endpoint-auth">🔒 Autenticado</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/about</span><span class="endpoint-desc">Obter dados do about</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-put">PUT</span><span class="endpoint-path">/api/about</span><span class="endpoint-desc">Atualizar dados do about</span><span class="endpoint-auth">🔒 Autenticado</span></div>
                    <div class="endpoint"><span class="method method-get">GET</span><span class="endpoint-path">/api/profile</span><span class="endpoint-desc">Obter dados do perfil</span><span class="endpoint-auth">🔓 Público</span></div>
                    <div class="endpoint"><span class="method method-post">POST</span><span class="endpoint-path">/api/curriculum/download/docx</span><span class="endpoint-desc">Baixar currículo em DOCX</span><span class="endpoint-auth">🔓 Público</span></div>
                </div>

                <div class="endpoints" style="border-color: rgba(59, 130, 246, 0.3);">
                    <h2>🔐 Testar Autenticação</h2>
                    <p style="color: #c4b5d4; margin-bottom: 1rem;">Faça uma requisição POST para <code>/api/auth/login</code> com os dados:</p>
                    <pre>{{
    "username": "YukiriDensuki",
    "password": "CENSURADO"
}}</pre>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="badge badge-info">👤 Usuário: YukiriDensuki</span>
                        <span class="badge badge-info">🔑 Senha: CENSURADO</span>
                    </div>
                </div>

                <div style="text-align: right; color: #6b6b8a; font-size: 0.8rem; margin-top: 1rem;">
                    🕐 Última atualização: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </div>

                <div class="footer">
                    <p>🚀 Portfólio API - Desenvolvido com ❤️</p>
                    <p><a href="https://github.com/Densuki">GitHub</a> • <a href="https://linkedin.com/in/densuki">LinkedIn</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        return html, 200, {'Content-Type': 'text/html; charset=utf-8'}

    @app.route('/api/info', methods=['GET'])
    def api_info_json():
        """Informações da API em formato JSON"""
        try:
            user_count = User.query.count()
            curriculum_count = CurriculumVersion.query.count()
            about_count = AboutVersion.query.count()
            profile_count = ProfileVersion.query.count()
        except:
            user_count = curriculum_count = about_count = profile_count = None
        
        return jsonify({
            'api': {
                'name': 'Portfólio API',
                'version': Config.VERSION,
                'status': 'online',
                'timestamp': datetime.now().isoformat()
            },
            'system': {
                'python_version': platform.python_version(),
                'platform': platform.platform(),
                'hostname': platform.node()
            },
            'database': {
                'status': 'connected',
                'tables': {
                    'users': user_count,
                    'curriculum_versions': curriculum_count,
                    'about_versions': about_count,
                    'profile_versions': profile_count
                }
            },
            'endpoints': {
                'root': '/api',
                'health': '/api/health',
                'info': '/api/info',
                'auth': {
                    'login': '/api/auth/login (POST)',
                    'register': '/api/auth/register (POST)',
                    'verify': '/api/auth/verify (GET)'
                },
                'curriculum': {
                    'get': '/api/curriculum (GET)',
                    'update': '/api/curriculum (PUT)',
                    'download_docx': '/api/curriculum/download/docx (POST)'
                },
                'about': {
                    'get': '/api/about (GET)',
                    'update': '/api/about (PUT)',
                    'history': '/api/about/history (GET)'
                },
                'profile': {
                    'get': '/api/profile (GET)'
                },
                'download': '/api/download/{ext} (GET)'
            }
        })

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check do servidor"""
        try:
            user_count = User.query.count()
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
            user_count = None
        
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat(),
            'database': db_status,
            'users_count': user_count,
            'endpoints': {
                'curriculum': '/api/curriculum',
                'about': '/api/about',
                'profile': '/api/profile',
                'auth': '/api/auth/login, /api/auth/verify'
            },
            'version': Config.VERSION
        })