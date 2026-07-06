"""
=========================================================
DOCX Builder - Sections
---------------------------------------------------------

Arquivo:
    sections.py

Responsável por escrever cada seção do currículo.

Cada função recebe um DocumentBuilder e os dados
referentes àquela seção.

=========================================================
"""

from .constants import *


# ==========================================================
# CABEÇALHO
# ==========================================================

def header(builder, contact):

    if not contact:
        return

    builder.title(
        contact.get(CONTACT_NAME, "")
    )

    builder.contact_line([

        contact.get(CONTACT_LOCATION),

        contact.get(CONTACT_PHONE),

        contact.get(CONTACT_EMAIL),

        contact.get(CONTACT_LINKEDIN),

        contact.get(CONTACT_GITHUB)

    ])

    builder.spacing()


# ==========================================================
# OBJETIVO
# ==========================================================

def objective(builder, text):

    if not text:
        return

    builder.section(
        SECTION_OBJECTIVE
    )

    builder.body(text)


# ==========================================================
# RESUMO
# ==========================================================

def summary(builder, text):

    if not text:
        return

    builder.section(
        SECTION_SUMMARY
    )

    builder.body(text)


# ==========================================================
# FORMAÇÃO
# ==========================================================

def education(builder, education_list):

    if not education_list:
        return

    builder.section(
        SECTION_EDUCATION
    )

    for item in education_list:

        # Converte status para o formato amigável
        status = item.get("status", "")
        status_display = EDUCATION_STATUS.get(
            status.lower() if status else "", 
            status
        )

        builder.education(

            degree=item.get("degree", ""),

            institution=item.get("institution", ""),

            period=item.get("period", ""),

            status=status_display

        )


# ==========================================================
# CURSOS
# ==========================================================

def courses(builder, courses_list):

    if not courses_list:
        return

    builder.section(
        SECTION_COURSES
    )

    for item in courses_list:

        # Converte status para o formato amigável
        status = item.get("status", "")
        status_display = COURSE_STATUS.get(
            status.lower() if status else "", 
            status
        )

        builder.course(

            title=item.get("title", ""),

            institution=item.get("institution", ""),

            duration=item.get("duration", ""),

            status=status_display,

            description=item.get("description", "")

        )


# ==========================================================
# COMPETÊNCIAS
# ==========================================================

def skills(builder, skills_dict):

    if not skills_dict:
        return

    builder.section(
        SECTION_SKILLS
    )

    # Mapeamento flexível de categorias
    labels = {
        "core": "Soft Skills",
        "technical": "Hard Skills",
        "soft": "Soft Skills",
        "hard": "Hard Skills",
        "programming": "Programação",
        "languages": "Idiomas",
        "tools": "Ferramentas",
        "frameworks": "Frameworks",
        "databases": "Banco de Dados",
        "cloud": "Cloud Computing",
        "devops": "DevOps",
        "agile": "Metodologias Ágeis",
        "design": "Design",
        "management": "Gerenciamento",
        "communication": "Comunicação",
        "leadership": "Liderança"
    }

    for category, values in skills_dict.items():

        if not values:
            continue

        # Usa o label mapeado ou capitaliza o nome da categoria
        label = labels.get(category.lower(), category.title())

        builder.label_value(
            label,
            ", ".join(values)
        )


# ==========================================================
# EXPERIÊNCIA
# ==========================================================

def experience(builder, experience_list):

    if not experience_list:
        return

    builder.section(
        SECTION_EXPERIENCE
    )

    for item in experience_list:

        builder.experience(

            company=item.get("company", ""),

            position=item.get("position", ""),

            start=item.get("startDate", ""),

            end=item.get("endDate", ""),

            location=item.get("location", ""),

            responsibilities=item.get(
                "responsibilities",
                []
            )

        )


# ==========================================================
# IDIOMAS
# ==========================================================

def languages(builder, languages_list):

    if not languages_list:
        return

    builder.section(
        SECTION_LANGUAGES
    )

    for item in languages_list:

        builder.language(

            item.get("language", ""),

            item.get("proficiency", "")

        )


# ==========================================================
# GERAÇÃO COMPLETA
# ==========================================================

def build(builder, data):
    """
    Gera todas as seções do currículo.
    Retorna o DocumentBuilder com todas as seções adicionadas.
    """

    # Cabeçalho
    header(
        builder,
        data.get(JSON_CONTACT)
    )

    # Objetivo
    objective(
        builder,
        data.get(JSON_OBJECTIVE)
    )

    # Resumo
    summary(
        builder,
        data.get(JSON_SUMMARY)
    )

    # Formação
    education(
        builder,
        data.get(JSON_EDUCATION)
    )

    # Cursos
    courses(
        builder,
        data.get(JSON_COURSES)
    )

    # Competências
    skills(
        builder,
        data.get(JSON_SKILLS)
    )

    # Experiência
    experience(
        builder,
        data.get(JSON_EXPERIENCE)
    )

    # Idiomas
    languages(
        builder,
        data.get(JSON_LANGUAGES)
    )

    # Retorna o builder para permitir encadeamento
    return builder


# ==========================================================
# BUILD COM ORDEM PERSONALIZADA
# ==========================================================

def build_custom(builder, data, section_order=None):
    """
    Gera as seções em uma ordem personalizada.
    
    Args:
        builder: DocumentBuilder instance
        data: Dicionário com os dados do currículo
        section_order: Lista com os nomes das seções na ordem desejada
                      Se None, usa a ordem padrão
    
    Exemplo:
        order = ['header', 'summary', 'experience', 'skills']
    """
    
    if section_order is None:
        return build(builder, data)
    
    # Mapeamento de seções para funções
    section_map = {
        'header': (header, JSON_CONTACT),
        'objective': (objective, JSON_OBJECTIVE),
        'summary': (summary, JSON_SUMMARY),
        'education': (education, JSON_EDUCATION),
        'courses': (courses, JSON_COURSES),
        'skills': (skills, JSON_SKILLS),
        'experience': (experience, JSON_EXPERIENCE),
        'languages': (languages, JSON_LANGUAGES)
    }
    
    for section_name in section_order:
        if section_name in section_map:
            func, key = section_map[section_name]
            func(builder, data.get(key))
    
    return builder