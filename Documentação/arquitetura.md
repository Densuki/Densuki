# Arquitetura e manutenção

## Modularização

- `backend/api/app.py` ficou responsável por criar a aplicação, registrar rotas e executar o servidor.
- `backend/api/services.py` concentra criação do app, CORS, bootstrap do banco, seed inicial e política de retenção.
- `docs/js/core.js` concentra configuração, seletores e carregamento dos JSONs.
- `docs/js/music-player.js` concentra toda a lógica do player musical reaproveitado pelas páginas.
- `docs/assets/css/music-player.css` concentra a responsividade mobile first do player musical.

## Banco de dados e retenção

Conteúdos editoriais como currículo, sobre e perfil são versionados no banco. A variável `VERSION_RETENTION_LIMIT` define quantas versões recentes devem ser mantidas. O padrão é `10`; versões mais antigas e que não estejam marcadas como atuais são removidas automaticamente após atualizações.

## Variáveis de ambiente

O backend lê `backend/api/.env`. Variáveis principais:

- `DATABASE_URL`: conexão do banco.
- `SECRET_KEY`: chave Flask/JWT.
- `HOST`, `PORT`, `FLASK_DEBUG`: execução local.
- `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_EMAIL`: usuário inicial.
- `VERSION_RETENTION_LIMIT`: quantidade máxima de versões salvas por conteúdo.
- `CORS_ORIGINS`, `CORS_ALLOW_HEADERS`, `CORS_EXPOSE_HEADERS`, `CORS_ALLOW_ALL`: política CORS.

## Front-end estático

As páginas em `docs/` continuam compatíveis com GitHub Pages. Para evitar depender de renderização de servidor como EJS, a reutilização foi feita por módulos JavaScript e CSS compartilhados. Caso o projeto migre para Node/Express, EJS pode ser adicionado como camada de templates sem alterar a organização de dados atual.
