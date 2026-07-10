# 1 - Modulação
Quero retirar redundâncias de sistemas em alguns arquivos, tais como `app.py` e `main.js`, onde com o tempo vou gerando arquivos onde cada um tem sua própria função e organização, tais como os recentes `about.js` e `curriculum.js` e toda lógica e arquivos referentes a eles.

Percebo também que nos arquivos ".html" tem `<style>` e `<script>` que, se possível, queria separá-los via ".css" e ".js" para evitar ter essas lógicas centralizadas no ".html".

# 2 - Modelo Responsivo
Quero que todos os sites respeitem o modelo "mobile first", ou seja, que seja responsivo para qualquer tipo de tela.
Assim eu posso ter a tranquilidade de que qualquer dispositivo será capaz de rodar o meu site.

# 3 - Banco de Dados
Quero que o que tende a ser modificado com frequência, tal como via "editores" seja integrado ao Banco de Dados e tenha um limite de arquivos a ser salvo, onde sempre o mais antigo será deletado.
Assim evita que o Banco de Dados lote. Pode por um limite de até 10 versões a serem salvos.

# 4 - Variáveis de Ambiente
Quero que tenha variáveis de ambiente para facilita manutenção e alterações futuras, para caso eu decida trocar, por exemplo, alguma informação e/ou banco de dados.
Temos o `.env` em `backend/api/.env`, então podemos aproveitá-lo para tal.

# 5 - Organização
Quero que exclua pasta e arquivos que são desnecessários e que não possuam usos no repositório e não agregem ao site.

Em outras palavras, lógicas repetitivas deverá ficar centralizada e serem reutilizadas quando necessárias, assim facilitando a manutenção e edição.
lógicas onde é focado em um sistema deverá ficar centralizado naquele "nicho" e não disperso em outros arquivos, mas apenas outros arquivos referenciando-os via importação.

# 6 - Reformulação
É atrelado a "organização" e "reaproveitamento" / "modulação", onde o foco é otimizar os códigos evitando a centralização em um único arquivo, mas jogando a lógica em seus respectivos arquivos.
Por exemplo, onde é "Currículo", fica centralizado onde é "Currículo" e os arquivos que possuía ele centralizado deixa de tê-lo, mas claro, sem quebrar o código.

Isso significa que você poderá criar novos arquivos, como também movê-los para organizá-los melhor e assim evitando problemas onde o código quebre e/ou falte algum recurso.
Ou seja, poderá descentralizar de tudo onde tem referente ao `app.py` e `main.js` por exemplo.

Se quiser incrementar o ".css" com o "Tailwind" e "anime.js" para customização com mais responsividade, dinâmica e animações sinta-se a vontade.
Além disso, para evitar deixar tudo "um em cima do outro" ou visualmente poluído, poderá usar carrosel, algo que se não me engano eu vi no "boostrap", mas poderá usar qualquer outro "framework" para isso.

Por fim, mas não menos importante, ajustar o sistema de música, onde o menu musical deverá ficar mais "bonito" e "responsivo", também sendo uma referência ao "reaproveitamento", onde ele aparecerá em todas as paginas.
Atualmente ele não se comporta bem em telas pequenas, sendo difícil de interagir.
Dito isso, poderá ajustá-lo melhor para que fique fácil de manipular o volume e alterar as músicas, caso tenha em outras playerlist.
Atualmente também mostra um "pop-up" da lista que tá em reprodução. Poderá por para ser tanto a lista quanto a música, ou então, deixar apenas o nome da música visível.

# 7 - Reaproveitamento
Quero reaproveitar campos repetidos que aparecem em cada página ".html".
Por exemplo, o `<head>` de cada página tendem a ser igual ou levemente diferente... O mesmo pro `<footer>`.
Para evitar a repetição, eu gostaria de que fosse gerado apenas um único arquivo e, a partir dele ele fosse adicionado as demais páginas.
Desse modo ficaria fácil a manutenção e alteração.

Eu me recordo que tinha um tipo de extensão específica para o "front-end" que fazia isso, acho que era o ".ejs" que fazia isso.

# 8 - Documentação
Criar um sistema de documentação, seja por alguma rota + página quanto em arquivo ".md" no projeto, na pasta "Documentação".

