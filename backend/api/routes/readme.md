# backend/api/routes

Rotas HTTP agrupadas por nicho funcional para evitar concentração de regras em `app.py`.

- `auth_routes.py`: login, registro e verificação de token.
- `curriculum_routes.py`: leitura, atualização, histórico e versionamento do currículo.
- `about_routes.py`: leitura, atualização, histórico e versionamento da página Sobre.
- `profile_routes.py`: leitura e atualização versionada do perfil.
- `download_routes.py`: geração/download de documentos.
- `debug_routes.py`: endpoints de diagnóstico e saúde da API.

As rotas que alteram dados usam `@token_required` e as versões antigas são podadas por `services.prune_old_versions`.
