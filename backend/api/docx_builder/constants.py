"""
=========================================================
DOCX Builder - Constants
---------------------------------------------------------
Objetivo:
    Centralizar todas as constantes utilizadas pelo
    gerador de currículos.

Dessa forma evitamos "números mágicos" espalhados
pelo código e facilitamos futuras alterações.

=========================================================
"""

from docx.shared import Cm, Pt, RGBColor


# =========================================================
# METADADOS
# =========================================================

DOCUMENT_TITLE = "Currículo"

DEFAULT_FILENAME = "Curriculo.docx"

AUTHOR = "Yukiri Densuki"

COMPANY = ""

SUBJECT = "Currículo Profissional"

CATEGORY = "Currículo"

LANGUAGE = "pt-BR"


# =========================================================
# CONFIGURAÇÃO DA PÁGINA
# =========================================================

PAGE_WIDTH = Cm(21.0)
PAGE_HEIGHT = Cm(29.7)

MARGIN_TOP = Cm(2.5)
MARGIN_BOTTOM = Cm(2.5)
MARGIN_LEFT = Cm(2.5)
MARGIN_RIGHT = Cm(2.5)


# =========================================================
# ESPAÇAMENTOS
# =========================================================

SPACE_NONE = Pt(0)

SPACE_SMALL = Pt(3)

SPACE_NORMAL = Pt(6)

SPACE_MEDIUM = Pt(10)

SPACE_LARGE = Pt(16)

SPACE_SECTION = Pt(18)


# =========================================================
# FONTES
# =========================================================

FONT_NAME = "Calibri"

FONT_NAME_FALLBACK = "Arial"

FONT_COLOR = RGBColor(0, 0, 0)


# =========================================================
# TAMANHOS DAS FONTES
# =========================================================

FONT_SIZE_SMALL = Pt(9)

FONT_SIZE_NORMAL = Pt(11)

FONT_SIZE_SUBTITLE = Pt(12)

FONT_SIZE_SECTION = Pt(13)

FONT_SIZE_TITLE = Pt(18)


# =========================================================
# ESTILOS
# =========================================================

STYLE_TITLE = "TITLE"

STYLE_CONTACT = "CONTACT"

STYLE_SECTION = "SECTION"

STYLE_BODY = "BODY"

STYLE_LABEL = "LABEL"

STYLE_VALUE = "VALUE"

STYLE_BULLET = "BULLET"

STYLE_COMPANY = "COMPANY"

STYLE_POSITION = "POSITION"

STYLE_PERIOD = "PERIOD"


# =========================================================
# CORES
# =========================================================

COLOR_BLACK = RGBColor(0, 0, 0)

COLOR_DARK_GRAY = RGBColor(70, 70, 70)

COLOR_LIGHT_GRAY = RGBColor(130, 130, 130)

COLOR_BLUE = RGBColor(31, 78, 121)


# =========================================================
# ALINHAMENTOS
# =========================================================

ALIGN_LEFT = "left"

ALIGN_CENTER = "center"

ALIGN_RIGHT = "right"

ALIGN_JUSTIFY = "justify"


# =========================================================
# SÍMBOLOS
# =========================================================

BULLET = "•"

SEPARATOR = " • "

LINE = "—"


# =========================================================
# TÍTULOS DAS SEÇÕES
# =========================================================

SECTION_OBJECTIVE = "OBJETIVO PROFISSIONAL"

SECTION_SUMMARY = "RESUMO PROFISSIONAL"

SECTION_EDUCATION = "FORMAÇÃO ACADÊMICA"

SECTION_COURSES = "CURSOS E CERTIFICAÇÕES"

SECTION_SKILLS = "COMPETÊNCIAS"

SECTION_EXPERIENCE = "EXPERIÊNCIAS PROFISSIONAIS"

SECTION_LANGUAGES = "IDIOMAS"


# =========================================================
# STATUS DE CURSOS
# =========================================================

COURSE_STATUS = {

    "concluido": "Concluído",

    "completo": "Concluído",

    "andamento": "Em andamento",

    "planejado": "Planejado",

    "cancelado": "Cancelado",

    "pendente": "Pendente",

}


# =========================================================
# STATUS DE FORMAÇÃO
# =========================================================

EDUCATION_STATUS = {

    "concluido": "Concluído",

    "completo": "Concluído",

    "incompleto": "Incompleto",

    "trancado": "Trancado",

    "interrompido": "Interrompido",

    "andamento": "Em andamento",

}


# =========================================================
# ORDEM PADRÃO DAS SEÇÕES
# =========================================================

DEFAULT_SECTION_ORDER = [

    "header",

    "objective",

    "summary",

    "education",

    "courses",

    "skills",

    "experience",

    "languages",

]


# =========================================================
# CHAVES DO JSON
# =========================================================

JSON_CONTACT = "contact"

JSON_OBJECTIVE = "objective"

JSON_SUMMARY = "summary"

JSON_EDUCATION = "education"

JSON_COURSES = "courses"

JSON_SKILLS = "skills"

JSON_EXPERIENCE = "experience"

JSON_LANGUAGES = "languages"


# =========================================================
# CAMPOS DO CONTATO
# =========================================================

CONTACT_NAME = "name"

CONTACT_LOCATION = "location"

CONTACT_PHONE = "phone"

CONTACT_EMAIL = "email"

CONTACT_LINKEDIN = "linkedin"

CONTACT_GITHUB = "github"


# =========================================================
# MENSAGENS
# =========================================================

ERROR_EMPTY_DATA = "Nenhum dado foi informado."

ERROR_INVALID_DATA = "Estrutura do currículo inválida."

SUCCESS_DOCUMENT_CREATED = "Documento criado com sucesso."


# =========================================================
# FUTURAS IMPLEMENTAÇÕES
# =========================================================

ENABLE_HEADER = False

ENABLE_FOOTER = False

ENABLE_PAGE_NUMBER = False

ENABLE_WATERMARK = False

ENABLE_THEME_SYSTEM = True

DEFAULT_THEME = "classic"