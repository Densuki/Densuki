#!/bin/bash
# setup.sh - Script para configurar o ambiente no GitHub Workspace

echo "🚀 Configurando ambiente..."

# Instalar dependências do sistema
sudo apt-get update
sudo apt-get install -y default-libmysqlclient-dev build-essential pkg-config

# Configurar Python
cd backend/api

# Criar ambiente virtual
python3 -m venv venv

# Ativar e instalar dependências
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Configurar variáveis de ambiente
echo "DATABASE_URL=mysql://densuki:YukiriDensuki1234@mysql-densuki.alwaysdata.net/densuki_access" > .env
echo "SECRET_KEY=yukiridensuki-secret-key-2024" >> .env

echo "✅ Ambiente configurado com sucesso!"
echo "Para iniciar o servidor: cd backend/api && source venv/bin/activate && python app.py"