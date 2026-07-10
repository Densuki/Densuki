# backend/api

API Flask responsável por autenticação, dados editoriais e downloads do currículo.

## Arquivos principais

- `app.py`: ponto de entrada do servidor. Cria a app via `services.py`, registra rotas e inicializa banco/seed quando executado diretamente.
- `services.py`: fábrica da app Flask, configuração de CORS, registro das rotas, seed de dados iniciais e política de retenção de versões.
- `config.py`: leitura das variáveis de ambiente a partir de `.env` e valores padrão para desenvolvimento.
- `models.py`: modelos SQLAlchemy de usuários, versões de currículo/sobre/perfil e auditoria de edições.
- `auth.py`: helpers de autenticação e validação de token.
- `keep_alive.py`: rotina experimental para manter serviços acordados em ambientes que hibernam.
- `.env.example`: exemplo das variáveis suportadas.

## Execução

```bash
npm run start:api
# ou
cd backend/api && python3 app.py
```

## Verificação

```bash
npm test
```