# Árvore de Arquivos:
.
├── Documentação
│   └── readme.md
├── README.md
├── arvore_de_arquivos.txt
├── assets
│   ├── books.json
│   ├── cache.json
│   ├── certificates.json
│   ├── courses.json
│   ├── games.json
│   ├── music.json
│   ├── statistics.json
│   └── web
├── backend
│   ├── api
│   │   ├── __init__.py
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── debug
│   │   │   ├── test_db.py
│   │   │   ├── test_health.py
│   │   │   ├── test_login.py
│   │   │   └── wake_up.py
│   │   ├── docx_builder
│   │   │   ├── builder.py
│   │   │   ├── constants.py
│   │   │   ├── generator.py
│   │   │   ├── layout.py
│   │   │   ├── readme.md
│   │   │   ├── sections.py
│   │   │   └── styles.py
│   │   ├── keep_alive.py
│   │   ├── models.py
│   │   ├── requirements.txt
│   │   ├── routes
│   │   │   ├── __init__.py
│   │   │   ├── about_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── curriculum_routes.py
│   │   │   ├── debug_routes.py
│   │   │   ├── download_routes.py
│   │   │   └── profile_routes.py
│   │   ├── utils
│   │   │   ├── __init__.py
│   │   │   ├── docx_utils.py
│   │   │   └── json_utils.py
│   │   └── version.txt
│   └── readme.md
├── docs
│   ├── about.html
│   ├── assets
│   │   ├── audio
│   │   │   └── background.mp3
│   │   ├── css
│   │   │   ├── about_style.css
│   │   │   ├── certificates.css
│   │   │   ├── courses_style.css
│   │   │   ├── curriculum_style.css
│   │   │   ├── project_style.css
│   │   │   └── style.css
│   │   ├── curriculo_pessoal.docx
│   │   ├── curriculo_pessoal.md
│   │   ├── curriculo_pessoal.pdf
│   │   ├── fonts
│   │   ├── icons
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── favicon.ico
│   │   │   ├── site.webmanifest
│   │   │   └── star.png
│   │   └── img
│   │       ├── certificates
│   │       ├── default-project.jpg
│   │       ├── games
│   │       ├── music
│   │       ├── og-image.jpg
│   │       ├── profile.png
│   │       └── projects
│   │           ├── minecraft-forest-1.webp
│   │           ├── minecraft-forest-2.webp
│   │           ├── minecraft-forest-3.webp
│   │           ├── minecraft-forest-4.webp
│   │           ├── minecraft-forest-5.webp
│   │           └── minecraft-forest-6.webp
│   ├── certificates.html
│   ├── courses.html
│   ├── curriculum.html
│   ├── data
│   │   ├── about.json
│   │   ├── books.json
│   │   ├── cache.json
│   │   ├── certificates.json
│   │   ├── courses.json
│   │   ├── current.json
│   │   ├── curriculum.json
│   │   ├── games.json
│   │   ├── music.json
│   │   ├── profile.json
│   │   ├── projects.json
│   │   └── statistics.json
│   ├── index.html
│   ├── js
│   │   ├── about.js
│   │   ├── auth.js
│   │   ├── build.js
│   │   ├── curriculum.js
│   │   ├── data
│   │   │   └── terminalTexts.js
│   │   ├── editor.js
│   │   ├── effects
│   │   │   └── typewriter.js
│   │   ├── main.js
│   │   └── markdown.js
│   ├── projects.html
│   ├── readme.md
│   └── templates
│       ├── badge.html
│       ├── card.html
│       ├── footer.html
│       └── navbar.html
├── generators
│   ├── certificates.js
│   ├── changelog.js
│   ├── courses.js
│   ├── current-book.js
│   ├── current-game.js
│   ├── custom-stats.js
│   └── weekly-song.js
├── js
│   └── data
│       ├── books.json
│       ├── cache.json
│       ├── certificates.json
│       ├── courses.json
│       ├── current.json
│       ├── curriculum.json
│       ├── games.json
│       ├── music.json
│       ├── profile.json
│       ├── projects.json
│       └── statistics.json
├── notes
│   ├── Detalhes_Sobre_Mim.md
│   ├── Detalhes_Sobre_Mim_Estruturado.md
│   ├── Sobre_Mim_-_Rascunho_Yukiri_Densuki.docx
│   ├── correções_futuras.md
│   ├── estrutura_inicial.txt
│   ├── references.md
│   ├── servidor_start.md
│   ├── sobre_mim.md
│   ├── thinkings.md
│   └── tutorial.md
├── others
│   ├── backup
│   │   ├── README.md
│   │   └── index.html
│   ├── setup.sh
│   └── start.sh
├── package-lock.json
├── package.json
├── runtime.txt
├── scripts
│   ├── config.js
│   ├── data.js
│   ├── sync-data.js
│   ├── sync-pages.js
│   └── update-readme.js
├── sections
│   ├── badges.js
│   ├── footer.js
│   ├── profile.js
│   ├── projects.js
│   ├── skills.js
│   ├── socials.js
│   └── statistics.js
├── start.js
├── templates
│   ├── badge.md
│   ├── card.md
│   ├── section.md
│   └── web
│       └── readme.md
└── utils
    ├── age.js
    ├── dates.js
    ├── file.js
    ├── github.js
    ├── logger.js
    ├── markdown.js
    └── replace.js

37 directories, 156 files
