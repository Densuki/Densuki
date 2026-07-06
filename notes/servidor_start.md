# 1. Navegar para a pasta da API
cd /workspaces/Densuki/backend/api

# 2. Ativar o ambiente virtual
source /workspaces/Densuki/.venv/bin/activate

# 3. Verificar se a porta 5000 está livre
lsof -i :5000
{
    "liveServer.settings.port": 5500
}
# 4. Iniciar o servidor
python app.py

---

# Parar o servidor atual (Ctrl+C)
# Reiniciar
cd /workspaces/Densuki/backend/api
source /workspaces/Densuki/.venv/bin/activate
python app.py