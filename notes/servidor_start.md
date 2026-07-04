# 1. Navegar para a pasta da API
cd /workspaces/Densuki/backend/api

# 2. Ativar o ambiente virtual
source /workspaces/Densuki/.venv/bin/activate

# 3. Verificar se a porta 5000 está livre
lsof -i :5000

# 4. Iniciar o servidor
python app.py