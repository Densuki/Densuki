# utils/json_utils.py
import os
import json
from config import Config

def load_json_data(filename):
    """Carrega dados de um arquivo JSON"""
    json_path = os.path.join(Config.DATA_PATH, filename)
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ Arquivo não encontrado: {json_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao ler JSON: {e}")
        return None

def save_json_data(filename, data):
    """Salva dados em um arquivo JSON"""
    json_path = os.path.join(Config.DATA_PATH, filename)
    
    try:
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ {filename} atualizado em: {json_path}")
        return True
    except Exception as e:
        print(f"⚠️ Não foi possível atualizar o JSON: {e}")
        return False

def get_default_curriculum_data():
    """Retorna dados padrão para currículo"""
    return {
        "contact": {
            "name": "João Gabriel Sousa Santos",
            "location": "Fortaleza - CE",
            "phone": "(85) 9 9217-1191",
            "email": "joaogabriel4175@gmail.com",
            "linkedin": "linkedin.com/in/densuki/",
            "github": "github.com/Densuki"
        },
        "objective": "Atuar nas áreas de atendimento ao cliente, rotinas administrativas e suporte operacional, contribuindo com organização, resolução de problemas e qualidade no atendimento.",
        "summary": "Profissional com experiência em atendimento ao público e suporte em Lan House, além de atuação voluntária em ambiente escolar com apoio administrativo e organizacional. Possuo conhecimentos em informática, Pacote Office e organização documental, buscando oportunidade para desenvolver carreira na área administrativa.",
        "education": [],
        "courses": [],
        "skills": {},
        "experience": [],
        "languages": []
    }

def get_default_about_data():
    """Retorna dados padrão para about"""
    return {
        "bio": [
            "Olá! 👋 Me chamo **João Gabriel**, tenho {{age}} anos e sou natural de {{location}}.",
            "Sou um **Desenvolvedor Full Stack** e **Artista Digital** apaixonado por tecnologia, criatividade e histórias.",
            "Acredito que a tecnologia pode ser uma ferramenta poderosa para conectar pessoas e criar experiências significativas."
        ],
        "objective": "Desenvolver soluções inovadoras que unam tecnologia e arte, impactando positivamente a vida das pessoas.",
        "status": {
            "working": "Desenvolvedor Full Stack & Artista",
            "studying": "React, Node.js e Design de Interfaces"
        },
        "description": "Sou um profissional versátil que transita entre o **código** e a **arte**. Minha jornada começou no mundo do desenvolvimento web, onde descobri a paixão por criar interfaces intuitivas e funcionais.\n\nAlém da programação, sou **artista digital** e **mangaká**, explorando diferentes formas de expressão criativa. Essa combinação única me permite abordar projetos com uma visão holística, unindo técnica e estética.",
        "health": "❤️ Saudável, pratico exercícios regularmente e mantenho uma alimentação equilibrada.",
        "skills": {
            "core": ["Comunicação", "Liderança", "Trabalho em Equipe", "Resolução de Problemas", "Criatividade"],
            "technical": ["JavaScript", "Python", "HTML5", "CSS3", "React", "Node.js", "Git"],
            "creative": ["Desenho", "Ilustração Digital", "Mangá", "Escrita Criativa", "Música"],
            "languages": ["Português (Nativo)", "Inglês (Avançado)", "Espanhol (Básico)"]
        },
        "interests": ["Anime", "Manga", "Programação", "Música", "Games", "Design", "Fotografia", "Viagens"],
        "badges": ["Desenvolvedor", "Artista", "Mangaká", "Escritor", "Músico", "Gamer", "Leitor", "Viajante"],
        "history": [
            "Minha história começou em **{{birthday}}**, quando nasci em {{location}}. Desde criança, sempre fui curioso e apaixonado por histórias.",
            "Aos {{age}} anos, descobri o mundo da programação e me encantei com a possibilidade de criar coisas novas a partir do zero.",
            "Ao longo dos anos, explorei diferentes áreas, desde o **desenvolvimento web** até a **arte digital**, sempre buscando unir tecnologia e criatividade.",
            "Hoje, continuo aprendendo e evoluindo, acreditando que cada dia é uma oportunidade para criar algo incrível."
        ]
    }