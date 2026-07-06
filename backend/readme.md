# Sistema de Currículo com Autenticação

## Configuração

### 1. Banco de Dados
Execute o script `schema.sql` no seu banco de dados AlwaysData.

### 2. Variáveis de Ambiente
Configure as seguintes variáveis no GitHub Secrets:
- `DATABASE_URL`: URL de conexão com o banco de dados
- `SECRET_KEY`: Chave secreta para JWT

### 3. Deploy
O GitHub Actions irá automaticamente fazer deploy da API quando houver alterações.

## Funcionalidades

- 🔐 Login/Logout com JWT
- ✏️ Edição do currículo em tempo real
- 📄 Download em PDF e DOCX
- 📝 Histórico de alterações
- 💾 Versionamento do currículo

## API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/verify` - Verificar token
- `GET /api/curriculum` - Obter currículo
- `PUT /api/curriculum` - Atualizar currículo (requer autenticação)
- `GET /api/curriculum/history` - Histórico de versões