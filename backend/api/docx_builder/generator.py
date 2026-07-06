"""
=========================================================
DOCX Builder - Generator
---------------------------------------------------------

Arquivo:
    generator.py

Responsável por transformar o JSON do currículo
em um documento DOCX.

=========================================================
"""

from .builder import DocumentBuilder
from .constants import *
from .sections import build, build_custom


class CurriculumGenerator:

    def __init__(self):

        self.builder = DocumentBuilder()

    # =====================================================
    # GERAÇÃO PRINCIPAL
    # =====================================================

    def generate(self, data, section_order=None):
        """
        Gera o currículo completo.
        
        Args:
            data: Dicionário com os dados do currículo
            section_order: Lista opcional com a ordem das seções
        
        Returns:
            Document: Objeto Document do python-docx
        """
        
        # Reinicia o builder para cada geração
        self.builder.reset()
        
        # Constrói todas as seções usando o sections.build
        if section_order:
            build_custom(self.builder, data, section_order)
        else:
            build(self.builder, data)
        
        # Retorna o documento
        return self.builder.build()

    # =====================================================
    # CABEÇALHO
    # =====================================================

    def header(self, data):

        contact = data.get(JSON_CONTACT, {})

        self.builder.title(
            contact.get(CONTACT_NAME, "")
        )

        values = [

            contact.get(CONTACT_LOCATION),

            contact.get(CONTACT_PHONE),

            contact.get(CONTACT_EMAIL),

            contact.get(CONTACT_LINKEDIN),

            contact.get(CONTACT_GITHUB)

        ]

        self.builder.contact_line(values)

        self.builder.spacing()

    # =====================================================
    # OBJETIVO
    # =====================================================

    def objective(self, data):

        text = data.get(JSON_OBJECTIVE)

        if not text:
            return

        self.builder.section(
            SECTION_OBJECTIVE
        )

        self.builder.body(text)

    # =====================================================
    # RESUMO
    # =====================================================

    def summary(self, data):

        text = data.get(JSON_SUMMARY)

        if not text:
            return

        self.builder.section(
            SECTION_SUMMARY
        )

        self.builder.body(text)

    # =====================================================
    # FORMAÇÃO
    # =====================================================

    def education(self, data):

        education = data.get(
            JSON_EDUCATION,
            []
        )

        if not education:
            return

        self.builder.section(
            SECTION_EDUCATION
        )

        for item in education:

            # Converte status para o formato amigável
            status = item.get("status", "")
            status_display = EDUCATION_STATUS.get(
                status.lower() if status else "", 
                status
            )

            self.builder.education(

                degree=item.get("degree", ""),

                institution=item.get("institution", ""),

                period=item.get("period", ""),

                status=status_display

            )

    # =====================================================
    # CURSOS
    # =====================================================

    def courses(self, data):

        courses = data.get(
            JSON_COURSES,
            []
        )

        if not courses:
            return

        self.builder.section(
            SECTION_COURSES
        )

        for item in courses:

            # Converte status para o formato amigável
            status = item.get("status", "")
            status_display = COURSE_STATUS.get(
                status.lower() if status else "", 
                status
            )

            self.builder.course(

                title=item.get("title", ""),

                institution=item.get("institution", ""),

                duration=item.get("duration", ""),

                status=status_display,

                description=item.get("description", "")

            )

# =====================================================
# COMPETÊNCIAS
# =====================================================

def skills(self, data):

    skills = data.get(
        JSON_SKILLS,
        {}
    )

    if not skills:
        return

    self.builder.section(
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

    for category, values in skills.items():  # <-- Mudado de skills_dict para skills

        if not values:
            continue

        # Usa o label mapeado ou capitaliza o nome da categoria
        label = labels.get(category.lower(), category.title())

        self.builder.label_value(

            label,

            ", ".join(values)

        )
        
    # =====================================================
    # EXPERIÊNCIA
    # =====================================================

    def experience(self, data):

        experience = data.get(
            JSON_EXPERIENCE,
            []
        )

        if not experience:
            return

        self.builder.section(
            SECTION_EXPERIENCE
        )

        for item in experience:

            self.builder.experience(

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

    # =====================================================
    # IDIOMAS
    # =====================================================

    def languages(self, data):

        languages = data.get(
            JSON_LANGUAGES,
            []
        )

        if not languages:
            return

        self.builder.section(
            SECTION_LANGUAGES
        )

        for item in languages:

            self.builder.language(

                item.get("language", ""),

                item.get("proficiency", "")

            )

    # =====================================================
    # EXPORTAÇÃO
    # =====================================================

    def save(self, data, filename, section_order=None):
        """
        Gera e salva o currículo em um arquivo.
        
        Args:
            data: Dicionário com os dados do currículo
            filename: Caminho do arquivo para salvar
            section_order: Lista opcional com a ordem das seções
        """
        self.generate(data, section_order)
        self.builder.save(filename)

    def bytes(self, data, section_order=None):
        """
        Gera o currículo e retorna como bytes.
        
        Args:
            data: Dicionário com os dados do currículo
            section_order: Lista opcional com a ordem das seções
        
        Returns:
            BytesIO: Buffer com o documento
        """
        self.generate(data, section_order)
        return self.builder.bytes()

    # =====================================================
    # UTILITÁRIOS
    # =====================================================

    def set_theme(self, theme_name):
        """
        Define um tema para o currículo.
        (Para futura implementação)
        """
        # TODO: Implementar sistema de temas
        pass

    def add_section(self, section_func, data):
        """
        Adiciona uma seção personalizada ao currículo.
        
        Args:
            section_func: Função que recebe builder e dados
            data: Dados para a seção
        """
        section_func(self.builder, data)
        return self