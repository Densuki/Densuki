# DOCX Builder

Biblioteca responsável por gerar documentos `.docx` dinamicamente utilizando **python-docx**, separando completamente a lógica do currículo da lógica de formatação.

O objetivo desta arquitetura é permitir que qualquer currículo, relatório ou documento seja montado apenas alterando os dados, sem precisar editar o código responsável pelo Word.

---

# Estrutura

```
docx_builder/

│
├── constants.py
├── layout.py
├── styles.py
├── builder.py
├── sections.py
├── generator.py
│
└── README.md
```

---

# Fluxo da geração

```
JSON
   │
   ▼
generator.py
   │
   ▼
sections.py
   │
   ▼
builder.py
   │
   ▼
styles.py
layout.py
   │
   ▼
python-docx
   │
   ▼
Curriculo.docx
```

---

# Responsabilidade de cada arquivo

---

## constants.py

Responsável por armazenar todas as constantes da biblioteca.

Exemplos:

* Fonte
* Cor
* Margens
* Espaçamentos
* Nome das seções
* Símbolos
* Campos do JSON
* Status

Nunca escreva valores "fixos" nos outros arquivos.

Exemplo incorreto:

```python
font.size = Pt(11)
```

Exemplo correto:

```python
font.size = FONT_SIZE_NORMAL
```

Assim todas as alterações ficam centralizadas.

---

## layout.py

Responsável pela configuração física do documento.

Este arquivo configura:

* tamanho da folha
* margens
* cabeçalho
* rodapé
* metadados
* orientação

Ele **não escreve conteúdo**.

Sempre que quiser alterar:

* margens
* tamanho A4
* orientação paisagem
* cabeçalho
* rodapé

o local correto será este arquivo.

---

## styles.py

Responsável pelos estilos.

Aqui ficam definidos:

* título
* contato
* texto
* bullets
* empresa
* cargo
* período
* seções

Nenhuma outra parte da biblioteca deve configurar:

* fonte
* tamanho
* negrito
* alinhamento

Tudo deve passar pelos estilos.

---

## builder.py

É o coração da biblioteca.

Ele conhece o python-docx.

Toda escrita no Word passa por ele.

Exemplos:

```python
builder.title(...)
```

```python
builder.body(...)
```

```python
builder.section(...)
```

```python
builder.bullet(...)
```

```python
builder.company(...)
```

```python
builder.position(...)
```

```python
builder.period(...)
```

```python
builder.label_value(...)
```

Nunca utilize diretamente:

```python
document.add_paragraph(...)
```

fora do builder.

Caso seja necessário criar novos componentes, eles devem ser adicionados aqui.

Exemplos:

```
builder.table()

builder.image()

builder.link()

builder.quote()

builder.code()

builder.columns()
```

---

## sections.py

É responsável apenas por montar cada parte do currículo.

Cada função recebe um Builder.

Exemplo:

```
Resumo

Experiência

Cursos

Idiomas
```

Ela não sabe como o Word funciona.

Ela apenas diz:

```
builder.section(...)

builder.body(...)
```

Caso deseje adicionar uma nova seção, crie uma nova função.

Exemplo:

```python
def projects(builder, projects):
```

Depois registre essa função dentro de:

```
build(...)
```

---

## generator.py

É o controlador.

Recebe o JSON completo.

Chama todas as seções.

Retorna o Document.

Ele não deve conter lógica de layout.

Ele apenas organiza a ordem das seções.

---

# Como adicionar uma nova seção

Exemplo:

Projetos.

---

## 1)

Adicionar a constante.

constants.py

```python
SECTION_PROJECTS = "PROJETOS"
```

---

## 2)

Criar função.

sections.py

```python
def projects(builder, projects):

    builder.section(SECTION_PROJECTS)

    ...
```

---

## 3)

Registrar.

```
build(...)
```

---

## 4)

Chamar.

generator.py

```
self.projects(data)
```

Pronto.

---

# Como alterar uma fonte

Nunca altere:

```
builder.py
```

O correto é editar:

```
styles.py
```

Exemplo:

```python
FONT_NAME = "Calibri"
```

para

```python
FONT_NAME = "Aptos"
```

---

# Como alterar as margens

Editar apenas:

```
layout.py
```

Exemplo:

```python
MARGIN_TOP
```

---

# Como alterar o tamanho da fonte

Editar:

```
constants.py
```

Exemplo:

```python
FONT_SIZE_TITLE

FONT_SIZE_SECTION

FONT_SIZE_NORMAL

FONT_SIZE_SMALL
```

---

# Como adicionar novos estilos

1.

Criar constante.

```
STYLE_WARNING
```

2.

Criar função.

```
create_warning_style()
```

3.

Registrar.

```
create_styles()
```

Depois poderá ser utilizado em qualquer lugar.

---

# Como adicionar um novo componente

Exemplo:

Imagem.

Adicionar em:

```
builder.py
```

```python
builder.image(...)
```

Depois utilizar normalmente.

---

# Como alterar a ordem das seções

Existem duas formas.

### Opção 1

Alterar a ordem dentro do:

```
generator.py
```

### Opção 2

Alterar a ordem dentro de:

```
sections.build(...)
```

---

# Como criar outro template

O ideal é manter vários geradores.

Exemplo:

```
generator_classic.py

generator_modern.py

generator_ats.py
```

Todos podem reutilizar:

* constants.py
* builder.py
* layout.py
* styles.py

Mudando apenas a forma como as seções são organizadas.

---

# Como criar temas

Exemplo:

```
themes/

classic.py

modern.py

minimal.py

dark.py
```

Cada tema altera:

* fontes
* cores
* margens
* espaçamentos

Sem alterar o restante da biblioteca.

---

# Convenções do projeto

Sempre seguir as seguintes regras:

* Nunca acessar `Document()` fora do `builder.py`.
* Nunca configurar fontes fora do `styles.py`.
* Nunca configurar margens fora do `layout.py`.
* Nunca colocar textos fixos fora do `constants.py`.
* Nunca utilizar `document.add_paragraph()` diretamente em `sections.py`.
* Toda escrita deve passar pelo `DocumentBuilder`.
* Toda nova funcionalidade deve ser reutilizável.

---

# Objetivo da arquitetura

Esta biblioteca foi projetada para ser reutilizada em qualquer projeto que necessite gerar documentos Word.

A ideia principal é separar completamente:

* Dados
* Estrutura
* Estilo
* Layout
* Geração

Isso permite criar diversos modelos de documentos apenas alterando o gerador e as seções, sem modificar a infraestrutura da biblioteca.

Essa organização facilita manutenção, reutilização, testes, criação de novos templates e futuras expansões, como suporte a tabelas, imagens, QR Codes, gráficos, cabeçalhos personalizados, múltiplos temas e outros tipos de documentos além de currículos.

## Organização dos módulos

- `generator.py`: orquestra a geração do documento.
- `builder.py`: cria e combina elementos do DOCX.
- `sections.py`: monta as seções de conteúdo.
- `styles.py`, `layout.py`, `constants.py`: concentram aparência, layout e constantes reutilizáveis.
