# scripts

Scripts de manutenção do repositório.

- `config.js`: configuração compartilhada dos scripts.
- `data.js`: helpers de dados.
- `sync-data.js`: sincroniza JSONs entre pastas.
- `sync-pages.js`: sincroniza páginas estáticas.
- `update-readme.js`: atualiza README principal.
- `check-js-modules.js`: valida sintaxe dos módulos ES do front em cópias temporárias `.mjs`.

Execução útil:

```bash
npm run check:js
npm run sync-pages
npm run update-readme
```
