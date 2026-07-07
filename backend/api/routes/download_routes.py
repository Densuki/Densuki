# routes/download_routes.py
from flask import jsonify, request, Response
from io import BytesIO
from docx import Document
from docx.shared import Inches
from utils.docx_utils import generate_docx

def register_download_routes(app):
    
    @app.route('/api/download/<file_type>', methods=['GET'])
    def download_file(file_type):
        """Download de arquivos estáticos"""
        ext_map = {
            'pdf': 'pdf',
            'docx': 'docx',
            'md': 'md'
        }
        
        ext = ext_map.get(file_type, file_type)
        return jsonify({
            'url': f'https://raw.githubusercontent.com/Densuki/densuki.github.io/main/docs/assets/curriculo_pessoal.{ext}'
        })

    @app.route('/api/curriculum/download/docx', methods=['POST'])
    def download_docx():
        """Gera e baixa o currículo em formato DOCX"""
        try:
            data = request.json
            
            # Gerar documento usando o utilitário
            doc = generate_docx(data)
            
            # Salvar em memória
            file_bytes = BytesIO()
            doc.save(file_bytes)
            file_bytes.seek(0)
            
            return Response(
                file_bytes.getvalue(),
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                headers={
                    'Content-Disposition': 'attachment; filename=Curriculo_JoaoGabriel.docx',
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
            )
            
        except Exception as e:
            print(f"❌ Erro ao gerar DOCX: {e}")
            return jsonify({'error': str(e)}), 500