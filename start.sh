#!/bin/bash
# start.sh - Inicia todos os serviços

echo "🚀 Iniciando serviços..."

# 1. Verificar Python
echo "📦 Verificando Python..."
python3 --version

# 2. Ativar ambiente virtual e instalar dependências
echo "📦 Preparando ambiente Python..."
cd /workspaces/Densuki/backend/api
source /workspaces/Densuki/.venv/bin/activate
pip install -r requirements.txt

# 3. Criar symlink para os JSONs
echo "📁 Criando links para arquivos JSON..."
cd /workspaces/Densuki
mkdir -p js/data
for f in docs/data/*.json; do
    filename=$(basename "$f")
    if [ ! -f "js/data/$filename" ]; then
        ln -s "../$f" "js/data/$filename" 2>/dev/null || true
    fi
done

# 4. Iniciar servidor Flask
echo "🚀 Iniciando servidor Flask..."
cd /workspaces/Densuki/backend/api
python app.py &

echo "✅ Servidor rodando em http://localhost:5000"
echo "📋 Para testar: curl http://localhost:5000/api/health"