# test_db.py
import os
from dotenv import load_dotenv
import pymysql

# Carregar variáveis de ambiente
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    print(f"📡 Conectando ao banco: {DATABASE_URL}")
    try:
        # Parse da URL
        parts = DATABASE_URL.replace('mysql://', '').split('@')
        auth = parts[0].split(':')
        user = auth[0]
        password = auth[1]
        host_db = parts[1].split('/')
        host = host_db[0]
        database = host_db[1] if len(host_db) > 1 else ''
        
        print(f"👤 Usuário: {user}")
        print(f"🏠 Host: {host}")
        print(f"📚 Database: {database}")
        
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            connect_timeout=10
        )
        cursor = conn.cursor()
        
        # Verificar tabelas
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n✅ Tabelas encontradas: {len(tables)}")
        for table in tables:
            print(f"   📋 {table[0]}")
        
        # Verificar usuários
        print("\n👥 Usuários cadastrados:")
        try:
            cursor.execute("SELECT id, username, email, created_at, is_active FROM users")
            users = cursor.fetchall()
            if users:
                print(f"   Total: {len(users)}")
                for u in users:
                    print(f"   👤 ID:{u[0]} | {u[1]} | {u[2]} | Criado: {u[3]} | Ativo: {u[4]}")
            else:
                print("   ⚠️ Nenhum usuário encontrado!")
        except Exception as e:
            print(f"   ❌ Erro ao buscar usuários: {e}")
            # Verificar estrutura da tabela
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            print("\n📋 Estrutura da tabela users:")
            for col in columns:
                print(f"   {col[0]} - {col[1]}")
        
        cursor.close()
        conn.close()
        print("\n✅ Conexão com banco de dados OK!")
        
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
else:
    print("❌ DATABASE_URL não encontrada!")