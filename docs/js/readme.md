# docs/js

JavaScript do site estático publicado em `docs/`.

- `main.js`: orquestra renderização da página inicial e inicialização comum das páginas.
- `core.js`: configuração, seletores e carregamento dos JSONs.
- `music-player.js`: player musical reutilizável e responsivo.
- `media-library.js`: normaliza a biblioteca de mídia (`docs/data/media-library.json`) para áudio, imagens e vídeos.
- `about.js`, `curriculum.js`, `editor.js`, `auth.js`: módulos específicos de páginas/sistemas.
- `markdown.js`: interpolação e parsing de textos em Markdown.
- `build.js`: carregamento de templates HTML estáticos.

Frameworks globais carregados nas páginas: Tailwind CDN, Bootstrap e anime.js.
