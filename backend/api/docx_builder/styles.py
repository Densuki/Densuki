"""
=========================================================
DOCX Builder - Styles
---------------------------------------------------------

Responsável por criar todos os estilos utilizados
pelo gerador de documentos.

Nenhuma seção deve configurar fontes manualmente.

Sempre utilize:

    apply_paragraph_style()

ou

    apply_run_style()

=========================================================
"""

from docx.enum.text import (
    WD_PARAGRAPH_ALIGNMENT,
    WD_LINE_SPACING
)

from docx.enum.style import WD_STYLE_TYPE

from docx.shared import Pt

from docx.oxml.ns import qn

from .constants import *


# ==========================================================
# CRIA TODOS OS ESTILOS
# ==========================================================

def create_styles(document):
    """
    Cria todos os estilos da biblioteca.

    Chame apenas UMA VEZ.
    """

    create_title_style(document)
    create_contact_style(document)
    create_section_style(document)
    create_body_style(document)
    create_label_style(document)
    create_value_style(document)
    create_company_style(document)
    create_position_style(document)
    create_period_style(document)
    create_bullet_style(document)


# ==========================================================
# UTILITÁRIO
# ==========================================================

def _create_style(document, style_name):
    """
    Cria um estilo se ele não existir.
    Retorna o estilo existente ou o novo criado.
    """
    styles = document.styles
    
    try:
        # Tenta acessar o estilo existente
        return styles[style_name]
    except KeyError:
        # Se não existir, cria um novo
        return styles.add_style(
            style_name,
            WD_STYLE_TYPE.PARAGRAPH
        )


# ==========================================================
# TÍTULO
# ==========================================================

def create_title_style(document):

    style = _create_style(document, STYLE_TITLE)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_TITLE
    font.bold = True
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    style.paragraph_format.space_after = SPACE_NORMAL
    style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE


# ==========================================================
# CONTATO
# ==========================================================

def create_contact_style(document):

    style = _create_style(document, STYLE_CONTACT)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    style.paragraph_format.space_after = SPACE_SMALL


# ==========================================================
# TÍTULOS DAS SEÇÕES
# ==========================================================

def create_section_style(document):

    style = _create_style(document, STYLE_SECTION)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_SECTION
    font.bold = True
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.space_before = SPACE_SECTION
    style.paragraph_format.space_after = SPACE_NORMAL


# ==========================================================
# TEXTO
# ==========================================================

def create_body_style(document):

    style = _create_style(document, STYLE_BODY)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_after = SPACE_SMALL


# ==========================================================
# LABEL
# ==========================================================

def create_label_style(document):

    style = _create_style(document, STYLE_LABEL)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    font.bold = True
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR


# ==========================================================
# VALUE
# ==========================================================

def create_value_style(document):

    style = _create_style(document, STYLE_VALUE)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR


# ==========================================================
# EMPRESA
# ==========================================================

def create_company_style(document):

    style = _create_style(document, STYLE_COMPANY)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_SUBTITLE
    font.bold = True
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.space_before = SPACE_MEDIUM
    style.paragraph_format.space_after = SPACE_SMALL


# ==========================================================
# CARGO
# ==========================================================

def create_position_style(document):

    style = _create_style(document, STYLE_POSITION)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    font.bold = True
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.space_after = SPACE_SMALL


# ==========================================================
# PERÍODO
# ==========================================================

def create_period_style(document):

    style = _create_style(document, STYLE_PERIOD)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_SMALL
    font.italic = True
    font.color.rgb = COLOR_DARK_GRAY

    style.paragraph_format.space_after = SPACE_NORMAL


# ==========================================================
# BULLET
# ==========================================================

def create_bullet_style(document):

    style = _create_style(document, STYLE_BULLET)

    font = style.font

    font.name = FONT_NAME
    font.size = FONT_SIZE_NORMAL
    if FONT_COLOR:
        font.color.rgb = FONT_COLOR

    style.paragraph_format.left_indent = Pt(12)
    style.paragraph_format.space_after = SPACE_SMALL


# ==========================================================
# APLICAR ESTILO AO PARÁGRAFO
# ==========================================================

def apply_paragraph_style(paragraph, style_name):
    """
    Aplica um estilo previamente criado
    ao parágrafo.
    """

    paragraph.style = style_name


# ==========================================================
# APLICAR ESTILO AO RUN
# ==========================================================

def apply_run_style(run, style_name):
    """
    Copia a formatação do estilo para o Run.

    O python-docx não possui suporte
    completo para estilos de Run,
    então copiamos manualmente.
    """

    try:
        style = run.part.document.styles[style_name]
    except KeyError:
        # Se o estilo não existir, usa o estilo normal
        return

    font = style.font

    # Configura nome da fonte
    if font.name:
        run.font.name = font.name

    # Configura tamanho da fonte
    if font.size:
        run.font.size = font.size

    # Configura negrito
    if font.bold is not None:
        run.font.bold = font.bold

    # Configura itálico
    if font.italic is not None:
        run.font.italic = font.italic

    # Configura cor - CORREÇÃO: não usa deepcopy
    try:
        if font.color and font.color.rgb:
            # Acessa os valores RGB diretamente e cria uma nova cor
            rgb = font.color.rgb
            if hasattr(rgb, 'r') and hasattr(rgb, 'g') and hasattr(rgb, 'b'):
                from docx.shared import RGBColor
                run.font.color.rgb = RGBColor(rgb.r, rgb.g, rgb.b)
    except Exception:
        # Se não conseguir copiar a cor, ignora
        pass

    # Configura fonte para caracteres asiáticos (compatibilidade)
    try:
        if font.name:
            run._element.rPr.rFonts.set(
                qn("w:eastAsia"),
                font.name
            )
    except AttributeError:
        pass


# ==========================================================
# RESET
# ==========================================================

def recreate_styles(document):
    """
    Recria todos os estilos.

    Útil para futuros sistemas de temas.
    """

    create_styles(document)